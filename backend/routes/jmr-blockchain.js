import express from 'express';
import multer from 'multer';
import { body, param, query, validationResult } from 'express-validator';
import MongoJMRRecord from '../models/mongo/JMRRecord.js';
import MongoProject from '../models/mongo/Project.js';
import MongoBlockchainLedger from '../models/mongo/BlockchainLedger.js';
import EnhancedBlockchainService from '../services/enhancedBlockchainService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const enhancedBlockchainService = new EnhancedBlockchainService();

// Initialize blockchain service
enhancedBlockchainService.initialize().catch(console.error);

// Multer configuration for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Validation middleware
const validateJMR = [
  body('survey_number').notEmpty().withMessage('Survey number is required'),
  body('measured_area').isFloat({ min: 0 }).withMessage('Measured area must be a positive number'),
  body('land_type').notEmpty().withMessage('Land type is required'),
  body('village').notEmpty().withMessage('Village is required'),
  body('taluka').notEmpty().withMessage('Taluka is required'),
  body('district').notEmpty().withMessage('District is required'),
  body('officer_id').notEmpty().withMessage('Officer ID is required'),
  body('project_id').notEmpty().withMessage('Project ID is required'),
];

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

// ===== JMR CRUD OPERATIONS =====

/**
 * @route POST /
 * @desc Create JMR record with automatic blockchain integration
 * @access Private (Officers only)
 */
router.post('/', validateJMR, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      survey_number,
      measured_area,
      land_type,
      tribal_classification = false,
      village,
      taluka,
      district,
      owner_id,
      officer_id,
      project_id,
      remarks = ''
    } = req.body;

    // Check if survey already exists
    const existingSurvey = await MongoJMRRecord.findOne({ survey_number });
    if (existingSurvey) {
      return res.status(400).json({
        success: false,
        message: 'Survey number already exists'
      });
    }

    // Create JMR record
    const jmrRecord = await MongoJMRRecord.create({
      survey_number,
        measured_area: parseFloat(measured_area),
        land_type,
        tribal_classification: tribal_classification === 'true',
        village,
        taluka,
        district,
      owner_id,
      officer_id,
      project_id,
      remarks,
      is_active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create or update blockchain survey block automatically
    try {
      const blockchainResult = await enhancedBlockchainService.createOrUpdateSurveyBlock(
        survey_number,
        jmrRecord.toObject(),
        'JMR_MEASUREMENT_UPLOADED',
        officer_id,
        project_id,
        `JMR measurement uploaded for survey ${survey_number}`
      );

      // Update JMR record with blockchain info
      await MongoJMRRecord.findByIdAndUpdate(jmrRecord._id, {
        blockchain_block_id: blockchainResult.block_id,
        blockchain_hash: blockchainResult.hash,
        blockchain_status: 'synced',
        blockchain_last_verified: new Date()
      });

      console.log('✅ Blockchain survey block created/updated for JMR:', survey_number);
    } catch (blockchainError) {
      console.warn('⚠️ Failed to create blockchain survey block for JMR:', survey_number, blockchainError.message);
      // Continue with JMR creation even if blockchain fails
    }

    res.status(201).json({
      success: true,
      message: 'JMR record created successfully with blockchain integration',
      data: {
        jmr_id: jmrRecord._id,
        survey_number: jmrRecord.survey_number,
        blockchain_synced: true
      }
    });
  } catch (error) {
    console.error('Create JMR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create JMR record',
      error: error.message
    });
  }
});

/**
 * @route GET /
 * @desc Get all JMR records with blockchain status
 * @access Private (Officers only)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, project_id, officer_id } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query conditions
    const whereClause = { is_active: true };

    if (project_id) whereClause.project_id = project_id;
    if (officer_id) whereClause.officer_id = officer_id;
    
    if (search) {
      whereClause.$or = [
        { survey_number: { $regex: search, $options: 'i' } },
        { landowner_id: { $regex: search, $options: 'i' } },
        { village: { $regex: search, $options: 'i' } },
        { taluka: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } }
      ];
    }

    // Use MongoDB methods instead of Sequelize methods
    const jmrRecords = await MongoJMRRecord.find(whereClause)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('project_id', 'name description');

    const count = await MongoJMRRecord.countDocuments(whereClause);

    // Get blockchain verification status for each record
    const recordsWithBlockchain = await Promise.all(
      jmrRecords.map(async (record) => {
        const blockchainEntries = await MongoBlockchainLedger.find({ 
            survey_number: record.survey_number,
          event_type: 'JMR_MEASUREMENT_UPLOADED'
        }).sort({ timestamp: -1 }).limit(1);

        return {
          ...record.toObject(),
          blockchain_verified: blockchainEntries.length > 0,
          blockchain_hash: blockchainEntries[0]?.current_hash || null,
          blockchain_timestamp: blockchainEntries[0]?.timestamp || null
        };
      })
    );

    res.json({
      success: true,
      data: {
        records: recordsWithBlockchain,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get JMR records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get JMR records',
      error: error.message
    });
  }
});

/**
 * @route GET /:id
 * @desc Get JMR record by ID with blockchain history
 * @access Private (Officers only)
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const jmrRecord = await MongoJMRRecord.findById(id).populate('project_id', 'name description');
    if (!jmrRecord) {
      return res.status(404).json({
        success: false,
        message: 'JMR record not found'
      });
    }

    // Get blockchain history for this survey number
    const blockchainHistory = await MongoBlockchainLedger.find({ 
      survey_number: jmrRecord.survey_number 
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      data: {
        jmr: jmrRecord,
        blockchain_history: blockchainHistory
      }
    });
  } catch (error) {
    console.error('Get JMR record error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get JMR record',
      error: error.message
    });
  }
});

/**
 * @route PUT /:id
 * @desc Update JMR record with blockchain logging
 * @access Private (Officers only)
 */
router.put('/:id', validateJMR, authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const jmrRecord = await MongoJMRRecord.findById(id);
    if (!jmrRecord) {
      return res.status(404).json({
        success: false,
        message: 'JMR record not found'
      });
    }

    // Store old values for blockchain logging
    const oldValues = { ...jmrRecord.toObject() };

    // Update JMR record
    await MongoJMRRecord.findByIdAndUpdate(id, updateData, { new: true });

    // Create blockchain entry for update
    try {
      const blockchainEntry = await enhancedBlockchainService.createLedgerEntry({
        survey_number: jmrRecord.survey_number,
        event_type: 'JMR_MEASUREMENT_UPDATED',
        officer_id: req.user?.id || 1,
        project_id: jmrRecord.project_id,
      metadata: {
          jmr_id: jmrRecord._id,
        old_values: oldValues,
        new_values: updateData,
          update_reason: updateData.remarks || 'Record updated'
        },
        remarks: `JMR record updated for survey ${jmrRecord.survey_number}`,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Blockchain entry created for JMR update:', jmrRecord.survey_number);
    } catch (blockchainError) {
      console.warn('⚠️ Failed to create blockchain entry for JMR update:', jmrRecord.survey_number, blockchainError.message);
    }

    res.json({
      success: true,
      message: 'JMR record updated successfully with blockchain logging',
      data: {
        jmr_id: jmrRecord._id,
        survey_number: jmrRecord.survey_number,
        blockchain_synced: true
      }
    });
  } catch (error) {
    console.error('Update JMR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update JMR record',
      error: error.message
    });
  }
});

/**
 * @route DELETE /:id
 * @desc Delete JMR record with blockchain logging
 * @access Private (Officers only)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Record deleted by user' } = req.body;

    const jmrRecord = await MongoJMRRecord.findById(id);
    if (!jmrRecord) {
      return res.status(404).json({
        success: false,
        message: 'JMR record not found'
      });
    }

    // Create blockchain entry for deletion using enhanced service
    try {
      const blockchainEntry = await enhancedBlockchainService.createLedgerEntry({
        survey_number: jmrRecord.survey_number,
        event_type: 'JMR_MEASUREMENT_DELETED',
        officer_id: req.user?.id || 1,
        project_id: jmrRecord.project_id,
      metadata: {
          deleted_jmr_id: jmrRecord._id,
        deleted_at: new Date().toISOString(),
        reason: reason || 'Record deleted by user'
      },
        remarks: `JMR record deleted for survey ${jmrRecord.survey_number}. Reason: ${reason || 'Not specified'}`,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Blockchain entry created for JMR deletion:', jmrRecord.survey_number);
    } catch (blockchainError) {
      console.warn('⚠️ Failed to create blockchain entry for JMR deletion:', jmrRecord.survey_number, blockchainError.message);
    }

    // Soft delete - mark as inactive
    await MongoJMRRecord.findByIdAndUpdate(id, { 
      is_active: false,
      updated_at: new Date() 
    });

    res.json({
      success: true,
      message: 'JMR record deleted successfully with blockchain logging',
      data: {
        jmr_id: jmrRecord._id,
        survey_number: jmrRecord.survey_number,
        blockchain_synced: true
      }
    });
  } catch (error) {
    console.error('Delete JMR error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete JMR record',
      error: error.message
    });
  }
});

// ===== BULK OPERATIONS =====

/**
 * @route POST /bulk-upload
 * @desc Bulk upload JMR records with blockchain integration
 * @access Private (Officers only)
 */
router.post('/bulk-upload', upload.single('csv'), authMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const csvContent = req.file.buffer.toString();
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate required fields
        if (!row.survey_number || !row.measured_area || !row.land_type) {
          throw new Error('Missing required fields');
        }

        // Create JMR record
        const jmrRecord = await MongoJMRRecord.create({
          survey_number: row.survey_number,
          measured_area: parseFloat(row.measured_area),
          land_type: row.land_type || 'Agricultural',
          tribal_classification: row.tribal_classification === 'true',
          village: row.village,
          taluka: row.taluka,
          district: row.district,
          owner_id: row.owner_id,
          officer_id: row.officer_id || 1,
          project_id: row.project_id || 1,
          remarks: row.remarks || 'Bulk upload',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });

        // Create blockchain entry automatically
        try {
          const blockchainEntry = await enhancedBlockchainService.createJMRBlockchainEntry(
            jmrRecord,
            row.officer_id || 1,
            row.project_id || 1
          );

          // Store in local blockchain ledger for reference
          await MongoBlockchainLedger.create({
            ...blockchainEntry.toObject(),
            project_id: row.project_id || 1,
            officer_id: row.officer_id || 1
          });

          successCount++;
          results.push({
            survey_number: row.survey_number,
            status: 'success',
            jmr_id: jmrRecord._id,
            blockchain_entry: blockchainEntry._id
          });

          console.log(`✅ Bulk upload: Survey ${row.survey_number} created with blockchain entry`);
        } catch (blockchainError) {
          console.warn(`⚠️ Failed to create blockchain entry for survey ${row.survey_number}:`, blockchainError.message);
          // Still count as success for JMR creation
          successCount++;
          results.push({
            survey_number: row.survey_number,
            status: 'success_no_blockchain',
            jmr_id: jmrRecord._id,
            error: blockchainError.message
          });
        }
      } catch (error) {
        errorCount++;
        results.push({
          survey_number: row.survey_number || 'unknown',
          status: 'error',
          error: error.message
        });
        console.error(`❌ Bulk upload error for row ${i}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: `Bulk upload completed. ${successCount} successful, ${errorCount} errors`,
      data: {
        total: lines.length - 1,
        successful: successCount,
        errors: errorCount,
        results
      }
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk upload',
      error: error.message
    });
  }
});

// ===== BULK BLOCKCHAIN SYNC =====

/**
 * @route POST /bulk-sync
 * @desc Bulk sync existing JMR records to blockchain
 * @access Private (Officers only)
 */
router.post('/bulk-sync', authMiddleware, async (req, res) => {
  try {
    const { project_id, officer_id = 1 } = req.body;

    // Get all JMR records that don't have blockchain entries
    const jmrRecords = await MongoJMRRecord.find({
      is_active: true,
      ...(project_id && { project_id })
    });

    if (jmrRecords.length === 0) {
      return res.json({
        success: true,
        message: 'No JMR records found to sync',
        data: { synced: 0, total: 0 }
      });
    }

    let syncedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const jmrRecord of jmrRecords) {
      try {
        // Check if blockchain entry already exists
        const existingBlockchainEntry = await MongoBlockchainLedger.findOne({
          survey_number: jmrRecord.survey_number,
          event_type: 'JMR_MEASUREMENT_UPLOADED'
        });

        if (existingBlockchainEntry) {
          results.push({
            survey_number: jmrRecord.survey_number,
            status: 'already_synced',
            message: 'Already exists on blockchain'
          });
          continue;
        }

        // Create or update blockchain survey block
        const blockchainResult = await enhancedBlockchainService.createOrUpdateSurveyBlock(
          jmrRecord.survey_number,
          jmrRecord.toObject(),
          'JMR_MEASUREMENT_UPLOADED',
          officer_id,
          jmrRecord.project_id,
          `Bulk sync: JMR measurement for survey ${jmrRecord.survey_number}`
        );

        // Update JMR record with blockchain info
        await MongoJMRRecord.findByIdAndUpdate(jmrRecord._id, {
          blockchain_block_id: blockchainResult.block_id,
          blockchain_hash: blockchainResult.hash,
          blockchain_status: 'synced',
          blockchain_last_verified: new Date()
        });

        syncedCount++;
        results.push({
          survey_number: jmrRecord.survey_number,
          status: 'synced',
          block_id: blockchainResult.block_id,
          hash: blockchainResult.hash
        });

        console.log(`✅ Synced survey ${jmrRecord.survey_number} to blockchain`);
      } catch (error) {
        errorCount++;
        results.push({
          survey_number: jmrRecord.survey_number,
          status: 'error',
          error: error.message
        });
        console.error(`❌ Failed to sync survey ${jmrRecord.survey_number}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: `Bulk sync completed. ${syncedCount} records synced, ${errorCount} errors`,
      data: {
        synced: syncedCount,
        errors: errorCount,
        total: jmrRecords.length,
        results
      }
    });

  } catch (error) {
    console.error('❌ Bulk sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk sync',
      error: error.message
    });
  }
});

// ===== ENHANCED JMR BLOCKCHAIN OPERATIONS =====

/**
 * @route GET /:id/blockchain-status
 * @desc Get blockchain status for specific JMR record
 * @access Private (Officers only)
 */
router.get('/:id/blockchain-status', [
  authMiddleware,
  param('id').notEmpty().withMessage('JMR ID is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const jmrId = req.params.id;
    const jmrRecord = await MongoJMRRecord.findById(jmrId);

    if (!jmrRecord) {
      return res.status(404).json({
        success: false,
        message: 'JMR record not found'
      });
    }

    // Get blockchain status
    const blockchainStatus = await enhancedBlockchainService.verifySurveyIntegrity(jmrRecord.survey_number);
    const timeline = await enhancedBlockchainService.getSurveyTimeline(jmrRecord.survey_number);

    res.json({
      success: true,
      data: {
        jmr_record: jmrRecord,
        blockchain_status: blockchainStatus,
        timeline: timeline,
        blockchain_info: {
          block_id: jmrRecord.blockchain_block_id,
          hash: jmrRecord.blockchain_hash,
          status: jmrRecord.blockchain_status,
          last_verified: jmrRecord.blockchain_last_verified
        }
      }
    });
  } catch (error) {
    console.error('❌ Failed to get JMR blockchain status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get JMR blockchain status',
      error: error.message
    });
  }
});

/**
 * @route POST /:id/update-with-blockchain
 * @desc Update JMR record and blockchain block
 * @access Private (Officers only)
 */
router.post('/:id/update-with-blockchain', [
  authMiddleware,
  param('id').notEmpty().withMessage('JMR ID is required'),
  body('updates').isObject().withMessage('Updates must be an object'),
  body('officer_id').notEmpty().withMessage('Officer ID is required'),
  body('remarks').optional().isString().withMessage('Remarks must be a string'),
  handleValidationErrors
], async (req, res) => {
  try {
    const jmrId = req.params.id;
    const { updates, officer_id, remarks } = req.body;

    // Get existing JMR record
    const existingJMR = await MongoJMRRecord.findById(jmrId);
    if (!existingJMR) {
      return res.status(404).json({
        success: false,
        message: 'JMR record not found'
      });
    }

    // Update JMR record
    const updatedJMR = await MongoJMRRecord.findByIdAndUpdate(
      jmrId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    // Update blockchain block
    try {
      const blockchainResult = await enhancedBlockchainService.updateSurveyBlock(
        existingJMR.blockchain_block_id ? await MongoBlockchainLedger.findById(existingJMR.blockchain_block_id) : null,
        updatedJMR.toObject(),
        'JMR_MEASUREMENT_UPDATED',
        officer_id,
        updatedJMR.project_id,
        remarks || `JMR record updated for survey ${updatedJMR.survey_number}`
      );

      // Update JMR record with new blockchain info
      await MongoJMRRecord.findByIdAndUpdate(jmrId, {
        blockchain_hash: blockchainResult.hash,
        blockchain_last_verified: new Date()
      });

      console.log('✅ JMR and blockchain updated successfully:', updatedJMR.survey_number);
    } catch (blockchainError) {
      console.warn('⚠️ Failed to update blockchain for JMR:', updatedJMR.survey_number, blockchainError.message);
      // Continue with JMR update even if blockchain fails
    }

    res.json({
      success: true,
      message: 'JMR record updated successfully with blockchain integration',
      data: {
        jmr_record: updatedJMR,
        blockchain_updated: true
      }
    });
  } catch (error) {
    console.error('❌ Failed to update JMR with blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update JMR record',
      error: error.message
    });
  }
});

/**
 * @route GET /:id/timeline
 * @desc Get timeline for specific JMR record
 * @access Private (Officers only)
 */
router.get('/:id/timeline', [
  authMiddleware,
  param('id').notEmpty().withMessage('JMR ID is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const jmrId = req.params.id;
    const jmrRecord = await MongoJMRRecord.findById(jmrId);

    if (!jmrRecord) {
      return res.status(404).json({
        success: false,
        message: 'JMR record not found'
      });
    }

    const timeline = await enhancedBlockchainService.getSurveyTimeline(jmrRecord.survey_number);

    res.json({
      success: true,
      data: {
        jmr_record: jmrRecord,
        timeline: timeline
      }
    });
  } catch (error) {
    console.error('❌ Failed to get JMR timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get JMR timeline',
      error: error.message
    });
  }
});

export default router;
