import express from 'express';
import { body, validationResult } from 'express-validator';
import MongoBlockchainLedger from '../models/mongo/BlockchainLedger.js';
import MongoNotice from '../models/mongo/Notice.js';
import MongoPayment from '../models/mongo/Payment.js';
import MongoJMRRecord from '../models/mongo/JMRRecord.js';
import MongoUser from '../models/mongo/User.js';
import MongoProject from '../models/mongo/Project.js';
import blockchainService from '../services/blockchainService.js';

const router = express.Router();

// Validation middleware
const validateBlockchainEntry = [
  body('survey_number').notEmpty().withMessage('Survey number is required'),
  body('event_type').isIn([
    'JMR_Measurement_Uploaded',
    'Notice_Generated',
    'Payment_Slip_Created',
    'Payment_Released',
    'Payment_Pending',
    'Payment_Failed',
    'Ownership_Updated',
    'Award_Declared',
    'Compensated'
  ]).withMessage('Invalid event type'),
  body('officer_id').isMongoId().withMessage('Valid officer ID is required'),
  body('project_id').isMongoId().withMessage('Valid project ID is required'),
  body('remarks').optional().isString().withMessage('Remarks must be a string')
];

// Get blockchain network status
router.get('/status', async (req, res) => {
  try {
    const status = await blockchainService.getNetworkStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Blockchain status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status',
      error: error.message
    });
  }
});

// Create new blockchain entry
router.post('/entry', validateBlockchainEntry, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      survey_number,
      event_type,
      officer_id,
      project_id,
      remarks,
      metadata = {}
    } = req.body;

    // Verify officer exists
    const officer = await MongoUser.findById(officer_id);
    if (!officer) {
      return res.status(404).json({
        success: false,
        message: 'Officer not found'
      });
    }

    // Verify project exists
    const project = await MongoProject.findById(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Create blockchain block
    const blockData = {
      surveyNumber: survey_number,
      eventType: event_type,
      officerId: officer_id,
      projectId: project_id,
      metadata: {
        ...metadata,
        officer_name: officer.name,
        officer_designation: officer.role,
        project_name: project.projectName
      },
      remarks
    };

    const blockchainBlock = await blockchainService.createBlock(blockData);

    // Save to database
    const ledgerEntry = await MongoBlockchainLedger.create(blockchainBlock);

    // Update related records based on event type
    await updateRelatedRecords(event_type, survey_number, officer_id, project_id, metadata);

    res.status(201).json({
      success: true,
      message: 'Blockchain entry created successfully',
      data: {
        block_id: ledgerEntry.block_id,
        survey_number: ledgerEntry.survey_number,
        event_type: ledgerEntry.event_type,
        timestamp: ledgerEntry.timestamp,
        hash: ledgerEntry.current_hash
      }
    });
  } catch (error) {
    console.error('Create blockchain entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blockchain entry',
      error: error.message
    });
  }
});

// Get blockchain ledger for a survey number
router.get('/ledger/:surveyNumber', async (req, res) => {
  try {
    const { surveyNumber } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: entries } = await MongoBlockchainLedger.findAndCountAll({
      where: { survey_number: surveyNumber },
      include: [
        {
          model: MongoUser,
          as: 'officer',
          attributes: ['name', 'designation', 'district', 'taluka']
        },
        {
          model: MongoProject,
          attributes: ['name', 'description']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Verify blockchain integrity
    const integrityCheck = await blockchainService.verifyBlockchainIntegrity(surveyNumber);

    res.json({
      success: true,
      data: {
        survey_number: surveyNumber,
        entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        },
        integrity: integrityCheck
      }
    });
  } catch (error) {
    console.error('Get blockchain ledger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain ledger',
      error: error.message
    });
  }
});

// Get blockchain statistics
router.get('/stats', async (req, res) => {
  try {
    const { project_id, officer_id, date_from, date_to } = req.query;

    let whereClause = {};
    if (project_id) whereClause.project_id = project_id;
    if (officer_id) whereClause.officer_id = officer_id;
    if (date_from || date_to) {
      whereClause.timestamp = {};
      if (date_from) whereClause.timestamp.$gte = new Date(date_from);
      if (date_to) whereClause.timestamp.$lte = new Date(date_to);
    }

    const totalEntries = await MongoBlockchainLedger.count({ where: whereClause });
    const validEntries = await MongoBlockchainLedger.count({ 
      where: { ...whereClause, is_valid: true } 
    });
    const invalidEntries = await MongoBlockchainLedger.count({ 
      where: { ...whereClause, is_valid: false } 
    });

    // Event type distribution
    const eventTypeStats = await MongoBlockchainLedger.findAll({
      where: whereClause,
      attributes: [
        'event_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['event_type'],
      raw: true
    });

    // Officer activity
    const officerStats = await MongoBlockchainLedger.findAll({
      where: whereClause,
      include: [{
        model: MongoUser,
        as: 'officer',
        attributes: ['name', 'designation']
      }],
      attributes: [
        'officer_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['officer_id'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total_entries: totalEntries,
        valid_entries: validEntries,
        invalid_entries: invalidEntries,
        integrity_rate: totalEntries > 0 ? (validEntries / totalEntries * 100).toFixed(2) : 0,
        event_type_distribution: eventTypeStats,
        officer_activity: officerStats,
        blockchain_status: await blockchainService.getNetworkStatus()
      }
    });
  } catch (error) {
    console.error('Get blockchain stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain statistics',
      error: error.message
    });
  }
});

// Verify blockchain integrity for a survey number
router.post('/verify/:surveyNumber', async (req, res) => {
  try {
    const { surveyNumber } = req.params;

    // Get all entries for the survey number
    const entries = await MongoBlockchainLedger.findAll({
      where: { survey_number: surveyNumber },
      order: [['timestamp', 'ASC']]
    });

    if (entries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No blockchain entries found for this survey number'
      });
    }

    // Verify each entry's hash
    const verificationResults = [];
    let previousHash = '0'.repeat(64);
    let isChainValid = true;

    for (const entry of entries) {
      const calculatedHash = blockchainService.calculateHash(
        entry.survey_number,
        entry.event_type,
        entry.officer_id,
        entry.timestamp,
        previousHash,
        entry.nonce
      );

      const isValid = entry.current_hash === calculatedHash;
      if (!isValid) {
        isChainValid = false;
      }

      verificationResults.push({
        block_id: entry.block_id,
        event_type: entry.event_type,
        timestamp: entry.timestamp,
        calculated_hash: calculatedHash,
        stored_hash: entry.current_hash,
        is_valid: isValid,
        previous_hash: previousHash
      });

      previousHash = calculatedHash;
    }

    // Update validity status in database
    for (const entry of entries) {
      const verificationResult = verificationResults.find(r => r.block_id === entry.block_id);
      if (verificationResult) {
        await entry.update({ is_valid: verificationResult.is_valid });
      }
    }

    res.json({
      success: true,
      data: {
        survey_number: surveyNumber,
        total_entries: entries.length,
        chain_valid: isChainValid,
        verification_results: verificationResults,
        blockchain_verification: await blockchainService.verifyBlockchainIntegrity(surveyNumber)
      }
    });
  } catch (error) {
    console.error('Verify blockchain integrity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify blockchain integrity',
      error: error.message
    });
  }
});

// Get gas estimate for blockchain operation
router.post('/gas-estimate', async (req, res) => {
  try {
    const { survey_number, event_type, metadata } = req.body;

    if (!survey_number || !event_type) {
      return res.status(400).json({
        success: false,
        message: 'Survey number and event type are required'
      });
    }

    const gasEstimate = await blockchainService.estimateGas(survey_number, event_type, metadata);

    res.json({
      success: true,
      data: gasEstimate
    });
  } catch (error) {
    console.error('Gas estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get gas estimate',
      error: error.message
    });
  }
});

// Simulate blockchain mining (for demo purposes)
router.post('/mine', async (req, res) => {
  try {
    const { difficulty = 4 } = req.body;

    const result = await blockchainService.mineBlock(difficulty);

    res.json({
      success: true,
      message: `Block mined with difficulty ${difficulty}`,
      data: result
    });
  } catch (error) {
    console.error('Mining error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mine block',
      error: error.message
    });
  }
});

// Helper function to update related records
async function updateRelatedRecords(eventType, surveyNumber, officerId, projectId, metadata) {
  try {
    switch (eventType) {
      case 'JMR_Measurement_Uploaded':
        // Update JMR record status
        await MongoJMRRecord.update(
          { status: 'approved' },
          { where: { survey_number: surveyNumber, project_id: projectId } }
        );
        break;

      case 'Notice_Generated':
        // Update notice status
        await MongoNotice.update(
          { status: 'sent' },
          { where: { survey_number: surveyNumber, project_id: projectId } }
        );
        break;

      case 'Payment_Slip_Created':
        // Update payment status
        await MongoPayment.update(
          { status: 'Pending' },
          { where: { survey_number: surveyNumber, project_id: projectId } }
        );
        break;

      case 'Payment_Released':
        // Update payment status
        await MongoPayment.update(
          { status: 'Success', payment_date: new Date() },
          { where: { survey_number: surveyNumber, project_id: projectId } }
        );
        break;

      case 'Payment_Failed':
        // Update payment status with reason
        await MongoPayment.update(
          { 
            status: 'Failed',
            reason_if_pending: metadata.failure_reason || 'Payment processing failed'
          },
          { where: { survey_number: surveyNumber, project_id: projectId } }
        );
        break;
    }
  } catch (error) {
    console.error('Failed to update related records:', error);
  }
}

export default router;
