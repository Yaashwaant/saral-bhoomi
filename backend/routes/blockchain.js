import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import EnhancedBlockchainService from '../services/enhancedBlockchainService.js';
import LedgerV2Service from '../services/ledgerV2Service.js';
import MongoBlockchainLedger from '../models/mongo/BlockchainLedger.js';
import SurveyDataAggregationService from '../services/surveyDataAggregationService.js';
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

    // Import JMR model to check database
    const MongoJMRRecord = (await import('../models/mongo/JMRRecord.js')).default;
    const MongoBlockchainLedger = (await import('../models/mongo/BlockchainLedger.js')).default;

    // Check if survey exists in database
    const dbRecord = await MongoJMRRecord.findOne({
      survey_number: surveyNumber,
      is_active: true
    });

    // Check if survey exists on blockchain
    const blockchainStatus = await enhancedBlockchainService.surveyExistsOnBlockchain(surveyNumber);
    const integrityStatus = await enhancedBlockchainService.getSurveyIntegrityStatus(surveyNumber);
    const timelineCount = await enhancedBlockchainService.getTimelineCount(surveyNumber);

    // Check local blockchain ledger for this survey
    const localBlockchainEntry = await MongoBlockchainLedger.findOne({
      survey_number: surveyNumber,
      $or: [
        { event_type: { $in: ['JMR_MEASUREMENT_UPLOADED', 'SURVEY_CREATED_ON_BLOCKCHAIN'] } },
        { transaction_type: { $exists: true } } // Old schema
      ]
    }).sort({ timestamp: -1 });

    // Determine overall status
    let overallStatus = 'unknown';
    let statusMessage = '';

    if (dbRecord && localBlockchainEntry) {
      overallStatus = 'synced';
      statusMessage = 'Record exists in database and on blockchain';
    } else if (dbRecord && !localBlockchainEntry) {
      overallStatus = 'database_only';
      statusMessage = 'Record exists in database but not on blockchain';
    } else if (!dbRecord && localBlockchainEntry) {
      overallStatus = 'blockchain_only';
      statusMessage = 'Record exists on blockchain but not in database';
    } else {
      overallStatus = 'not_found';
      statusMessage = 'Record not found in database or on blockchain';
    }

    // 🔧 FIX: Return data in expected format for frontend
    res.json({
      success: true,
      found: !!dbRecord,
      survey_number: surveyNumber,
      existsInDatabase: !!dbRecord,
      existsOnBlockchain: blockchainStatus,
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
    const blockchainEntries = await MongoBlockchainLedger.find({
      event_type: { $in: ['JMR_MEASUREMENT_UPLOADED', 'SURVEY_CREATED_ON_BLOCKCHAIN'] }
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

    res.json({
      success: true,
      data: timeline
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

    // Build survey list
    let surveyList = [];
    if (Array.isArray(survey_numbers) && survey_numbers.length > 0) {
      surveyList = [...new Set(survey_numbers.map(String))];
    } else {
      const surveyService = new SurveyDataAggregationService();
      const numbers = new Set();
      for (const [, collection] of Object.entries(surveyService.collections)) {
        try {
          const records = await collection.find({}, { survey_number: 1 });
          records.forEach(r => r?.survey_number && numbers.add(String(r.survey_number)));
        } catch (e) {
          // continue
        }
      }
      surveyList = Array.from(numbers);
    }

    // Delete existing blocks for these surveys
    const delResult = await MongoBlockchainLedger.deleteMany({ survey_number: { $in: surveyList } });

    // Rebuild with v2
    const results = [];
    for (const sn of surveyList) {
      try {
        const out = await ledgerV2.createOrUpdateFromLive(sn, officer_id, project_id, 'ledger_v2_rebuild');
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
    const result = await surveyService.bulkSyncAllSurveys(officer_id, project_id);

    res.json({
      success: true,
      message: 'Bulk sync completed successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Failed to bulk sync surveys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk sync surveys',
      error: error.message
    });
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

export default router;
