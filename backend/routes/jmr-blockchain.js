import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import MongoJMRRecord from '../models/mongo/JMRRecord.js';
import MongoProject from '../models/mongo/Project.js';
import MongoBlockchainLedger from '../models/mongo/BlockchainLedger.js';
import enhancedBlockchainService from '../services/enhancedBlockchainService.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(__dirname, '../uploads/jmr');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `jmr-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and Excel files are allowed.'), false);
    }
  }
});

// Validation middleware
const validateJMR = [
  body('survey_number').notEmpty().withMessage('Survey number is required'),
  body('project_id').isMongoId().withMessage('Valid project ID is required'),
  body('officer_id').isMongoId().withMessage('Valid officer ID is required'),
  body('measured_area').isFloat({ min: 0 }).withMessage('Measured area must be a positive number'),
  body('land_type').isIn(['agricultural', 'residential', 'commercial', 'industrial', 'forest', 'other']).withMessage('Invalid land type'),
  body('village').notEmpty().withMessage('Village is required'),
  body('taluka').notEmpty().withMessage('Taluka is required'),
  body('district').notEmpty().withMessage('District is required')
];

// Create JMR record with blockchain integration
router.post('/', validateJMR, upload.array('attachments', 5), async (req, res) => {
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
      project_id,
      officer_id,
      measured_area,
      land_type,
      village,
      taluka,
      district,
      category,
      notes,
      tribal_classification = 'non-tribal'
    } = req.body;

    // Check if JMR already exists for this survey number and project
    const existingJMR = await MongoJMRRecord.findOne({
      survey_number,
      project_id
    });

    if (existingJMR) {
      return res.status(409).json({
        success: false,
        message: 'JMR record already exists for this survey number and project'
      });
    }

    // Process uploaded files
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    })) : [];

    // Create JMR record
    const jmrRecord = await MongoJMRRecord.create({
      survey_number,
      project_id,
      officer_id,
      measured_area,
      land_type,
      tribal_classification: tribal_classification === 'true',
      category,
      date_of_measurement: new Date(),
      attachments,
      notes,
      village,
      taluka,
      district,
      status: 'pending'
    });

    // Create blockchain entry using enhanced service
    try {
      const blockchainEntry = await enhancedBlockchainService.createLedgerEntry({
        survey_number,
        event_type: 'JMR_Measurement_Uploaded',
        officer_id,
        project_id,
        metadata: {
          measured_area: parseFloat(measured_area),
          land_type,
          tribal_classification: tribal_classification === 'true',
          village,
          taluka,
          district,
          attachments_count: attachments.length,
          jmr_id: jmrRecord.id
        },
        remarks: `JMR measurement uploaded for survey ${survey_number}. Area: ${measured_area} acres, Type: ${land_type}, Village: ${village}, Taluka: ${taluka}, District: ${district}`,
        timestamp: new Date().toISOString()
      });

      // Store in local blockchain ledger for reference
      await MongoBlockchainLedger.create({
        ...blockchainEntry,
        project_id,
        officer_id: officer_id
      });

      console.log('✅ Blockchain entry created for JMR:', survey_number);
    } catch (blockchainError) {
      console.warn('⚠️ Failed to create blockchain entry for JMR:', survey_number, blockchainError.message);
      // Continue with JMR creation even if blockchain fails
    }

    res.status(201).json({
      success: true,
      message: 'JMR record created successfully with blockchain entry',
      data: {
        jmr_id: jmrRecord.id,
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

// Bulk upload JMR records via CSV
router.post('/bulk-upload', upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    if (!req.file.mimetype.includes('csv') && 
        !req.file.mimetype.includes('excel') && 
        !req.file.mimetype.includes('spreadsheet')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only CSV and Excel files are allowed.'
      });
    }

    // Parse CSV file
    const csv = require('csv-parser');
    const results = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const createdRecords = [];
          const errors = [];

          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            try {
              // Validate required fields
              if (!row.survey_number || !row.project_id || !row.landowner_id || !row.measured_area) {
                errors.push({
                  row: i + 2, // +2 because CSV is 1-indexed and we have header
                  error: 'Missing required fields',
                  data: row
                });
                continue;
              }

              // Check if JMR already exists
              const existingJMR = await MongoJMRRecord.findOne({
                survey_number: row.survey_number, 
                project_id: row.project_id
              });

              if (existingJMR) {
                errors.push({
                  row: i + 2,
                  error: 'JMR record already exists',
                  data: row
                });
                continue;
              }

              // Create JMR record
              const jmrRecord = await MongoJMRRecord.create({
                survey_number: row.survey_number,
                project_id: row.project_id,
                landowner_id: row.landowner_id,
                measured_area: parseFloat(row.measured_area),
                land_type: row.land_type || 'Agricultural',
                tribal_classification: row.tribal_classification === 'true',
                category: row.category,
                date_of_measurement: new Date(),
                notes: row.notes,
                village: row.village,
                taluka: row.taluka,
                district: row.district,
                officer_id: row.officer_id,
                status: 'pending'
              });

              // Create blockchain entry using enhanced service
              try {
                const blockchainEntry = await enhancedBlockchainService.createLedgerEntry({
                  survey_number: row.survey_number,
                  event_type: 'JMR_Measurement_Uploaded',
                  officer_id: row.officer_id,
                  project_id: row.project_id,
                  metadata: {
                    measured_area: parseFloat(row.measured_area),
                    land_type: row.land_type || 'Agricultural',
                    tribal_classification: row.tribal_classification === 'true',
                    village: row.village,
                    taluka: row.taluka,
                    district: row.district,
                    jmr_id: jmrRecord.id
                  },
                  remarks: `Bulk upload: JMR measurement for survey ${row.survey_number}`,
                  timestamp: new Date().toISOString()
                });

                // Store in local blockchain ledger
                await MongoBlockchainLedger.create({
                  ...blockchainEntry,
                  project_id: row.project_id,
                  officer_id: row.officer_id
                });

                createdRecords.push({
                  jmr_id: jmrRecord.id,
                  survey_number: jmrRecord.survey_number,
                  blockchain_synced: true
                });
              } catch (blockchainError) {
                console.warn('⚠️ Failed to create blockchain entry for bulk upload:', row.survey_number, blockchainError.message);
                createdRecords.push({
                  jmr_id: jmrRecord.id,
                  survey_number: jmrRecord.survey_number,
                  blockchain_synced: false
                });
              }
            } catch (error) {
              errors.push({
                row: i + 2,
                error: error.message,
                data: row
              });
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            message: `Bulk upload completed. ${createdRecords.length} records created, ${errors.length} errors.`,
            data: {
              created_records: createdRecords,
              errors: errors,
              total_processed: results.length
            }
          });
        } catch (error) {
          console.error('Bulk upload processing error:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to process bulk upload',
            error: error.message
          });
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

// Get JMR records with blockchain verification
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      project_id, 
      officer_id, 
      land_type, 
      tribal_classification,
      status,
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = {};

    if (project_id) whereClause.project_id = project_id;
    if (officer_id) whereClause.officer_id = officer_id;
    if (land_type) whereClause.land_type = land_type;
    if (tribal_classification !== undefined) whereClause.tribal_classification = tribal_classification === 'true';
    if (status) whereClause.status = status;
    if (search) {
      whereClause.$or = [
        { survey_number: { $ilike: `%${search}%` } },
        { landowner_id: { $ilike: `%${search}%` } },
        { village: { $ilike: `%${search}%` } },
        { taluka: { $ilike: `%${search}%` } },
        { district: { $ilike: `%${search}%` } }
      ];
    }

    const { count, rows: jmrRecords } = await MongoJMRRecord.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: MongoProject,
          attributes: ['name', 'description']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get blockchain verification status for each record
    const recordsWithBlockchain = await Promise.all(
      jmrRecords.map(async (record) => {
        const blockchainEntries = await MongoBlockchainLedger.findAll({
          where: { 
            survey_number: record.survey_number,
            event_type: 'JMR_Measurement_Uploaded'
          },
          order: [['timestamp', 'DESC']],
          limit: 1
        });

        return {
          ...record.toJSON(),
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
          pages: Math.ceil(count / limit)
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

// Get JMR record by ID with blockchain history
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const jmrRecord = await MongoJMRRecord.findByPk(id, {
      include: [
        {
          model: MongoProject,
          attributes: ['name', 'description']
        }
      ]
    });

    if (!jmrRecord) {
      return res.status(404).json({
        success: false,
        message: 'JMR record not found'
      });
    }

    // Get blockchain history for this survey number
    const blockchainHistory = await MongoBlockchainLedger.findAll({
      where: { survey_number: jmrRecord.survey_number },
      order: [['timestamp', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        jmr_record: jmrRecord,
        blockchain_history: blockchainHistory,
        total_blockchain_entries: blockchainHistory.length
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

// Update JMR record with blockchain logging
router.put('/:id', validateJMR, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const jmrRecord = await MongoJMRRecord.findByPk(id);
    if (!jmrRecord) {
      return res.status(404).json({
        success: false,
        message: 'JMR record not found'
      });
    }

    // Store old values for blockchain logging
    const oldValues = { ...jmrRecord.toJSON() };

    // Update JMR record
    await jmrRecord.update(updateData);

    // Create blockchain entry for the update using enhanced service
    try {
      const blockchainEntry = await enhancedBlockchainService.createLedgerEntry({
        survey_number: jmrRecord.survey_number,
        event_type: 'JMR_Measurement_Updated',
        officer_id: updateData.officer_id || jmrRecord.officer_id,
        project_id: jmrRecord.project_id,
        metadata: {
          updated_fields: Object.keys(updateData),
          old_values: oldValues,
          new_values: updateData,
          jmr_id: jmrRecord.id
        },
        remarks: `JMR record updated for survey ${jmrRecord.survey_number}`,
        timestamp: new Date().toISOString()
      });

      // Store in local blockchain ledger for reference
      await MongoBlockchainLedger.create({
        ...blockchainEntry,
        project_id: jmrRecord.project_id,
        officer_id: updateData.officer_id || jmrRecord.officer_id
      });

      console.log('✅ Blockchain entry created for JMR update:', jmrRecord.survey_number);
    } catch (blockchainError) {
      console.warn('⚠️ Failed to create blockchain entry for JMR update:', jmrRecord.survey_number, blockchainError.message);
    }

    res.json({
      success: true,
      message: 'JMR record updated successfully with blockchain entry',
      data: {
        jmr_id: jmrRecord.id,
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

// Delete JMR record (soft delete with blockchain logging)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const jmrRecord = await MongoJMRRecord.findByPk(id);
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
        event_type: 'JMR_Measurement_Deleted',
        officer_id: req.user?.id || 1, // Default to user 1 if no auth context
        project_id: jmrRecord.project_id,
        metadata: {
          deleted_jmr_id: jmrRecord.id,
          deleted_at: new Date().toISOString(),
          reason: reason || 'Record deleted by user'
        },
        remarks: `JMR record deleted for survey ${jmrRecord.survey_number}. Reason: ${reason || 'Not specified'}`,
        timestamp: new Date().toISOString()
      });

      // Store in local blockchain ledger for reference
      await MongoBlockchainLedger.create({
        ...blockchainEntry,
        project_id: jmrRecord.project_id,
        officer_id: req.user?.id || 1
      });

      console.log('✅ Blockchain entry created for JMR deletion:', jmrRecord.survey_number);
    } catch (blockchainError) {
      console.warn('⚠️ Failed to create blockchain entry for JMR deletion:', jmrRecord.survey_number, blockchainError.message);
    }

    // Soft delete the record
    await jmrRecord.update({ 
      is_active: false,
      deleted_at: new Date()
    });

    res.json({
      success: true,
      message: 'JMR record deleted successfully with blockchain entry',
      data: {
        jmr_id: jmrRecord.id,
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

// ===== BULK BLOCKCHAIN SYNC =====

/**
 * @route POST /api/jmr-blockchain/bulk-sync
 * @desc Bulk sync existing JMR records to blockchain
 * @access Private (Officers only)
 */
router.post('/bulk-sync', async (req, res) => {
  try {
    const { project_id, officer_id = 1 } = req.body;

    // Get all JMR records that don't have blockchain entries
    const jmrRecords = await MongoJMRRecord.findAll({
      where: {
        is_active: true,
        ...(project_id && { project_id })
      }
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
          where: {
            survey_number: jmrRecord.survey_number,
            event_type: 'JMR_Measurement_Uploaded'
          }
        });

        if (existingBlockchainEntry) {
          results.push({
            survey_number: jmrRecord.survey_number,
            status: 'already_synced',
            message: 'Already exists on blockchain'
          });
          continue;
        }

        // Create blockchain entry
        const blockchainEntry = await enhancedBlockchainService.createLedgerEntry({
          survey_number: jmrRecord.survey_number,
          event_type: 'JMR_Measurement_Uploaded',
          officer_id: officer_id,
          project_id: jmrRecord.project_id,
          metadata: {
            measured_area: jmrRecord.measured_area,
            land_type: jmrRecord.land_type,
            tribal_classification: jmrRecord.tribal_classification,
            village: jmrRecord.village,
            taluka: jmrRecord.taluka,
            district: jmrRecord.district,
            jmr_id: jmrRecord.id
          },
          remarks: `Bulk sync: JMR measurement for survey ${jmrRecord.survey_number}. Area: ${jmrRecord.measured_area} acres, Type: ${jmrRecord.land_type}, Village: ${jmrRecord.village}`,
          timestamp: new Date().toISOString()
        });

        // Store in local blockchain ledger
        await MongoBlockchainLedger.create({
          ...blockchainEntry,
          project_id: jmrRecord.project_id,
          officer_id: officer_id
        });

        syncedCount++;
        results.push({
          survey_number: jmrRecord.survey_number,
          status: 'synced',
          block_id: blockchainEntry.block_id,
          hash: blockchainEntry.current_hash
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

export default router;
