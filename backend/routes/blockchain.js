import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import EnhancedBlockchainService from '../services/enhancedBlockchainService.js';
import SurveyDataAggregationService from '../services/surveyDataAggregationService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const enhancedBlockchainService = new EnhancedBlockchainService();

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
    const status = await enhancedBlockchainService.getEnhancedNetworkStatus();
    res.json(status);
  } catch (error) {
    console.error('❌ Blockchain status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status',
      error: error.message
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

    res.json({
      success: true,
      data: {
        surveyNumber,
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
        blockchainEntry: localBlockchainEntry ? {
          block_id: localBlockchainEntry.block_id,
          current_hash: localBlockchainEntry.current_hash,
          timestamp: localBlockchainEntry.timestamp
        } : null
      }
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

    res.json({
      success: true,
      data: {
        surveyNumber,
        timeline,
        totalEvents: timeline.length
      }
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

    const integrityStatus = await enhancedBlockchainService.getSurveyIntegrityStatus(surveyNumber);

    res.json({
      success: true,
      data: {
        surveyNumber,
        integrityStatus
      }
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

// ===== BLOCKCHAIN STATISTICS =====

/**
 * @route GET /api/blockchain/stats
 * @desc Get blockchain statistics and overview
 * @access Private (Officers only)
 */
router.get('/stats', [
  authMiddleware
], async (req, res) => {
  try {
    const MongoBlockchainLedger = (await import('../models/mongo/BlockchainLedger.js')).default;

    // Get overall statistics
    const totalEntries = await MongoBlockchainLedger.countDocuments();
    const uniqueSurveys = await MongoBlockchainLedger.distinct('survey_number');
    const eventTypes = await MongoBlockchainLedger.distinct('event_type');

    // Get recent activity
    const recentEntries = await MongoBlockchainLedger.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .select('survey_number event_type timestamp officer_id');

    // Get event type distribution
    const eventDistribution = await Promise.all(
      eventTypes.map(async (eventType) => {
        const count = await MongoBlockchainLedger.countDocuments({ event_type: eventType });
        return { event_type: eventType, count };
      })
    );

    res.json({
      success: true,
      data: {
        overview: {
          total_entries: totalEntries,
          unique_surveys: uniqueSurveys.length,
          event_types: eventTypes.length
        },
        recent_activity: recentEntries,
        event_distribution: eventDistribution
      }
    });
  } catch (error) {
    console.error('❌ Failed to get blockchain stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain statistics',
      error: error.message
    });
  }
});

// ===== SURVEY CREATION ON BLOCKCHAIN =====

/**
 * @route POST /api/blockchain/create-survey
 * @desc Create a new survey record on the blockchain
 * @access Private (Officers only)
 */
router.post('/create-survey', [
  authMiddleware,
  body('survey_number').notEmpty().withMessage('Survey number is required'),
  body('owner_id').notEmpty().withMessage('Owner ID is required'),
  body('land_type').notEmpty().withMessage('Land type is required'),
  body('area').isFloat({ min: 0 }).withMessage('Area must be a positive number'),
  body('location').notEmpty().withMessage('Location is required'),
  body('officer_id').notEmpty().withMessage('Officer ID is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      survey_number,
      owner_id,
      land_type,
      area,
      location,
      officer_id,
      project_id
    } = req.body;

    // Check if survey already exists on blockchain
    const existingEntry = await enhancedBlockchainService.surveyExistsOnBlockchain(survey_number);
    if (existingEntry) {
      return res.status(400).json({
        success: false,
        message: 'Survey already exists on blockchain'
      });
    }

    // Create blockchain entry
    const blockchainEntry = await enhancedBlockchainService.createLedgerEntry({
      survey_number,
      event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN',
      officer_id,
      project_id,
      metadata: {
        owner_id,
        land_type,
        area: parseFloat(area),
        location,
        creation_method: 'direct_blockchain'
      },
      remarks: `Survey ${survey_number} created directly on blockchain`,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Survey created on blockchain successfully',
      data: {
        survey_number,
        block_id: blockchainEntry.block_id,
        hash: blockchainEntry.current_hash,
        timestamp: blockchainEntry.timestamp
      }
    });
  } catch (error) {
    console.error('❌ Failed to create survey on blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create survey on blockchain',
      error: error.message
    });
  }
});

// ===== ENHANCED BLOCKCHAIN OPERATIONS =====

/**
 * @route POST /api/blockchain/create-or-update-survey
 * @desc Create or update survey block on blockchain
 * @access Private (Officers only)
 */
router.post('/create-or-update-survey', [
  authMiddleware,
  body('survey_number').notEmpty().withMessage('Survey number is required'),
  body('data').notEmpty().withMessage('Survey data is required'),
  body('event_type').notEmpty().withMessage('Event type is required'),
  body('officer_id').notEmpty().withMessage('Officer ID is required'),
  body('project_id').optional().isString().withMessage('Project ID must be a string'),
  body('remarks').optional().isString().withMessage('Remarks must be a string'),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      survey_number,
      data,
      event_type,
      officer_id,
      project_id,
      remarks
    } = req.body;

    const result = await enhancedBlockchainService.createOrUpdateSurveyBlock(
      survey_number,
      data,
      event_type,
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
 * @route POST /api/blockchain/add-timeline-entry
 * @desc Add timeline entry to survey block
 * @access Private (Officers only)
 */
router.post('/add-timeline-entry', [
  authMiddleware,
  body('survey_number').notEmpty().withMessage('Survey number is required'),
  body('action').notEmpty().withMessage('Action is required'),
  body('officer_id').notEmpty().withMessage('Officer ID is required'),
  body('data_hash').notEmpty().withMessage('Data hash is required'),
  body('previous_hash').notEmpty().withMessage('Previous hash is required'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('remarks').optional().isString().withMessage('Remarks must be a string'),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      survey_number,
      action,
      officer_id,
      data_hash,
      previous_hash,
      metadata,
      remarks
    } = req.body;

    const result = await enhancedBlockchainService.addTimelineEntry(
      survey_number,
      action,
      officer_id,
      data_hash,
      previous_hash,
      metadata,
      remarks
    );

    res.json({
      success: true,
      message: 'Timeline entry added successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Failed to add timeline entry:', error);
    res.status(500).json({
        success: false,
      message: 'Failed to add timeline entry',
      error: error.message
    });
  }
});

/**
 * @route GET /api/blockchain/verify-integrity/:surveyNumber
 * @desc Verify survey integrity
 * @access Private (Officers only)
 */
router.get('/verify-integrity/*', [
  authMiddleware,
  param('0').notEmpty().withMessage('Survey number is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const surveyNumber = req.params[0];
    const integrity = await enhancedBlockchainService.verifySurveyIntegrity(surveyNumber);

    res.json({
      success: true,
      data: integrity
    });
  } catch (error) {
    console.error('❌ Failed to verify survey integrity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify survey integrity',
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
    
    res.json({
      success: true,
      data: surveys,
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
    
    const surveyService = new SurveyDataAggregationService();
    const result = await surveyService.createOrUpdateSurveyBlock(
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
