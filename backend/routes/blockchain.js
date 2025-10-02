import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import EnhancedBlockchainService from '../services/enhancedBlockchainService.js';
import LedgerV2Service from '../services/ledgerV2Service.js';
import MongoBlockchainLedger from '../models/mongo/BlockchainLedger.js';
import SurveyDataAggregationService from '../services/surveyDataAggregationService.js';
import { HASH_VERSION, hashJsonStable } from '../services/hashing.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const enhancedBlockchainService = new EnhancedBlockchainService();
const ledgerV2 = new LedgerV2Service();

// Initialize blockchain service
enhancedBlockchainService.initialize().catch(console.error);

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
        success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
};

// ===== BLOCKCHAIN STATUS & HEALTH =====

/**
 * @route GET /api/blockchain/status
 * @desc Get blockchain network status (public endpoint)
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    // 🔧 FIX: Add timeout protection and better error handling
    const statusPromise = enhancedBlockchainService.getEnhancedNetworkStatus();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    const status = await Promise.race([statusPromise, timeoutPromise]);
    res.json(status);
  } catch (error) {
    console.error('❌ Blockchain status error:', error);
    
    // 🔧 FIX: Return cached/fallback status instead of 500 error
    res.json({
      success: false,
      message: 'Blockchain status temporarily unavailable',
      error: error.message,
      data: {
        status: {
          isInitialized: false,
          timestamp: new Date().toISOString()
        },
        network: {
          name: 'polygon_amoy',
          chainId: 80002,
          rpcUrl: 'https://rpc-amoy.polygon.technology',
          wsUrl: 'wss://rpc-amoy.polygon.technology',
          explorer: 'https://www.oklink.com/amoy'
        },
        wallet: {
          isConnected: false,
          address: null,
          balance: null
        },
        contract: {
          isDeployed: false,
          address: null
        },
        config: {
          hasValidConfig: false,
          validationErrors: ['Service temporarily unavailable']
        }
      }
    });
  }
});

/**
 * @route POST /api/blockchain/bulk-landowner-row-sync
 * @desc Create row-level blockchain blocks for all landowner rows (optionally by project)
 * @access Private (Officers only)
 */
router.post('/bulk-landowner-row-sync', [
  authMiddleware,
  body('officer_id').notEmpty().withMessage('officer_id is required'),
  body('project_id').optional(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { officer_id, project_id } = req.body;
    const MongoLandownerRecord = (await import('../models/mongo/LandownerRecord.js')).default;
    const MongoBlockchainLedger = (await import('../models/mongo/BlockchainLedger.js')).default;
    const Project = (await import('../models/mongo/Project.js')).default;
    const mongoose = (await import('mongoose')).default;
    const surveyService = new SurveyDataAggregationService();

    // Resolve project_id if a human-readable project name OR ObjectId was provided
    let resolvedProjectId = null;
    if (project_id) {
      try {
        if (mongoose.Types.ObjectId.isValid(project_id)) {
          resolvedProjectId = project_id;
        } else {
          const proj = await Project.findOne({ projectName: String(project_id) });
          resolvedProjectId = proj?._id || null;
        }
      } catch (e) {
        // ignore resolution error
      }
    }

    const filter = {};
    if (project_id && !resolvedProjectId) {
      return res.status(404).json({ success: false, message: 'Project not found for provided project_id/name' });
    }
    if (resolvedProjectId) filter.project_id = resolvedProjectId;

    const rows = await MongoLandownerRecord.find(filter).lean();

    let processed = 0;
    const results = [];

    for (const r of rows) {
      try {
        const canonicalRow = surveyService.cleanDataForSerialization(r);
        const landHash = hashJsonStable(canonicalRow);
        const latest = await MongoBlockchainLedger.findOne({ survey_number: String(r.new_survey_number || r.survey_number || '') }).sort({ timestamp: -1 });
        const previousHash = latest?.current_hash || '0x' + '0'.repeat(64);

        const block = new MongoBlockchainLedger({
          block_id: `BLOCK_${String(r.new_survey_number || r.survey_number || 'NA')}_${Date.now()}`,
          survey_number: String(r.new_survey_number || r.survey_number || ''),
          event_type: 'LANDOWNER_RECORD_CREATED',
          officer_id,
          project_id: r.project_id, // preserve ObjectId
          hash_version: HASH_VERSION,
          data_root: landHash,
          survey_data: { landowner: { data: canonicalRow, hash: landHash, last_updated: new Date(), status: 'created' } },
          timeline_history: [ { action: 'LANDOWNER_RECORD_CREATED', timestamp: new Date(), officer_id, data_hash: landHash, previous_hash: previousHash, metadata: { source: 'bulk_landowner_row_sync' }, remarks: `Bulk row sync ${String(r.project_id)}:${String(r.new_survey_number)}:${String(r.cts_number)}:${String(r.serial_number || '')}` } ],
          metadata: { source: 'bulk_landowner_row_sync' },
          remarks: 'Bulk landowner row sync',
          timestamp: new Date(),
          previous_hash: previousHash,
          nonce: Math.floor(Math.random() * 1_000_000)
        });

        await block.save();
        processed++;
        results.push({ ok: true, row_key: `${r.project_id}:${r.new_survey_number}:${r.cts_number}:${r.serial_number || ''}`, block_id: block.block_id });
      } catch (e) {
        results.push({ ok: false, error: e.message, row: { project_id: r.project_id, new_survey_number: r.new_survey_number, cts_number: r.cts_number, serial_number: r.serial_number } });
      }
    }

    return res.json({ success: true, processed, total: rows.length, results });
  } catch (error) {
    console.error('❌ bulk-landowner-row-sync error:', error);
    return res.status(500).json({ success: false, message: 'Failed bulk landowner row sync', error: error.message });
  }
});

/**
 * @route GET /api/blockchain/health
 * @desc Health check for blockchain service
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    const status = await enhancedBlockchainService.getEnhancedNetworkStatus();

    res.json({
      success: true,
      message: 'Blockchain service is healthy',
      timestamp: new Date().toISOString(),
      network: status.data?.network?.name || 'unknown',
      chainId: status.data?.network?.chainId || 'unknown',
      contract: status.data?.contract?.address || 'unknown',
      wallet: status.data?.wallet?.isConnected || false,
      service: status.data?.status?.isInitialized || false
    });
  } catch (error) {
    console.error('❌ Blockchain health check failed:', error);
    res.status(503).json({
        success: false,
      message: 'Blockchain service is unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== BLOCKCHAIN LEDGER ENTRIES =====

/**
 * @route POST /api/blockchain
 * @desc Record blockchain event/ledger entry (general purpose)
 * @access Private (Officers only)
 */
router.post('/', [
  authMiddleware,
  body('survey_number').notEmpty().withMessage('Survey number is required'),
  body('event_type').notEmpty().withMessage('Event type is required'),
  body('officer_id').notEmpty().withMessage('Officer ID is required'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('project_id').optional().isString().withMessage('Project ID must be a string'),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      survey_number,
      event_type,
      officer_id,
      metadata = {},
      project_id
    } = req.body;

    // Create blockchain ledger entry
    const result = await enhancedBlockchainService.createLedgerEntry({
      survey_number,
      event_type,
      officer_id,
      metadata,
      project_id,
      remarks: `Event: ${event_type}`,
      timestamp: new Date().toISOString()
    });

    // If KYC status updated, append a normalized timeline event and roll-forward ledger
    if (event_type === 'KYC_STATUS_UPDATED') {
      try {
        await ledgerV2.appendTimelineEvent(survey_number, officer_id, 'KYC_STATUS_UPDATED', metadata || {}, 'KYC status updated', project_id || null);
        await ledgerV2.createOrUpdateFromLive(survey_number, officer_id, project_id || null, 'kyc_status_updated');
      } catch (e) {
        console.warn('⚠️ KYC timeline/ledger update failed:', e.message);
      }
    }

    res.json({
      success: true,
      message: 'Blockchain event recorded successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Failed to record blockchain event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record blockchain event',
      error: error.message
    });
  }
});

// ===== SURVEY SEARCH & STATUS =====

/**
 * @route GET /api/blockchain/search/*
 * @desc Search for survey blockchain status and database record
 * @access Private (Officers only)
 */
router.get('/search/*', [
  authMiddleware,
  handleValidationErrors
], async (req, res) => {
  try {
    // Extract survey number from the wildcard path
    const surveyNumber = req.params[0]; // This captures everything after /search/
    
    if (!surveyNumber) {
      return res.status(400).json({
        success: false,
        message: 'Survey number is required'
      });
    }

    // Import models/services
    const MongoJMRRecord = (await import('../models/mongo/JMRRecord.js')).default;
    const MongoBlockchainLedger = (await import('../models/mongo/BlockchainLedger.js')).default;
    const surveyService = new SurveyDataAggregationService();

    // Aggregate across all relevant collections to determine DB presence
    const surveyData = await surveyService.getCompleteSurveyData(surveyNumber);
    const summary = surveyService.getSurveyDataSummary(surveyData);
    // Consider record present in DB if ANY section has data (robust against partial sections)
    let existsInDatabase = Object.values(summary || {}).some((s) => s && s.has_data === true);

    // Keep legacy JMR lookup for backward-compatible summary (optional)
    const dbRecord = await MongoJMRRecord.findOne({ survey_number: surveyNumber, is_active: true });

    // Check if survey exists on blockchain
    const blockchainStatus = await enhancedBlockchainService.surveyExistsOnBlockchain(surveyNumber);
    const integrityStatus = await enhancedBlockchainService.getSurveyIntegrityStatus(surveyNumber);
    const timelineCount = await enhancedBlockchainService.getTimelineCount(surveyNumber);

    // Check local blockchain ledger for this survey
    // Treat ANY block for this survey as on-chain (remove restrictive event filters)
    const localBlockchainEntry = await MongoBlockchainLedger.findOne({
      survey_number: surveyNumber
    }).sort({ timestamp: -1 });

    // Determine overall status using aggregated DB presence
    let overallStatus = 'unknown';
    let statusMessage = '';

    // Treat presence of a local ledger entry as on-chain presence (more reliable than network probe for UI)
    const existsOnChain = !!localBlockchainEntry || !!blockchainStatus;
    if (!existsInDatabase) {
      // If summary says false but any section actually has data in surveyData (defensive), flip to true
      const fallbackDb = Object.values(surveyData || {}).some((section) => section && section.data && Object.keys(section.data).length > 0);
      if (fallbackDb) existsInDatabase = true;
    }

    if (existsInDatabase && existsOnChain) {
      overallStatus = 'synced';
      statusMessage = 'Record exists in database and on blockchain';
    } else if (existsInDatabase && !existsOnChain) {
      overallStatus = 'database_only';
      statusMessage = 'Record exists in database but not on blockchain';
    } else if (!existsInDatabase && existsOnChain) {
      overallStatus = 'blockchain_only';
      statusMessage = 'Record exists on blockchain but not in database';
    } else {
      overallStatus = 'not_found';
      statusMessage = 'Record not found in database or on blockchain';
    }

    // Optional: include quick integrity (v2) for the landowner section if requested
    let quickIntegrity = null;
    if (String(req.query.includeIntegrity || '').toLowerCase() === 'true') {
      try {
        const ver = await ledgerV2.verify(surveyNumber);
        quickIntegrity = {
          isValid: !!ver?.isValid,
          landowner: ver?.data_integrity?.landowner || null,
        };
      } catch (e) {
        quickIntegrity = { isValid: false, error: 'integrity_unavailable' };
      }
    }

    // 🔧 FIX: Return data in expected format for frontend
    res.json({
      success: true,
      found: existsInDatabase,
      survey_number: surveyNumber,
      existsInDatabase,
      existsOnBlockchain: existsOnChain,
      localBlockchainEntry: !!localBlockchainEntry,
      overallStatus,
      statusMessage,
      integrityStatus: integrityStatus || { isIntegrityValid: false, lastChecked: null, compromiseReason: 'Not checked' },
      timelineCount,
      databaseRecord: dbRecord ? {
        measured_area: dbRecord.measured_area,
        land_type: dbRecord.land_type,
        village: dbRecord.village,
        taluka: dbRecord.taluka,
        district: dbRecord.district,
        status: dbRecord.is_active ? 'active' : 'inactive'
      } : null,
      survey_data_summary: summary,
      quickIntegrity,
      block: localBlockchainEntry ? {
        block_id: localBlockchainEntry.block_id,
        current_hash: localBlockchainEntry.current_hash,
        timestamp: localBlockchainEntry.timestamp
      } : null
    });
  } catch (error) {
    console.error('❌ Failed to search survey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search survey',
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/timeline/*
 * @desc Get timeline events for a specific survey
 * @access Private (Officers only)
 */
router.get('/timeline/*', [
  authMiddleware,
  handleValidationErrors
], async (req, res) => {
  try {
    // Extract survey number from the wildcard path
    const surveyNumber = req.params[0]; // This captures everything after /timeline/
    
    if (!surveyNumber) {
      return res.status(400).json({
        success: false,
        message: 'Survey number is required'
      });
    }

    const timeline = await enhancedBlockchainService.getSurveyTimeline(surveyNumber);

    // 🔧 FIX: Return data in expected format for frontend
    res.json({
      success: true,
      survey_number: surveyNumber,
      timeline: timeline,
      totalEvents: timeline.length
    });
  } catch (error) {
    console.error('❌ Failed to get survey timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get survey timeline',
      error: error.message
    });
  }
});

// ===== SYNC STATUS =====

/**
 * @route GET /api/blockchain/sync-status
 * @desc Get sync status of all surveys
 * @access Private (Officers only)
 */
router.get('/sync-status', [
  authMiddleware
], async (req, res) => {
  try {
    const { project_id } = req.query;

    // Import models
    const MongoJMRRecord = (await import('../models/mongo/JMRRecord.js')).default;
    const MongoBlockchainLedger = (await import('../models/mongo/BlockchainLedger.js')).default;

    // Get all active JMR records
    const jmrRecords = await MongoJMRRecord.find({
      is_active: true,
      ...(project_id && { project_id })
    });

    // Get all blockchain entries
    // Find any blocks corresponding to the JMR surveys (without event-type restriction)
    const jmrSurveyNumbers = jmrRecords.map(r => r.survey_number);
    const blockchainEntries = await MongoBlockchainLedger.find({
      survey_number: { $in: jmrSurveyNumbers }
    });

    // Create a map of blockchain entries by survey number
    const blockchainMap = new Map();
    blockchainEntries.forEach(entry => {
      blockchainMap.set(entry.survey_number, entry);
    });

    // Analyze sync status
    const syncStatus = jmrRecords.map(record => {
      const blockchainEntry = blockchainMap.get(record.survey_number);
      return {
        survey_number: record.survey_number,
        exists_in_database: true,
        exists_on_blockchain: !!blockchainEntry,
        sync_status: blockchainEntry ? 'synced' : 'not_synced',
        database_data: {
          measured_area: record.measured_area,
          land_type: record.land_type,
          village: record.village,
          taluka: record.taluka,
          district: record.district,
          status: record.is_active ? 'active' : 'inactive'
        },
        blockchain_data: blockchainEntry ? {
          block_id: blockchainEntry.block_id,
          current_hash: blockchainEntry.current_hash,
          timestamp: blockchainEntry.timestamp
        } : null
      };
    });

    // Count statistics
    const totalRecords = syncStatus.length;
    const syncedRecords = syncStatus.filter(s => s.sync_status === 'synced').length;
    const unsyncedRecords = totalRecords - syncedRecords;
    const syncPercentage = totalRecords > 0 ? Math.round((syncedRecords / totalRecords) * 100) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          total_records: totalRecords,
          synced_records: syncedRecords,
          unsynced_records: unsyncedRecords,
          sync_percentage: syncPercentage
        },
        records: syncStatus
      }
    });
  } catch (error) {
    console.error('❌ Failed to get sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status',
      error: error.message
    });
  }
});

// ===== INTEGRITY VERIFICATION =====

/**
 * @route GET /api/blockchain/verify-integrity/*
 * @desc Verify integrity of a survey's blockchain chain
 * @access Private (Officers only)
 */
router.get('/verify-integrity/*', [
  authMiddleware,
  handleValidationErrors
], async (req, res) => {
  try {
    // Extract survey number from the wildcard path
    const surveyNumber = req.params[0]; // This captures everything after /verify-integrity/
    
    if (!surveyNumber) {
      return res.status(400).json({
        success: false,
        message: 'Survey number is required'
      });
    }

    // Use v2 verification; fallback to legacy if needed
    const integrityStatus = await ledgerV2.verify(surveyNumber);

    // 🔧 FIX: Return data in expected format for frontend
    res.json({
      success: true,
      isValid: integrityStatus.isValid,
      reason: integrityStatus.reason,
      survey_number: integrityStatus.survey_number,
      chain_integrity: integrityStatus.chain_integrity,
      data_integrity: integrityStatus.data_integrity,
      block_hash: integrityStatus.block_hash,
      last_updated: integrityStatus.last_updated
    });
  } catch (error) {
    console.error('❌ Failed to verify integrity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify integrity',
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/survey-timeline/:surveyNumber
 * @desc Get survey timeline
 * @access Private (Officers only)
 */
router.get('/survey-timeline/*', [
  authMiddleware,
  param('0').notEmpty().withMessage('Survey number is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const surveyNumber = req.params[0];
    const timeline = await enhancedBlockchainService.getSurveyTimeline(surveyNumber);

    // Normalize and ensure first creation event exists
    const normalized = (timeline || []).map((e) => ({
      event_type: e.event_type || e.action || 'EVENT',
      timestamp: e.timestamp,
      remarks: e.remarks,
      details: e.metadata || {}
    }));

    const latest = await MongoBlockchainLedger.findOne({ survey_number: surveyNumber }).sort({ timestamp: -1 });
    if (latest) {
      const firstEvent = {
        event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN',
        timestamp: latest.createdAt || latest.timestamp,
        remarks: latest.remarks || 'Survey registered on blockchain',
        details: { block_id: latest.block_id }
      };
      if (!normalized.find(ev => ev.event_type === 'SURVEY_CREATED_ON_BLOCKCHAIN')) {
        normalized.unshift(firstEvent);
      }
    }

    res.json({
      success: true,
      survey_number: surveyNumber,
      timeline: normalized,
      totalEvents: normalized.length
    });
  } catch (error) {
    console.error('❌ Failed to get survey timeline:', error);
    res.status(500).json({
        success: false,
      message: 'Failed to get survey timeline',
      error: error.message
    });
  }
});

/**
 * @route POST /api/blockchain/bulk-sync
 * @desc Bulk sync existing records to blockchain
 * @access Private (Officers only)
 */
router.post('/bulk-sync', [
  authMiddleware,
  body('records').isArray().withMessage('Records must be an array'),
  body('officer_id').notEmpty().withMessage('Officer ID is required'),
  body('project_id').optional().isString().withMessage('Project ID must be a string'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { records, officer_id, project_id } = req.body;

    const result = await enhancedBlockchainService.bulkSyncToBlockchain(
      records,
      officer_id,
      project_id
    );

    res.json({
      success: true,
      message: 'Bulk sync completed',
      data: result
    });
  } catch (error) {
    console.error('❌ Failed to bulk sync to blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk sync to blockchain',
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/surveys-with-status
 * @desc Get surveys with blockchain status
 * @access Private (Officers only)
 */
router.get('/surveys-with-status', [
  authMiddleware,
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  handleValidationErrors
], async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const surveys = await enhancedBlockchainService.getSurveysWithBlockchainStatus(limit);

    res.json({
      success: true,
      data: surveys
    });
  } catch (error) {
    console.error('❌ Failed to get surveys with blockchain status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surveys with blockchain status',
      error: error.message
    });
  }
});

// ===== NEW SURVEY DATA AGGREGATION ROUTES =====

/**
 * @route GET /api/blockchain/surveys-with-complete-status
 * @desc Get all surveys with complete blockchain status and data summary
 * @access Private (Officers only)
 */
router.get('/surveys-with-complete-status', [
  authMiddleware
], async (req, res) => {
  try {
    const surveyService = new SurveyDataAggregationService();
    const surveys = await surveyService.getAllSurveysWithBlockchainStatus();
    
    // 🔧 FIX: Return data in expected format for frontend
    res.json({
      success: true,
      surveys: surveys,
      total: surveys.length
    });
  } catch (error) {
    console.error('❌ Failed to get surveys with complete blockchain status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get surveys with complete blockchain status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/landowners-with-status
 * @desc List landowner rows (project + new_survey + CTS) with blockchain flags
 */
router.get('/landowners-with-status', [ authMiddleware ], async (req, res) => {
  try {
    const projectId = req.query.projectId || null;
    const limit = parseInt(req.query.limit) || 200;
    const surveyService = new SurveyDataAggregationService();
    const rows = await surveyService.getLandownerRowsStatus(projectId, limit);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (error) {
    console.error('❌ Failed to list landowner rows status:', error);
    res.status(500).json({ success: false, message: 'Failed to list landowner rows', error: error.message });
  }
});

/**
 * @route GET /api/blockchain/verify-landowner-row
 * @desc Verify one landowner row using (projectId,new_survey_number,cts_number)
 */
router.get('/verify-landowner-row', [ authMiddleware ], async (req, res) => {
  try {
    let { projectId, newSurveyNumber, oldSurveyNumber, ctsNumber, serialNumber, rowKey } = req.query;
    // Fallback: allow rowKey="projectId:old+new:cts:serial"
    if ((!projectId || (!newSurveyNumber && !oldSurveyNumber && !serialNumber)) && rowKey) {
      try {
        const parts = String(rowKey).split(':');
        if (parts.length >= 4) {
          projectId = projectId || parts[0];
          const composite = parts[1];
          if (composite && composite.includes('+')) {
            const [oldS, newS] = composite.split('+');
            oldSurveyNumber = oldSurveyNumber || (oldS && oldS !== 'NA' ? oldS : undefined);
            newSurveyNumber = newSurveyNumber || (newS && newS !== 'NA' ? newS : undefined);
          } else {
            newSurveyNumber = newSurveyNumber || composite;
          }
          ctsNumber = ctsNumber || parts[2];
          serialNumber = serialNumber || parts[3];
        }
      } catch {}
    }

    // Normalize 'NA' placeholders to nulls
    const normNew = newSurveyNumber && String(newSurveyNumber).trim().toUpperCase() !== 'NA' ? String(newSurveyNumber) : null;
    const normOld = oldSurveyNumber && String(oldSurveyNumber).trim().toUpperCase() !== 'NA' ? String(oldSurveyNumber) : null;
    const normCts = ctsNumber && String(ctsNumber).trim().toUpperCase() !== 'NA' && String(ctsNumber).trim() !== '' ? String(ctsNumber) : null;

    if (!projectId || (!normNew && !normOld && !serialNumber)) {
      return res.status(400).json({ success: false, message: 'projectId and at least one of (newSurveyNumber, oldSurveyNumber, serialNumber) are required' });
    }
    const surveyService = new SurveyDataAggregationService();
    const result = await surveyService.verifyLandownerRow(projectId, normNew || null, normCts, serialNumber || null, normOld || null);
    res.json({ success: true, data: result, diagnostics: {
      identifiers: { projectId, newSurveyNumber: normNew, oldSurveyNumber: normOld, ctsNumber: normCts, serialNumber },
      note: 'Verification compares live landowner section hash and legacy hash against section hash, data_root, and block current_hash'
    }});
  } catch (error) {
    console.error('❌ Failed to verify landowner row:', error);
    res.status(500).json({ success: false, message: 'Failed to verify landowner row', error: error.message });
  }
});

/**
 * @route POST /api/blockchain/rebuild-ledger
 * @desc Delete existing blocks and rebuild from LIVE DB using v2 hashing
 * @access Private (Officers/Admin)
 */
router.post('/rebuild-ledger', [
  authMiddleware,
  body('officer_id').notEmpty().withMessage('Officer ID is required'),
  body('survey_numbers').optional().isArray().withMessage('survey_numbers must be an array'),
  body('project_id').optional(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { officer_id, project_id, survey_numbers } = req.body;

    // Resolve project_id if a human-readable project name OR ObjectId was provided
    const Project = (await import('../models/mongo/Project.js')).default;
    let resolvedProjectId = null;
    if (project_id) {
      try {
        if (mongoose.Types.ObjectId.isValid(project_id)) {
          resolvedProjectId = project_id;
        } else {
          const proj = await Project.findOne({ projectName: String(project_id) });
          resolvedProjectId = proj?._id || null;
        }
      } catch (e) {
        // ignore
      }
    }

    // Build survey list
    let surveyList = [];
    if (Array.isArray(survey_numbers) && survey_numbers.length > 0) {
      surveyList = [...new Set(survey_numbers.map(String))];
    } else {
      const surveyService = new SurveyDataAggregationService();
      const numbers = new Set();
      for (const [, collection] of Object.entries(surveyService.collections)) {
        try {
          const filter = resolvedProjectId ? { project_id: resolvedProjectId } : {};
          const records = await collection.find(filter, { survey_number: 1 });
          records.forEach(r => r?.survey_number && numbers.add(String(r.survey_number)));
        } catch (e) {
          // continue
        }
      }
      surveyList = Array.from(numbers);
    }

    if (surveyList.length === 0) {
      // Fallback: pull survey_numbers from existing blockchain entries scoped to project
      const existingBlocks = await MongoBlockchainLedger.find(
        project_id ? { $or: [{ project_id }, { project_id: String(project_id) }, { project_id: resolvedProjectId }] } : {},
        { survey_number: 1 }
      );
      existingBlocks.forEach(b => b?.survey_number && surveyList.push(String(b.survey_number)));
    }

    if (surveyList.length === 0) {
      return res.status(404).json({ success: false, message: 'No surveys found to rebuild for given project_id/scope' });
    }

    // Delete existing blocks for these surveys (scoped by project_id when provided)
    const deleteFilter = {
      survey_number: { $in: surveyList },
      ...(project_id ? { $or: [{ project_id }, { project_id: String(project_id) }, { project_id: resolvedProjectId }] } : {})
    };
    const delResult = await MongoBlockchainLedger.deleteMany(deleteFilter);

    // Rebuild with v2
    const results = [];
    for (const sn of surveyList) {
      try {
        const out = await ledgerV2.createOrUpdateFromLive(sn, officer_id, resolvedProjectId || project_id, 'ledger_v2_rebuild');
        results.push({ survey_number: sn, success: true, block_id: out.block_id });
      } catch (err) {
        results.push({ survey_number: sn, success: false, error: err.message });
      }
    }

    res.json({
      success: true,
      message: 'Ledger rebuild completed',
      deleted_blocks: delResult?.deletedCount || 0,
      total_surveys: surveyList.length,
      rebuilt: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error('❌ Rebuild ledger error:', error);
    res.status(500).json({ success: false, message: 'Failed to rebuild ledger', error: error.message });
  }
});

/**
 * @route POST /api/blockchain/create-landowner-row-block
 * @desc Create a blockchain block for a specific landowner row (project + new_survey + CTS [+ serial])
 * @access Private (Officers only)
 */
router.post('/create-landowner-row-block', [
  authMiddleware,
  body('project_id').notEmpty().withMessage('project_id is required'),
  body('new_survey_number').optional(),
  body('old_survey_number').optional(),
  body('cts_number').optional(),
  body('officer_id').notEmpty().withMessage('officer_id is required'),
  body('serial_number').optional(),
  body('remarks').optional(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { project_id, new_survey_number, old_survey_number, cts_number, serial_number, officer_id, remarks } = req.body;

    const MongoLandownerRecord = (await import('../models/mongo/LandownerRecord.js')).default;
    const MongoBlockchainLedger = (await import('../models/mongo/BlockchainLedger.js')).default;

    // Normalize identifiers
    const normalizedNew = new_survey_number && String(new_survey_number).trim().toUpperCase() !== 'NA' ? String(new_survey_number) : null;
    const normalizedOld = old_survey_number && String(old_survey_number).trim().toUpperCase() !== 'NA' ? String(old_survey_number) : null;
    const ctsNorm = cts_number && String(cts_number).trim().toUpperCase() !== 'NA' && String(cts_number).trim() !== '' ? String(cts_number) : null;
    const ctsMatch = ctsNorm ? { cts_number: ctsNorm } : { $or: [ { cts_number: null }, { cts_number: { $exists: false } }, { cts_number: '' } ] };

    if (!normalizedNew && !normalizedOld) {
      return res.status(400).json({ success: false, message: 'Either new_survey_number or old_survey_number is required' });
    }

    // Try lookup by new_survey_number first, then old/survey_number fallback
    let record = null;
    if (normalizedNew) {
      const filterNewAnd = [ { project_id }, { new_survey_number: normalizedNew }, ctsMatch ];
      if (serial_number) filterNewAnd.push({ serial_number });
      record = await MongoLandownerRecord.findOne({ $and: filterNewAnd });
    }
    if (!record && normalizedOld) {
      const filterOldAndBase = [ { project_id }, ctsMatch ];
      if (serial_number) filterOldAndBase.push({ serial_number });
      record = await MongoLandownerRecord.findOne({
        $and: [
          ...filterOldAndBase,
          { $or: [ { old_survey_number: normalizedOld }, { survey_number: normalizedOld } ] }
        ]
      });
    }

    if (!record) {
      return res.status(404).json({ success: false, message: 'Landowner row not found for given identifiers' });
    }

    // Prepare data and choose effective survey number for chain
    const row = record.toObject({ depopulate: true, getters: false, virtuals: false });
    const aggregator = new SurveyDataAggregationService();
    const canonicalRow = aggregator.cleanDataForSerialization(row);
    const landHash = hashJsonStable(canonicalRow);

    const effectiveSurvey = normalizedNew || normalizedOld;

    // Link into same survey chain using previous hash from latest block for this survey
    const latest = await MongoBlockchainLedger.findOne({ survey_number: String(effectiveSurvey) }).sort({ timestamp: -1 });
    const previousHash = latest?.current_hash || '0x' + '0'.repeat(64);

    const block = new MongoBlockchainLedger({
      block_id: `BLOCK_${String(effectiveSurvey)}_${Date.now()}`,
      survey_number: String(effectiveSurvey),
      event_type: 'LANDOWNER_RECORD_CREATED',
      officer_id,
      project_id: String(project_id),
      hash_version: HASH_VERSION,
      data_root: landHash,
      survey_data: {
        landowner: {
          data: canonicalRow,
          hash: landHash,
          last_updated: new Date(),
          status: 'created'
        }
      },
      timeline_history: [
        {
          action: 'LANDOWNER_RECORD_CREATED',
          timestamp: new Date(),
          officer_id,
          data_hash: landHash,
          previous_hash: previousHash,
          metadata: { source: 'landowner_row_sync', project_id: String(project_id) },
          remarks: remarks || `Landowner row synced: ${String(project_id)}:${String(normalizedOld || 'NA')}+${String(normalizedNew || 'NA')}:${String(ctsNorm ?? 'NA')}:${String(serial_number || '')}`
        }
      ],
      metadata: { source: 'landowner_row_sync' },
      remarks: remarks || 'Landowner row synced to blockchain',
      timestamp: new Date(),
      previous_hash: previousHash,
      nonce: Math.floor(Math.random() * 1_000_000)
    });

    const saved = await block.save();
    return res.json({ success: true, message: 'Landowner row block created', data: { block_id: saved.block_id, hash: saved.current_hash } });
  } catch (error) {
    console.error('❌ create-landowner-row-block error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create landowner row block', error: error.message });
  }
});

/**
 * @route POST /api/blockchain/create-or-update-survey-complete
 * @desc Create or update survey block with complete data from all collections
 * @access Private (Officers only)
 */
router.post('/create-or-update-survey-complete', [
  authMiddleware,
  body('survey_number').notEmpty().withMessage('Survey number is required'),
  body('officer_id').notEmpty().withMessage('Officer ID is required'),
  body('project_id').optional(),
  body('remarks').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { survey_number, officer_id, project_id, remarks } = req.body;
    
    // Use v2 ledger to build block from live data, preserving response contract
    const result = await ledgerV2.createOrUpdateFromLive(
      survey_number,
      officer_id,
      project_id,
      remarks
    );

    res.json({
      success: true,
      message: 'Survey block created/updated successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Failed to create/update survey block:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update survey block',
      error: error.message
    });
  }
});

/**
 * @route POST /api/blockchain/bulk-sync-all-surveys
 * @desc Bulk sync all surveys to blockchain with complete data aggregation
 * @access Private (Officers only)
 */
router.post('/bulk-sync-all-surveys', [
  authMiddleware,
  body('officer_id').notEmpty().withMessage('Officer ID is required'),
  body('project_id').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { officer_id, project_id } = req.body;
    
    const surveyService = new SurveyDataAggregationService();

    // Resolve project_id if a human-readable project name OR ObjectId was provided
    let resolvedProjectId = null;
    if (project_id) {
      try {
        if (mongoose.Types.ObjectId.isValid(project_id)) {
          resolvedProjectId = project_id;
        } else {
          const proj = await Project.findOne({ projectName: String(project_id) });
          resolvedProjectId = proj?._id || null;
        }
      } catch (e) {
        // ignore resolution error
      }
    }

    const filter = {};
    if (project_id && !resolvedProjectId) {
      return res.status(404).json({ success: false, message: 'Project not found for provided project_id/name' });
    }
    if (resolvedProjectId) filter.project_id = resolvedProjectId;

    const rows = await MongoLandownerRecord.find(filter).lean();

    let processed = 0;
    const results = [];

    for (const r of rows) {
      try {
        const canonicalRow = surveyService.cleanDataForSerialization(r);
        const landHash = hashJsonStable(canonicalRow);
        const latest = await MongoBlockchainLedger.findOne({ survey_number: String(r.new_survey_number || r.survey_number || '') }).sort({ timestamp: -1 });
        const previousHash = latest?.current_hash || '0x' + '0'.repeat(64);

        const block = new MongoBlockchainLedger({
          block_id: `BLOCK_${String(r.new_survey_number || r.survey_number || 'NA')}_${Date.now()}`,
          survey_number: String(r.new_survey_number || r.survey_number || ''),
          event_type: 'LANDOWNER_RECORD_CREATED',
          officer_id,
          project_id: r.project_id, // preserve ObjectId
          hash_version: HASH_VERSION,
          data_root: landHash,
          survey_data: { landowner: { data: canonicalRow, hash: landHash, last_updated: new Date(), status: 'created' } },
          timeline_history: [ { action: 'LANDOWNER_RECORD_CREATED', timestamp: new Date(), officer_id, data_hash: landHash, previous_hash: previousHash, metadata: { source: 'bulk_landowner_row_sync' }, remarks: `Bulk row sync ${String(r.project_id)}:${String(r.new_survey_number)}:${String(r.cts_number)}:${String(r.serial_number || '')}` } ],
          metadata: { source: 'bulk_landowner_row_sync' },
          remarks: 'Bulk landowner row sync',
          timestamp: new Date(),
          previous_hash: previousHash,
          nonce: Math.floor(Math.random() * 1_000_000)
        });

        await block.save();
        processed++;
        results.push({ ok: true, row_key: `${r.project_id}:${r.new_survey_number}:${r.cts_number}:${r.serial_number || ''}`, block_id: block.block_id });
      } catch (e) {
        results.push({ ok: false, error: e.message, row: { project_id: r.project_id, new_survey_number: r.new_survey_number, cts_number: r.cts_number, serial_number: r.serial_number } });
      }
    }

    return res.json({ success: true, processed, total: rows.length, results });
  } catch (error) {
    console.error('❌ bulk-landowner-row-sync error:', error);
    return res.status(500).json({ success: false, message: 'Failed bulk landowner row sync', error: error.message });
  }
});

/**
 * @route GET /api/blockchain/survey-complete-data/*
 * @desc Get complete survey data from all collections for a specific survey
 * @access Private (Officers only)
 */
router.get('/survey-complete-data/*', [
  authMiddleware
], async (req, res) => {
  try {
    const surveyNumber = req.params[0];
    
    if (!surveyNumber) {
      return res.status(400).json({
        success: false,
        message: 'Survey number is required'
      });
    }

    const surveyService = new SurveyDataAggregationService();
    const surveyData = await surveyService.getCompleteSurveyData(surveyNumber);

    res.json({
      success: true,
      data: {
        survey_number: surveyNumber,
        survey_data: surveyData,
        summary: surveyService.getSurveyDataSummary(surveyData)
      }
    });
  } catch (error) {
    console.error('❌ Failed to get complete survey data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get complete survey data',
      error: error.message
    });
  }
});

// ===== ADVANCED SEARCH WITH UNIQUE BLOCK IDENTIFIER =====

/**
 * @route GET /api/blockchain/search-by-identifier
 * @desc Search blockchain using unique identifier format: project+district+taluka+village+surveynumber
 * @access Private (Officers only)
 */
router.get('/search-by-identifier', [
  authMiddleware,
  query('project').notEmpty().withMessage('Project is required'),
  query('district').notEmpty().withMessage('District is required'),
  query('taluka').notEmpty().withMessage('Taluka is required'),
  query('village').notEmpty().withMessage('Village is required'),
  query('surveyNumber').notEmpty().withMessage('Survey number is required'),
  query('includeIntegrity').optional().isBoolean().withMessage('includeIntegrity must be boolean'),
  query('includeTimeline').optional().isBoolean().withMessage('includeTimeline must be boolean'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { project, district, taluka, village, surveyNumber, includeIntegrity, includeTimeline } = req.query;
    
    // Create the unique identifier
    const uniqueIdentifier = `${project}+${district}+${taluka}+${village}+${surveyNumber}`;
    
    // Import required models and services
    const MongoLandownerRecord = (await import('../models/mongo/LandownerRecord.js')).default;
    const MongoBlockchainLedger = (await import('../models/mongo/BlockchainLedger.js')).default;
    const surveyService = new SurveyDataAggregationService();
    
    // Search for the landowner record using the provided criteria
    const landownerRecord = await MongoLandownerRecord.findOne({
      project_id: project,
      district: { $regex: new RegExp(`^${district}$`, 'i') },
      taluka: { $regex: new RegExp(`^${taluka}$`, 'i') },
      village: { $regex: new RegExp(`^${village}$`, 'i') },
      $or: [
        { survey_number: surveyNumber },
        { new_survey_number: surveyNumber },
        { old_survey_number: surveyNumber }
      ]
    });

    // Get complete survey data
    const surveyData = await surveyService.getCompleteSurveyData(surveyNumber);
    const summary = surveyService.getSurveyDataSummary(surveyData);
    
    // Check blockchain status
    const blockchainStatus = await enhancedBlockchainService.surveyExistsOnBlockchain(surveyNumber);
    // Treat ANY block for this survey as on-chain (remove restrictive event filters)
    const localBlockchainEntry = await MongoBlockchainLedger.findOne({
      survey_number: surveyNumber
    }).sort({ timestamp: -1 });

    // Get integrity status if requested
    let integrityReport = null;
    if (includeIntegrity === 'true') {
      try {
        const integrityStatus = await ledgerV2.verify(surveyNumber);
        integrityReport = {
          isValid: integrityStatus.isValid,
          reason: integrityStatus.reason,
          chainIntegrity: integrityStatus.chain_integrity,
          dataIntegrity: integrityStatus.data_integrity,
          blockHash: integrityStatus.block_hash,
          lastUpdated: integrityStatus.last_updated
        };
      } catch (error) {
        integrityReport = {
          isValid: false,
          error: 'Integrity verification failed',
          details: error.message
        };
      }
    }

    // Get timeline if requested
    let timelineReport = null;
    if (includeTimeline === 'true') {
      try {
        const timeline = await enhancedBlockchainService.getSurveyTimeline(surveyNumber);
        const auditTrail = await enhancedBlockchainService.getAuditTrail(surveyNumber, {
          projectName: project,
          district,
          taluka,
          village
        });
        
        timelineReport = {
          totalEvents: timeline.length,
          events: timeline,
          auditTrail: auditTrail.success ? auditTrail.localTrail : [],
          blockchainTrail: auditTrail.success ? auditTrail.blockchainTrail : null,
          integrityVerified: auditTrail.success ? auditTrail.integrityVerified : false
        };
      } catch (error) {
        timelineReport = {
          error: 'Timeline retrieval failed',
          details: error.message
        };
      }
    }

    // Determine overall status
    const existsInDatabase = !!landownerRecord || Object.values(summary || {}).some(s => s && s.has_data === true);
    const existsOnBlockchain = !!localBlockchainEntry || !!blockchainStatus;
    
    let overallStatus = 'unknown';
    let statusMessage = '';
    
    if (existsInDatabase && existsOnChain) {
      overallStatus = 'synced';
      statusMessage = 'Record exists in database and on blockchain';
    } else if (existsInDatabase && !existsOnChain) {
      overallStatus = 'database_only';
      statusMessage = 'Record exists in database but not on blockchain';
    } else if (!existsInDatabase && existsOnChain) {
      overallStatus = 'blockchain_only';
      statusMessage = 'Record exists on blockchain but not in database';
    } else {
      overallStatus = 'not_found';
      statusMessage = 'Record not found in database or on blockchain';
    }

    // Generate data integrity report
    const dataIntegrityReport = {
      uniqueIdentifier,
      surveyNumber,
      project,
      district,
      taluka,
      village,
      overallStatus,
      statusMessage,
      existsInDatabase,
      existsOnBlockchain,
      landownerRecordFound: !!landownerRecord,
      blockchainEntry: localBlockchainEntry ? {
        block_id: localBlockchainEntry.block_id,
        current_hash: localBlockchainEntry.current_hash,
        timestamp: localBlockchainEntry.timestamp,
        event_type: localBlockchainEntry.event_type,
        officer_id: localBlockchainEntry.officer_id
      } : null,
      integrityReport,
      timelineReport,
      summary,
      lastChecked: new Date().toISOString()
    };

    res.json({
      success: true,
      data: dataIntegrityReport
    });
  } catch (error) {
    console.error('❌ Failed to search by identifier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search by identifier',
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/block-timeline/:uniqueIdentifier
 * @desc Get complete timeline for a specific block using unique identifier
 * @access Private (Officers only)
 */
router.get('/block-timeline/:uniqueIdentifier', [
  authMiddleware,
  param('uniqueIdentifier').notEmpty().withMessage('Unique identifier is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { uniqueIdentifier } = req.params;
    
    // Parse the unique identifier
    const parts = uniqueIdentifier.split('+');
    if (parts.length !== 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unique identifier format. Expected: project+district+taluka+village+surveyNumber'
      });
    }
    
    const [project, district, taluka, village, surveyNumber] = parts;
    
    // Get comprehensive timeline data
    const timeline = await enhancedBlockchainService.getSurveyTimeline(surveyNumber);
    const auditTrail = await enhancedBlockchainService.getAuditTrail(surveyNumber, {
      projectName: project,
      district,
      taluka,
      village
    });
    
    // Get local blockchain ledger entries for this survey
    const MongoBlockchainLedger = (await import('../models/mongo/BlockchainLedger.js')).default;
    const ledgerEntries = await MongoBlockchainLedger.find({ 
      survey_number: surveyNumber 
    }).sort({ timestamp: 1 });

    // Combine and normalize timeline data
    const combinedTimeline = [];
    
    // Add blockchain ledger entries
    ledgerEntries.forEach(entry => {
      combinedTimeline.push({
        timestamp: entry.timestamp,
        eventType: entry.event_type,
        officerId: entry.officer_id,
        projectId: entry.project_id,
        metadata: entry.metadata,
        remarks: entry.remarks,
        transactionHash: entry.metadata?.transaction_hash,
        blockNumber: entry.metadata?.block_number,
        source: 'blockchain_ledger',
        blockId: entry.block_id
      });
    });

    // Add timeline events from enhanced service
    if (timeline && timeline.length > 0) {
      timeline.forEach(event => {
        combinedTimeline.push({
          timestamp: event.timestamp,
          eventType: event.event_type || event.action,
          officerId: event.officer_id,
          metadata: event.metadata || {},
          remarks: event.remarks,
          source: 'timeline_service'
        });
      });
    }

    // Add audit trail events
    if (auditTrail.success && auditTrail.localTrail && auditTrail.localTrail.length > 0) {
      auditTrail.localTrail.forEach(event => {
        combinedTimeline.push({
          timestamp: event.timestamp,
          eventType: event.eventType,
          officerId: event.officerId,
          metadata: event.metadata,
          remarks: event.remarks,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          source: 'audit_trail'
        });
      });
    }

    // Sort by timestamp and remove duplicates
    const uniqueTimeline = combinedTimeline
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .filter((event, index, self) => 
        index === self.findIndex(e => 
          e.timestamp.getTime() === event.timestamp.getTime() && 
          e.eventType === event.eventType &&
          e.officerId === event.officerId
        )
      );

    // Categorize events by workflow stage
    const categorizedTimeline = {
      landRecordManagement: uniqueTimeline.filter(e => 
        ['LANDOWNER_RECORD_CREATED', 'JMR_MEASUREMENT_UPLOADED', 'SURVEY_CREATED_ON_BLOCKCHAIN'].includes(e.eventType)
      ),
      noticeGeneration: uniqueTimeline.filter(e => 
        ['Notice_Generated', 'KYC_ASSIGNED', 'KYC_STATUS_UPDATED'].includes(e.eventType)
      ),
      fieldOfficer: uniqueTimeline.filter(e => 
        ['DOCUMENT_UPLOADED', 'KYC_APPROVED', 'DOCUMENT_VERIFIED'].includes(e.eventType)
      ),
      paymentSlip: uniqueTimeline.filter(e => 
        ['PAYMENT_SLIP_GENERATED', 'PAYMENT_RECORDED', 'PAYMENT_STATUS_UPDATED'].includes(e.eventType)
      ),
      projectAnalytics: uniqueTimeline.filter(e => 
        ['Land_Acquired', 'ACQUISITION_COMPLETE', 'PROJECT_ANALYTICS_UPDATED'].includes(e.eventType)
      )
    };

    res.json({
      success: true,
      uniqueIdentifier,
      surveyNumber,
      project,
      district,
      taluka,
      village,
      timeline: uniqueTimeline,
      categorizedTimeline,
      totalEvents: uniqueTimeline.length,
      auditTrailAvailable: auditTrail.success,
      integrityVerified: auditTrail.success ? auditTrail.integrityVerified : false,
      blockchainTrailAvailable: !!auditTrail.blockchainTrail
    });
  } catch (error) {
    console.error('❌ Failed to get block timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get block timeline',
      error: error.message
    });
  }
});

export default router;
