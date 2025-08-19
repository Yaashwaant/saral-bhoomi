import express from 'express';
import { body, param, validationResult } from 'express-validator';
import EnhancedBlockchainService from '../services/enhancedBlockchainService.js';
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
      event_type: 'JMR_MEASUREMENT_UPLOADED'
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
      event_type: 'JMR_MEASUREMENT_UPLOADED'
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

export default router;
