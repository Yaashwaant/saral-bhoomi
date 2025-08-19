import express from 'express';
import { body, param, validationResult } from 'express-validator';
import enhancedBlockchainService from '../services/enhancedBlockchainService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ===== MIDDLEWARE =====
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
        success: false,
      errors: errors.array() 
    });
  }
  next();
};

// ===== BLOCKCHAIN STATUS & MONITORING =====

/**
 * @route GET /api/blockchain/status
 * @desc Get enhanced blockchain network status
 * @access Public (for dashboard display)
 */
router.get('/status', async (req, res) => {
  try {
          // Get real blockchain status from the enhanced service
      let blockchainStatus;
      try {
        blockchainStatus = await enhancedBlockchainService.getEnhancedNetworkStatus();
      } catch (error) {
        console.warn('⚠️ Failed to get real blockchain status, using fallback:', error.message);
        blockchainStatus = {
          connected: false,
          network: 'Unknown',
          chainId: null,
          blockNumber: null,
          gasPrice: null,
          maxPriorityFee: null,
          maxFee: null,
          walletBalance: null,
          pendingTransactions: 0,
          totalTransactions: 0,
          serviceStatus: 'Blockchain service unavailable'
        };
      }
    
    res.json({
      success: true,
      data: blockchainStatus
    });
  } catch (error) {
    console.error('❌ Failed to get blockchain status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status',
      error: error.message
    });
  }
});

// ===== SURVEY BLOCK MANAGEMENT =====

/**
 * @route POST /api/blockchain/create-survey
 * @desc Create initial survey block with all current data
 * @access Private (Officers only)
 */
router.post('/create-survey', [
  authMiddleware,
  body('surveyNumber').notEmpty().withMessage('Survey number is required'),
  body('ownerId').notEmpty().withMessage('Owner ID is required'),
  body('landType').notEmpty().withMessage('Land type is required'),
  body('jmrData').optional().isObject().withMessage('JMR data must be an object'),
  body('awardData').optional().isObject().withMessage('Award data must be an object'),
  body('landRecordData').optional().isObject().withMessage('Land record data must be an object'),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      surveyNumber,
      ownerId,
      landType,
      jmrData,
      awardData,
      landRecordData
    } = req.body;

    // Check if survey already exists on blockchain
    const exists = await enhancedBlockchainService.surveyExistsOnBlockchain(surveyNumber);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Survey block already exists for this survey number'
      });
    }

    // Create survey block
    const result = await enhancedBlockchainService.createSurveyBlock({
      surveyNumber,
      ownerId,
      landType,
      jmrData: jmrData || {},
      awardData: awardData || {},
      landRecordData: landRecordData || {}
    });

    res.json({
      success: true,
      message: 'Survey block created successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Failed to create survey block:', error);
    res.status(500).json({
        success: false,
      message: 'Failed to create survey block',
      error: error.message
    });
  }
});

/**
 * @route POST /api/blockchain/add-event
 * @desc Add new timeline event for survey changes
 * @access Private (Officers only)
 */
router.post('/add-event', [
  authMiddleware,
  body('surveyNumber').notEmpty().withMessage('Survey number is required'),
  body('eventType').notEmpty().withMessage('Event type is required'),
  body('ownerId').notEmpty().withMessage('Owner ID is required'),
  body('landType').notEmpty().withMessage('Land type is required'),
  body('details').notEmpty().withMessage('Event details are required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      surveyNumber,
      eventType,
      ownerId,
      landType,
      details
    } = req.body;

    // Check if survey block exists
    const exists = await enhancedBlockchainService.surveyExistsOnBlockchain(surveyNumber);
    if (!exists) {
      return res.status(400).json({
        success: false,
        message: 'Survey block does not exist. Create survey block first.'
      });
    }

    // Add timeline event
    const result = await enhancedBlockchainService.addTimelineEvent(surveyNumber, {
      eventType,
      ownerId,
      landType,
      details
    });

    res.json({
      success: true,
      message: 'Timeline event added successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Failed to add timeline event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add timeline event',
      error: error.message
    });
  }
});

// ===== SURVEY LOOKUP & SEARCH =====

/**
 * @route GET /api/blockchain/search/:surveyNumber
 * @desc Search for survey details and blockchain status
 * @access Private (Officers only)
 */
router.get('/search/:surveyNumber', [
  authMiddleware,
  param('surveyNumber').notEmpty().withMessage('Survey number is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { surveyNumber } = req.params;

    // Get survey data from database (you'll need to implement this based on your existing models)
    // For now, we'll return blockchain status
    const blockchainStatus = await enhancedBlockchainService.surveyExistsOnBlockchain(surveyNumber);
    const integrityStatus = await enhancedBlockchainService.getSurveyIntegrityStatus(surveyNumber);
    const timelineCount = await enhancedBlockchainService.getTimelineCount(surveyNumber);

    // TODO: Fetch survey data from your existing database models
    // const surveyData = await getSurveyDataFromDatabase(surveyNumber);

    res.json({
      success: true,
      data: {
        surveyNumber,
        existsOnBlockchain: blockchainStatus,
        integrityStatus: integrityStatus || { isIntegrityValid: false, lastChecked: null, compromiseReason: 'Not checked' },
        timelineCount,
        // surveyData: surveyData || null
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

// ===== TIMELINE & HISTORY =====

/**
 * @route GET /api/blockchain/timeline/:surveyNumber
 * @desc Get complete timeline for a survey number
 * @access Private (Officers only)
 */
router.get('/timeline/:surveyNumber', [
  authMiddleware,
  param('surveyNumber').notEmpty().withMessage('Survey number is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { surveyNumber } = req.params;

    // Check if survey exists on blockchain
    const exists = await enhancedBlockchainService.surveyExistsOnBlockchain(surveyNumber);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found on blockchain'
      });
    }

    // Get timeline
    const timeline = await enhancedBlockchainService.getSurveyTimeline(surveyNumber);

    res.json({
      success: true,
      data: {
        surveyNumber,
        timeline: timeline || [],
        totalEvents: timeline ? timeline.length : 0
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

// ===== INTEGRITY VERIFICATION =====

/**
 * @route POST /api/blockchain/verify-integrity/:surveyNumber
 * @desc Verify survey integrity by comparing database hash with blockchain hash
 * @access Private (Officers only)
 */
router.post('/verify-integrity/:surveyNumber', [
  authMiddleware,
  param('surveyNumber').notEmpty().withMessage('Survey number is required'),
  body('databaseHash').notEmpty().withMessage('Database hash is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { surveyNumber } = req.params;
    const { databaseHash } = req.body;

    // Verify integrity
    const result = await enhancedBlockchainService.verifySurveyIntegrity(surveyNumber, databaseHash);

    res.json({
      success: true,
      data: result
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
 * @route GET /api/blockchain/integrity-status/:surveyNumber
 * @desc Get integrity status for a survey number
 * @access Private (Officers only)
 */
router.get('/integrity-status/:surveyNumber', [
  authMiddleware,
  param('surveyNumber').notEmpty().withMessage('Survey number is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { surveyNumber } = req.params;

    const status = await enhancedBlockchainService.getSurveyIntegrityStatus(surveyNumber);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Integrity status not found for this survey'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Failed to get integrity status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get integrity status',
      error: error.message
    });
  }
});

// ===== BULK OPERATIONS =====

/**
 * @route POST /api/blockchain/bulk-status
 * @desc Get blockchain status for multiple survey numbers
 * @access Private (Officers only)
 */
router.post('/bulk-status', [
  authMiddleware,
  body('surveyNumbers').isArray().withMessage('Survey numbers must be an array'),
  body('surveyNumbers.*').isString().withMessage('Each survey number must be a string'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { surveyNumbers } = req.body;

    const results = await enhancedBlockchainService.getSurveysWithBlockchainStatus(surveyNumbers);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('❌ Failed to get bulk status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bulk status',
      error: error.message
    });
  }
});

// ===== TRANSACTION HISTORY =====

/**
 * @route GET /api/blockchain/transactions
 * @desc Get transaction history
 * @access Private (Officers only)
 */
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    // This would return transaction history from the enhanced service
    // For now, return a placeholder
    res.json({
      success: true,
      data: {
        message: 'Transaction history endpoint - to be implemented',
        pendingCount: 0,
        totalCount: 0
      }
    });
  } catch (error) {
    console.error('❌ Failed to get transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
});

// ===== HEALTH CHECK =====

/**
 * @route GET /api/blockchain/health
 * @desc Check blockchain service health
 * @access Public
 */
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      service: 'Enhanced Blockchain Service',
      status: 'healthy',
      network: 'Polygon Mumbai Testnet',
      chainId: 80001,
      message: 'Service is running (blockchain integration pending configuration)'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      timestamp: new Date().toISOString(),
      service: 'Enhanced Blockchain Service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

export default router;
