import MongoBlockchainLedger from '../models/mongo/BlockchainLedger.js';
import SurveyDataAggregationService from './surveyDataAggregationService.js';
import { HASH_VERSION, hashJsonStable, legacyHash, canonicalize, stableStringify } from './hashing.js';

class LedgerV2Service {
	constructor() {
		this.aggregator = new SurveyDataAggregationService();
	}

	// Build section hashes from live DB data
	buildSectionHashes = (surveyData) => {
		const result = {};
		for (const [section, payload] of Object.entries(surveyData || {})) {
			if (payload && payload.data) {
				const h = hashJsonStable(payload.data);
				result[section] = { hash: h, hash_version: HASH_VERSION, last_updated: payload.last_updated };
			}
		}
		return result;
	};

	// Append a timeline event by creating a new block chained to the latest one
	appendTimelineEvent = async (surveyNumber, officerId, action, metadata = {}, remarks = '', projectId = null) => {
		// Find latest block; if none, create from live first
		let latest = await MongoBlockchainLedger.findOne({ survey_number: surveyNumber }).sort({ timestamp: -1 });
		if (!latest) {
			await this.createOrUpdateFromLive(surveyNumber, officerId, projectId, 'auto_create_for_timeline');
			latest = await MongoBlockchainLedger.findOne({ survey_number: surveyNumber }).sort({ timestamp: -1 });
		}

		const previousHash = latest?.current_hash || '0x' + '0'.repeat(64);
		const sectionHashes = {};
		// Keep existing data_root if survey_data unchanged
		const data_root = latest?.data_root || this.computeDataRoot(this.buildSectionHashes(latest?.survey_data || {}));

		const newEvent = {
			action,
			timestamp: new Date(),
			officer_id: officerId,
			data_hash: hashJsonStable({ action, metadata }),
			previous_hash: previousHash,
			metadata,
			remarks
		};

		const block = new MongoBlockchainLedger({
			block_id: `BLOCK_${surveyNumber}_${Date.now()}`,
			survey_number: surveyNumber,
			event_type: action,
			officer_id: officerId,
			project_id: projectId || latest?.project_id || null,
			survey_data: latest?.survey_data || {},
			hash_version: HASH_VERSION,
			data_root,
			timeline_history: [ ...(latest?.timeline_history || []), newEvent ],
			metadata: { ...(latest?.metadata || {}), source: 'ledger_v2_timeline' },
			remarks,
			timestamp: new Date(),
			previous_hash: previousHash,
			nonce: Math.floor(Math.random() * 1_000_000),
		});

		block.current_hash = this.computeBlockHash(block);
		const saved = await block.save();
		return { success: true, block_id: saved.block_id, hash: saved.current_hash, total_events: saved.timeline_history?.length || 0 };
	};

	// Root over sorted section hashes (present sections only)
	computeDataRoot = (sectionHashMap) => {
		const mapForRoot = {};
		Object.keys(sectionHashMap).sort().forEach((k) => { mapForRoot[k] = sectionHashMap[k].hash; });
		return hashJsonStable(mapForRoot);
	};

	// Compute block hash excluding volatile fields
	computeBlockHash = (block) => {
		const header = {
			block_id: block.block_id,
			survey_number: block.survey_number,
			event_type: block.event_type,
			officer_id: block.officer_id,
			project_id: block.project_id,
			hash_version: HASH_VERSION,
			data_root: block.data_root,
			survey_data: block.survey_data, // still deterministic due to stable hashing
			timeline_history: block.timeline_history,
			metadata: block.metadata,
			remarks: block.remarks,
			previous_hash: block.previous_hash,
			nonce: block.nonce,
		};
		return hashJsonStable(header);
	};

	// Create or update from LIVE DB. If explicitEventType is provided, use it for the new block/timeline.
	createOrUpdateFromLive = async (surveyNumber, officerId, projectId = null, remarks = '', explicitEventType = null) => {
		// Fetch latest block for prev hash reference
		const existing = await MongoBlockchainLedger.findOne({ survey_number: surveyNumber }).sort({ timestamp: -1 });
		const previousHash = existing?.current_hash || '0x' + '0'.repeat(64);

		// Aggregate live data
		const surveyData = await this.aggregator.getCompleteSurveyData(surveyNumber);
		const sectionHashes = this.buildSectionHashes(surveyData);
		const data_root = this.computeDataRoot(sectionHashes);

		// Normalize survey_data hashes to v2 so verification compares like-with-like
		const normalizedSurveyData = {};
		for (const [section, payload] of Object.entries(surveyData || {})) {
			if (payload && payload.data) {
				const v2Hash = sectionHashes[section]?.hash || hashJsonStable(payload.data);
				normalizedSurveyData[section] = { ...payload, hash: v2Hash };
			} else {
				normalizedSurveyData[section] = payload;
			}
		}

		const eventType = explicitEventType || (existing ? 'SURVEY_DATA_UPDATED' : 'SURVEY_CREATED_ON_BLOCKCHAIN');
		const block = new MongoBlockchainLedger({
			block_id: `BLOCK_${surveyNumber}_${Date.now()}`,
			survey_number: surveyNumber,
			event_type: eventType,
			officer_id: officerId,
			project_id: projectId,
			survey_data: normalizedSurveyData,
			hash_version: HASH_VERSION,
			data_root,
			timeline_history: [
				...(existing?.timeline_history || []),
				{ action: eventType, timestamp: new Date(), officer_id: officerId, data_hash: data_root, previous_hash: previousHash, metadata: { source: 'ledger_v2' }, remarks },
			],
			metadata: { ...existing?.metadata, source: 'ledger_v2' },
			remarks,
			timestamp: new Date(),
			previous_hash: previousHash,
			nonce: Math.floor(Math.random() * 1_000_000),
		});

		block.current_hash = this.computeBlockHash(block);
		const saved = await block.save();
		return { success: true, block_id: saved.block_id, hash: saved.current_hash, data_root: saved.data_root };
	};

	verify = async (surveyNumber) => {
		const block = await MongoBlockchainLedger.findOne({ survey_number: surveyNumber }).sort({ timestamp: -1 });
		if (!block) {
			return { isValid: false, reason: 'No blockchain block found', survey_number: surveyNumber };
		}

		// Chain integrity
		const chainIntegrity = await MongoBlockchainLedger.verifyChainIntegrity(surveyNumber);

		// Live recomputation
		const live = await this.aggregator.getCompleteSurveyData(surveyNumber);
		const liveSectionHashes = this.buildSectionHashes(live);
		const live_root = this.computeDataRoot(liveSectionHashes);

		// Section-by-section compare, with legacy fallback
		const dataIntegrity = {};
		for (const [section, liveEntry] of Object.entries(live || {})) {
			const stored = block.survey_data?.[section];
			if (!stored?.data && !liveEntry?.data) {
				dataIntegrity[section] = { isValid: true, storedHash: null, currentHash: null, lastUpdated: null };
				continue;
			}
			if (!stored?.data && liveEntry?.data) {
				dataIntegrity[section] = { isValid: true, storedHash: null, currentHash: liveSectionHashes[section]?.hash || null, lastUpdated: stored?.last_updated || null, comparisonSource: 'live_without_ledger_hash' };
				continue;
			}
			if (stored?.data && !liveEntry?.data) {
				dataIntegrity[section] = { isValid: false, storedHash: stored.hash, currentHash: null, lastUpdated: stored.last_updated, comparisonSource: 'ledger_without_live' };
				continue;
			}

			const currentLiveHash = hashJsonStable(liveEntry.data);
			const isMatch = stored.hash === currentLiveHash || stored.hash === legacyHash(liveEntry.data);
			dataIntegrity[section] = {
				isValid: isMatch,
				storedHash: stored.hash,
				currentHash: currentLiveHash,
				lastUpdated: stored.last_updated,
				comparisonSource: isMatch && stored.hash === currentLiveHash ? 'live_db_v2' : (isMatch ? 'live_db_v1_legacy' : 'mismatch')
			};
		}

		// Block-level compare: recompute expected block hash from live data
		const recomputedHeader = {
			block_id: block.block_id,
			survey_number: block.survey_number,
			event_type: block.event_type,
			officer_id: block.officer_id,
			project_id: block.project_id,
			hash_version: HASH_VERSION,
			data_root: live_root,
			survey_data: live,
			timeline_history: block.timeline_history,
			metadata: block.metadata,
			remarks: block.remarks,
			previous_hash: block.previous_hash,
			nonce: block.nonce,
		};
		const expectedBlockHash = hashJsonStable(recomputedHeader);

		const overallIntegrity = chainIntegrity.isValid && Object.values(dataIntegrity).every((s) => s.isValid);
		return {
			isValid: overallIntegrity,
			reason: overallIntegrity ? 'All integrity checks passed' : 'Integrity check failed',
			survey_number: surveyNumber,
			chain_integrity: chainIntegrity,
			data_integrity: dataIntegrity,
			block_hash: block.current_hash,
			last_updated: block.updatedAt,
			data_root: { stored: block.data_root, live: live_root, expectedBlockHash },
		};
	};
}

export default LedgerV2Service;


