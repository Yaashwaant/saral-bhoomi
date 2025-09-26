import MongoJMRRecord from '../models/mongo/JMRRecord.js';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoNotice from '../models/mongo/Notice.js';
import MongoPayment from '../models/mongo/Payment.js';
import MongoAward from '../models/mongo/Award.js';
import MongoBlockchainLedger from '../models/mongo/BlockchainLedger.js';
import crypto from 'crypto';
import { hashJsonStable } from './hashing.js';

class SurveyDataAggregationService {
  constructor() {
    this.collections = {
      jmr: MongoJMRRecord,
      landowner: MongoLandownerRecord,
      notice: MongoNotice,
      payment: MongoPayment,
      award: MongoAward
    };
  }

  /**
   * Get complete survey data from all collections
   */
  async getCompleteSurveyData(surveyNumber) {
    try {
      const surveyData = {
        jmr: { data: null, hash: null, last_updated: null, status: 'not_created' },
        landowner: { data: null, hash: null, last_updated: null, status: 'not_created' },
        notice: { data: null, hash: null, last_updated: null, status: 'not_created' },
        payment: { data: null, hash: null, last_updated: null, status: 'not_created' },
        award: { data: null, hash: null, last_updated: null, status: 'not_created' }
      };

      // Fetch data from each collection
      for (const [collectionName, collection] of Object.entries(this.collections)) {
        try {
          const record = await collection.findOne({ survey_number: surveyNumber });
          
          if (record) {
            // Convert to plain object and clean up non-serializable fields
            const cleanData = this.cleanDataForSerialization(record.toObject());
            
            surveyData[collectionName] = {
              data: cleanData,
              hash: this.generateDataHash(cleanData),
              last_updated: record.updatedAt || record.createdAt,
              status: 'created'
            };
          }
        } catch (error) {
          console.error(`❌ Error fetching ${collectionName} data for ${surveyNumber}:`, error);
        }
      }

      return surveyData;
    } catch (error) {
      console.error('❌ Failed to get complete survey data:', error);
      throw error;
    }
  }

  /**
   * Create or update blockchain block for survey
   */
  async createOrUpdateSurveyBlock(surveyNumber, officerId, projectId = null, remarks = '') {
    try {
      console.log(`🔍 Creating/updating blockchain block for survey: ${surveyNumber}`);
      
      // Get complete survey data
      const surveyData = await this.getCompleteSurveyData(surveyNumber);
      
      // Check if block already exists
      let existingBlock = await MongoBlockchainLedger.findOne({ 
        survey_number: surveyNumber 
      }).sort({ timestamp: -1 });

      if (existingBlock) {
        console.log(`📝 Updating existing block for ${surveyNumber}`);
        return await this.updateSurveyBlock(existingBlock, surveyData, officerId, projectId, remarks);
      } else {
        console.log(`🆕 Creating new block for ${surveyNumber}`);
        return await this.createSurveyBlock(surveyNumber, surveyData, officerId, projectId, remarks);
      }
    } catch (error) {
      console.error('❌ Failed to create/update survey block:', error);
      throw error;
    }
  }

  /**
   * Create new survey block
   */
  async createSurveyBlock(surveyNumber, surveyData, officerId, projectId, remarks) {
    try {
      const blockId = `BLOCK_${surveyNumber}_${Date.now()}`;
      const timestamp = new Date();
      
      // Create initial timeline entry
      const timelineHistory = [{
        action: 'SURVEY_CREATED_ON_BLOCKCHAIN',
        timestamp: timestamp,
        officer_id: officerId,
        data_hash: this.generateDataHash(surveyData),
        previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        metadata: { 
          event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN', 
          project_id: projectId,
          source: 'survey_data_aggregation'
        },
        remarks: `Survey ${surveyNumber} registered on blockchain with complete data aggregation`
      }];

      // Create blockchain ledger entry
      const ledgerEntry = new MongoBlockchainLedger({
        block_id: blockId,
        survey_number: surveyNumber,
        event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN',
        officer_id: officerId,
        project_id: projectId,
        survey_data: surveyData,
        timeline_history: timelineHistory,
        metadata: { 
          event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN', 
          project_id: projectId,
          source: 'survey_data_aggregation'
        },
        remarks: remarks || `Survey ${surveyNumber} created on blockchain via data aggregation`,
        timestamp: timestamp,
        previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        current_hash: null, // Will be generated manually to ensure it works
        nonce: Math.floor(Math.random() * 1000000),
        is_valid: true
      });

      // 🔧 MANUALLY GENERATE HASH BEFORE SAVING (Fix for pre-save middleware issue)
      try {
        ledgerEntry.current_hash = ledgerEntry.calculateHash();
        console.log('🔧 Manually generated hash:', ledgerEntry.current_hash);
      } catch (hashError) {
        console.error('❌ Failed to generate hash manually:', hashError);
        throw new Error(`Hash generation failed: ${hashError.message}`);
      }

      // Validate and save
      await ledgerEntry.validate();
      const savedEntry = await ledgerEntry.save();

      console.log('✅ Survey block created:', {
        block_id: blockId,
        survey_number: surveyNumber,
        hash: savedEntry.current_hash,
        sections_with_data: Object.keys(surveyData).filter(key => surveyData[key].status === 'created').length
      });

      return {
        success: true,
        block_id: blockId,
        hash: savedEntry.current_hash,
        ledger_entry: savedEntry,
        survey_data_summary: this.getSurveyDataSummary(surveyData)
      };
    } catch (error) {
      console.error('❌ Failed to create survey block:', error);
      throw error;
    }
  }

  /**
   * Update existing survey block
   */
  async updateSurveyBlock(existingBlock, surveyData, officerId, projectId, remarks) {
    try {
      const timestamp = new Date();
      const previousHash = existingBlock.current_hash;

      // Add timeline entry
      existingBlock.addTimelineEntry(
        'SURVEY_DATA_UPDATED',
        officerId,
        this.generateDataHash(surveyData),
        previousHash,
        { 
          event_type: 'SURVEY_DATA_UPDATED', 
          project_id: projectId,
          source: 'survey_data_aggregation'
        },
        remarks || `Survey ${existingBlock.survey_number} data updated on blockchain`
      );

      // Update survey data sections
      for (const [sectionName, sectionData] of Object.entries(surveyData)) {
        if (sectionData.status === 'created') {
          existingBlock.updateSurveyDataSection(sectionName, sectionData.data, 'updated');
        }
      }

      // Save updated block
      const updatedBlock = await existingBlock.save();

      console.log('✅ Survey block updated:', {
        block_id: existingBlock.block_id,
        survey_number: existingBlock.survey_number,
        new_hash: updatedBlock.current_hash,
        sections_with_data: Object.keys(surveyData).filter(key => surveyData[key].status === 'created').length
      });

      return {
        success: true,
        block_id: existingBlock.block_id,
        hash: updatedBlock.current_hash,
        ledger_entry: updatedBlock,
        survey_data_summary: this.getSurveyDataSummary(surveyData)
      };
    } catch (error) {
      console.error('❌ Failed to update survey block:', error);
      throw error;
    }
  }

  /**
   * Bulk sync all survey numbers to blockchain
   */
  async bulkSyncAllSurveys(officerId, projectId = null) {
    try {
      console.log('🚀 Starting bulk sync of all surveys to blockchain...');
      
      // Get all unique survey numbers from all collections
      const allSurveyNumbers = new Set();
      
      for (const [collectionName, collection] of Object.entries(this.collections)) {
        try {
          const records = await collection.find({}, { survey_number: 1 });
          records.forEach(record => allSurveyNumbers.add(record.survey_number));
        } catch (error) {
          console.error(`❌ Error fetching survey numbers from ${collectionName}:`, error);
        }
      }

      const surveyNumbers = Array.from(allSurveyNumbers);
      console.log(`📊 Found ${surveyNumbers.length} unique survey numbers to sync`);

      const results = {
        total: surveyNumbers.length,
        successful: 0,
        failed: 0,
        errors: []
      };

      // Process each survey number
      for (const surveyNumber of surveyNumbers) {
        try {
          console.log(`\n🔍 Processing survey: ${surveyNumber}`);
          await this.createOrUpdateSurveyBlock(surveyNumber, officerId, projectId);
          results.successful++;
        } catch (error) {
          console.error(`❌ Failed to sync ${surveyNumber}:`, error);
          results.failed++;
          results.errors.push({
            survey_number: surveyNumber,
            error: error.message
          });
        }
      }

      console.log('\n🎉 Bulk sync completed!');
      console.log('📊 Results:', results);

      return results;
    } catch (error) {
      console.error('❌ Bulk sync failed:', error);
      throw error;
    }
  }

  /**
   * Get survey data summary
   */
  getSurveyDataSummary(surveyData) {
    const summary = {};
    for (const [sectionName, sectionData] of Object.entries(surveyData)) {
      summary[sectionName] = {
        has_data: sectionData.status === 'created',
        last_updated: sectionData.last_updated,
        data_hash: sectionData.hash
      };
    }
    return summary;
  }

  /**
   * Clean data for serialization by removing non-serializable fields
   */
  cleanDataForSerialization(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.cleanDataForSerialization(item));
    }

    // Handle objects
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip internal Mongoose fields
      if (key.startsWith('__') || key === '_id') {
        continue;
      }

      // 🔧 EXCLUDE current timestamps that change on every check
      // But KEEP stored timestamps that are part of the data
      if (key === 'timestamp' && value instanceof Date) {
        // Skip current timestamp - this changes on every integrity check
        continue;
      }

      // 🔧 Handle ObjectId and Buffer consistently with verification service
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'ObjectId') {
        cleaned[key] = value.toString();
      }
      else if (value && Buffer.isBuffer(value)) {
        cleaned[key] = value.toString('hex');
      }
      // Handle dates
      else if (value instanceof Date) {
        cleaned[key] = value.toISOString();
      }
      // Handle nested objects
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = this.cleanDataForSerialization(value);
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        cleaned[key] = this.cleanDataForSerialization(value);
      }
      // Handle primitive values
      else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /**
   * Generate hash for any data
   */
  generateDataHash(data) {
    if (!data) return null;
    try {
      const cleanData = this.cleanDataForSerialization(data);
      // Use the same stable hashing as ledger v2 to ensure verify == stored
      return hashJsonStable(cleanData);
    } catch (error) {
      console.error('❌ Failed to generate data hash:', error);
      return null;
    }
  }

  /**
   * Get all surveys with blockchain status
   */
  async getAllSurveysWithBlockchainStatus() {
    try {
      const allSurveyNumbers = new Set();
      
      // Get survey numbers from all collections
      for (const [collectionName, collection] of Object.entries(this.collections)) {
        try {
          const records = await collection.find({}, { survey_number: 1 });
          records.forEach(record => allSurveyNumbers.add(record.survey_number));
        } catch (error) {
          console.error(`❌ Error fetching from ${collectionName}:`, error);
        }
      }

      const surveyNumbers = Array.from(allSurveyNumbers);
      const results = [];

      for (const surveyNumber of surveyNumbers) {
        try {
          // Check blockchain status
          const blockchainEntry = await MongoBlockchainLedger.findOne({ 
            survey_number: surveyNumber 
          }).sort({ timestamp: -1 });

          // Get survey data summary
          const surveyData = await this.getCompleteSurveyData(surveyNumber);
          
          results.push({
            survey_number: surveyNumber,
            exists_on_blockchain: !!blockchainEntry,
            blockchain_block_id: blockchainEntry?.block_id || null,
            blockchain_hash: blockchainEntry?.current_hash || null,
            blockchain_last_updated: blockchainEntry?.updatedAt || null,
            survey_data_summary: this.getSurveyDataSummary(surveyData),
            total_sections: Object.keys(surveyData).length,
            sections_with_data: Object.keys(surveyData).filter(key => surveyData[key].status === 'created').length
          });
        } catch (error) {
          console.error(`❌ Error processing ${surveyNumber}:`, error);
          results.push({
            survey_number: surveyNumber,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Failed to get surveys with blockchain status:', error);
      throw error;
    }
  }

  /**
   * Build canonical landowner row key based on project + new survey + CTS
   * This uniquely identifies a row within Parishisht‑K format.
   */
  buildLandownerRowKey(record) {
    const pid = String(record.project_id || 'noproj');
    const ns = String(record.new_survey_number || 'NA');
    const cts = String(record.cts_number || 'NA');
    const sn = String(record.serial_number || 'NA');
    return `${pid}:${ns}:${cts}:${sn}`;
  }

  /**
   * List all landowner rows with blockchain presence flags
   */
  async getLandownerRowsStatus(projectId = null, limit = 200) {
    try {
      const filter = {};
      if (projectId) filter.project_id = projectId;
      const rows = await MongoLandownerRecord.find(filter, {
        project_id: 1,
        serial_number: 1,
        old_survey_number: 1,
        new_survey_number: 1,
        cts_number: 1,
        landowner_name: 1,
        village: 1,
        taluka: 1,
        district: 1,
      }).limit(limit);

      const results = [];
      for (const r of rows) {
        const row_key = this.buildLandownerRowKey(r);
        // Look up any ledger that likely corresponds to this row.
        // Project ID may have been saved as ObjectId or string, or omitted; support all cases.
        const projectMatch = {
          $or: [
            { project_id: r.project_id },
            { project_id: String(r.project_id) },
            { project_id: null },
            { project_id: { $exists: false } }
          ]
        };
        // STRICT row-level match: require landowner section with same new_survey + CTS (+ serial when available)
        const rowMatch = {
          'survey_data.landowner.data.new_survey_number': r.new_survey_number,
          'survey_data.landowner.data.cts_number': r.cts_number,
          ...(r.serial_number ? { 'survey_data.landowner.data.serial_number': r.serial_number } : {})
        };
        // Accept either a landowner data match OR a survey-level block tagged with LANDOWNER_RECORD_CREATED
        const ledger = await MongoBlockchainLedger.findOne({
          $and: [
            projectMatch,
            { $or: [ rowMatch, { survey_number: r.new_survey_number, event_type: 'LANDOWNER_RECORD_CREATED' } ] }
          ]
        }).sort({ timestamp: -1 });

        results.push({
          row_key,
          project_id: String(r.project_id || ''),
          serial_number: r.serial_number,
          landowner_name: r.landowner_name,
          old_survey_number: r.old_survey_number,
          new_survey_number: r.new_survey_number,
          cts_number: r.cts_number,
          location: { village: r.village, taluka: r.taluka, district: r.district },
          exists_on_blockchain: !!ledger,
          blockchain_block_id: ledger?.block_id || null,
          blockchain_hash: ledger?.current_hash || null,
          blockchain_last_updated: ledger?.updatedAt || null
        });
      }
      return results;
    } catch (error) {
      console.error('❌ Failed to get landowner rows status:', error);
      throw error;
    }
  }

  /**
   * Verify a specific landowner row by recomputing its landowner section hash
   */
  async verifyLandownerRow(projectId, newSurveyNumber, ctsNumber, serialNumber = null) {
    try {
      const record = await MongoLandownerRecord.findOne({
        project_id: projectId,
        new_survey_number: newSurveyNumber,
        cts_number: ctsNumber,
        ...(serialNumber ? { serial_number: serialNumber } : {})
      });
      if (!record) {
        return { isValid: false, reason: 'row_not_found' };
      }

      const cleanData = this.cleanDataForSerialization(record.toObject());
      const liveHash = this.generateDataHash(cleanData);

      const ledger = await MongoBlockchainLedger.findOne({
        $and: [
          { $or: [ { project_id: projectId }, { project_id: String(projectId) }, { project_id: null }, { project_id: { $exists: false } } ] },
          { 'survey_data.landowner.data.new_survey_number': newSurveyNumber, 'survey_data.landowner.data.cts_number': ctsNumber, ...(serialNumber ? { 'survey_data.landowner.data.serial_number': serialNumber } : {}) }
        ]
      }).sort({ timestamp: -1 });

      if (!ledger) {
        return { isValid: false, reason: 'not_on_blockchain', live_hash: liveHash };
      }

      const chainHash = ledger?.survey_data?.landowner?.hash || null;
      const isValid = !!chainHash && chainHash === liveHash;
      return {
        isValid,
        reason: isValid ? 'ok' : 'hash_mismatch',
        live_hash: liveHash,
        chain_hash: chainHash,
        block_id: ledger.block_id,
        last_updated: ledger.updatedAt
      };
    } catch (error) {
      console.error('❌ verifyLandownerRow error:', error);
      return { isValid: false, reason: 'error', error: error.message };
    }
  }
}

export default SurveyDataAggregationService;
