import express from 'express';
import CompleteEnglishLandownerRecord from '../models/mongo/CompleteEnglishLandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import { authMiddleware } from '../middleware/auth.js';
import { authorize } from '../middleware/auth.js';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

/**
 * @route GET /api/landownerrecords_english_complete/:projectId
 * @desc Get all landowner records for blockchain operations by project ID
 * @access Private (Officers only)
 */
router.get('/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Fetch records from the complete English collection
    const records = await CompleteEnglishLandownerRecord.find({
      project_id: projectId,
      is_active: true
    })
    .select({
      _id: 1,
      survey_number: 1,
      new_survey_number: 1,
      old_survey_number: 1,
      landowner_name: 1,
      village: 1,
      taluka: 1,
      district: 1,
      project_id: 1,
      blockchain_last_updated: 1,
      exists_on_blockchain: 1,
      blockchain_hash: 1,
      blockchain_status: 1,
      created_at: 1,
      updated_at: 1
    })
    .sort({ created_at: -1 })
    .lean();

    // Add blockchain status information
    const recordsWithBlockchainStatus = records.map(record => ({
      ...record,
      exists_on_blockchain: record.exists_on_blockchain || false,
      blockchain_status: record.blockchain_status || 'not_synced',
      blockchain_last_updated: record.blockchain_last_updated || null
    }));

    res.json({
      success: true,
      data: recordsWithBlockchainStatus,
      count: recordsWithBlockchainStatus.length
    });

  } catch (error) {
    console.error('Error fetching landowner records for blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records',
      error: error.message
    });
  }
});

/**
 * @route GET /api/landownerrecords_english_complete/search/:surveyNumber
 * @desc Search for a specific survey record in the complete collection
 * @access Private (Officers only)
 */
router.get('/search/:surveyNumber', authMiddleware, async (req, res) => {
  try {
    const { surveyNumber } = req.params;
    
    if (!surveyNumber) {
      return res.status(400).json({
        success: false,
        message: 'Survey number is required'
      });
    }

    // Search for the record using multiple survey number fields
    const record = await CompleteEnglishLandownerRecord.findOne({
      $or: [
        { survey_number: surveyNumber },
        { new_survey_number: surveyNumber },
        { old_survey_number: surveyNumber }
      ],
      is_active: true
    }).lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Survey record not found'
      });
    }

    // Add blockchain status information
    const recordWithBlockchainStatus = {
      ...record,
      exists_on_blockchain: record.exists_on_blockchain || false,
      blockchain_status: record.blockchain_status || 'not_synced',
      blockchain_last_updated: record.blockchain_last_updated || null
    };

    res.json({
      success: true,
      data: recordWithBlockchainStatus
    });

  } catch (error) {
    console.error('Error searching survey record:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching survey record',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/landownerrecords_english_complete/:recordId/blockchain-status
 * @desc Update blockchain status for a specific record
 * @access Private (Officers only)
 */
router.put('/:recordId/blockchain-status', authMiddleware, async (req, res) => {
  try {
    const { recordId } = req.params;
    const { exists_on_blockchain, blockchain_status, blockchain_hash, blockchain_last_updated } = req.body;
    
    if (!recordId) {
      return res.status(400).json({
        success: false,
        message: 'Record ID is required'
      });
    }

    const updateData = {
      updated_at: new Date()
    };

    if (exists_on_blockchain !== undefined) {
      updateData.exists_on_blockchain = exists_on_blockchain;
    }
    
    if (blockchain_status) {
      updateData.blockchain_status = blockchain_status;
    }
    
    if (blockchain_hash) {
      updateData.blockchain_hash = blockchain_hash;
    }
    
    if (blockchain_last_updated) {
      updateData.blockchain_last_updated = new Date(blockchain_last_updated);
    } else if (exists_on_blockchain) {
      updateData.blockchain_last_updated = new Date();
    }

    const updatedRecord = await CompleteEnglishLandownerRecord.findByIdAndUpdate(
      recordId,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    res.json({
      success: true,
      message: 'Blockchain status updated successfully',
      data: updatedRecord
    });

  } catch (error) {
    console.error('Error updating blockchain status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating blockchain status',
      error: error.message
    });
  }
});

// @desc    Create new landowner record in English collection
// @route   POST /api/landownerrecords-english-complete
// @access  Private
router.post('/', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const {
      serial_number,
      owner_name,
      old_survey_number,
      new_survey_number,
      group_number,
      cts_number,
      village,
      taluka,
      district,
      land_area_as_per_7_12,
      acquired_land_area,
      land_type,
      land_classification,
      approved_rate_per_hectare,
      market_value_as_per_acquired_area,
      factor_as_per_section_26_2,
      land_compensation_as_per_section_26,
      structures,
      forest_trees,
      fruit_trees,
      wells_borewells,
      total_structures_amount,
      total_amount_14_23,
      solatium_amount,
      determined_compensation_26,
      enhanced_compensation_25_percent,
      total_compensation_26_27,
      deduction_amount,
      final_payable_compensation,
      remarks,
      compensation_distribution_status,
      project_id,
      created_by
    } = req.body;

    // Validate required fields
    if (!serial_number || !owner_name || !village || !taluka || !district) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: serial_number, owner_name, village, taluka, district'
      });
    }

    // Use default project ID if not provided (ROB project)
    const finalProjectId = project_id || '68da6edf579af093415f639e';

    // Check if serial number already exists for this project
    const existingRecord = await CompleteEnglishLandownerRecord.findOne({ 
      serial_number,
      project_id: finalProjectId 
    });
    
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Serial number already exists for this project'
      });
    }

    // Validate project exists
    const project = await MongoProject.findById(finalProjectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Create new landowner record with English field names
    const newRecord = new CompleteEnglishLandownerRecord({
      serial_number,
      owner_name,
      old_survey_number,
      new_survey_number,
      group_number,
      cts_number,
      village,
      taluka,
      district,
      land_area_as_per_7_12: parseFloat(land_area_as_per_7_12) || 0,
      acquired_land_area: parseFloat(acquired_land_area) || 0,
      land_type,
      land_classification,
      approved_rate_per_hectare: parseFloat(approved_rate_per_hectare) || 0,
      market_value_as_per_acquired_area: parseFloat(market_value_as_per_acquired_area) || 0,
      factor_as_per_section_26_2: parseFloat(factor_as_per_section_26_2) || 1,
      land_compensation_as_per_section_26: parseFloat(land_compensation_as_per_section_26) || 0,
      structures: parseFloat(structures) || 0,
      forest_trees: parseFloat(forest_trees) || 0,
      fruit_trees: parseFloat(fruit_trees) || 0,
      wells_borewells: parseFloat(wells_borewells) || 0,
      total_structures_amount: parseFloat(total_structures_amount) || 0,
      total_amount_14_23: parseFloat(total_amount_14_23) || 0,
      solatium_amount: parseFloat(solatium_amount) || 0,
      determined_compensation_26: parseFloat(determined_compensation_26) || 0,
      enhanced_compensation_25_percent: parseFloat(enhanced_compensation_25_percent) || 0,
      total_compensation_26_27: parseFloat(total_compensation_26_27) || 0,
      deduction_amount: parseFloat(deduction_amount) || 0,
      final_payable_compensation: parseFloat(final_payable_compensation) || 0,
      remarks: remarks || '',
      compensation_distribution_status: compensation_distribution_status || 'PENDING',
      project_id: finalProjectId,
      created_by: created_by || req.user?.id,
      is_active: true
    });

    await newRecord.save();

    // Populate references for response
    await newRecord.populate('created_by', 'name email');
    await newRecord.populate('project_id', 'name code');

    res.status(201).json({
      success: true,
      message: 'Landowner record created successfully',
      data: newRecord
    });
  } catch (error) {
    console.error('Error creating English landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating landowner record',
      error: error.message
    });
  }
});

// @desc    Update landowner record in English collection
// @route   PUT /api/landownerrecords-english-complete/:id
// @access  Private
router.put('/:id', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.created_at;
    delete updateData.created_by;
    
    // Add updated timestamp
    updateData.updated_at = new Date();

    const updatedRecord = await CompleteEnglishLandownerRecord.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('created_by', 'name email')
      .populate('project_id', 'name code');

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Landowner record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating English landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating landowner record',
      error: error.message
    });
  }
 });
 
// @desc    Upload CSV file to create multiple landowner records
// @route   POST /api/landownerrecords-english-complete/upload-csv
// @access  Private
router.post('/upload-csv', authorize(['officer', 'admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { project_id } = req.body;
    // Use default project ID if not provided (ROB project)
    const finalProjectId = project_id || '68da6edf579af093415f639e';

    // Validate project exists
    const project = await MongoProject.findById(finalProjectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const results = [];
    const errors = [];
    let uploaded = 0;

    // Read and parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          // Process each record
          for (const record of results) {
            try {
              // Validate required fields
              if (!record.serial_number || !record.owner_name || !record.village || 
                  !record.taluka || !record.district) {
                errors.push(`Row ${results.indexOf(record) + 1}: Missing required fields (serial_number, owner_name, village, taluka, district)`);
                continue;
              }

              // Check if serial number already exists
              const existingRecord = await CompleteEnglishLandownerRecord.findOne({ 
                serial_number: record.serial_number,
                project_id: finalProjectId 
              });
              
              if (existingRecord) {
                errors.push(`Row ${results.indexOf(record) + 1}: Serial number ${record.serial_number} already exists`);
                continue;
              }

              // Create new landowner record with English field names
              const newRecord = new CompleteEnglishLandownerRecord({
                serial_number: record.serial_number,
                owner_name: record.owner_name,
                old_survey_number: record.old_survey_number,
                new_survey_number: record.new_survey_number,
                group_number: record.group_number,
                cts_number: record.cts_number,
                village: record.village,
                taluka: record.taluka,
                district: record.district,
                land_area_as_per_7_12: parseFloat(record.land_area_as_per_7_12) || 0,
                acquired_land_area: parseFloat(record.acquired_land_area) || 0,
                land_type: record.land_type,
                land_classification: record.land_classification,
                approved_rate_per_hectare: parseFloat(record.approved_rate_per_hectare) || 0,
                market_value_as_per_acquired_area: parseFloat(record.market_value_as_per_acquired_area) || 0,
                factor_as_per_section_26_2: parseFloat(record.factor_as_per_section_26_2) || 1,
                land_compensation_as_per_section_26: parseFloat(record.land_compensation_as_per_section_26) || 0,
                structures: parseFloat(record.structures) || 0,
                forest_trees: parseFloat(record.forest_trees) || 0,
                fruit_trees: parseFloat(record.fruit_trees) || 0,
                wells_borewells: parseFloat(record.wells_borewells) || 0,
                total_structures_amount: parseFloat(record.total_structures_amount) || 0,
                total_amount_14_23: parseFloat(record.total_amount_14_23) || 0,
                solatium_amount: parseFloat(record.solatium_amount) || 0,
                determined_compensation_26: parseFloat(record.determined_compensation_26) || 0,
                enhanced_compensation_25_percent: parseFloat(record.enhanced_compensation_25_percent) || 0,
                total_compensation_26_27: parseFloat(record.total_compensation_26_27) || 0,
                deduction_amount: parseFloat(record.deduction_amount) || 0,
                final_payable_compensation: parseFloat(record.final_payable_compensation) || 0,
                remarks: record.remarks || '',
                compensation_distribution_status: record.compensation_distribution_status || 'PENDING',
                project_id: finalProjectId,
                created_by: req.user.id,
                is_active: true
              });

              await newRecord.save();
              uploaded++;
            } catch (error) {
              console.error(`Error processing row ${results.indexOf(record) + 1}:`, error);
              errors.push(`Row ${results.indexOf(record) + 1}: ${error.message}`);
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.status(200).json({
            success: true,
            message: `CSV upload completed. ${uploaded} records uploaded successfully to landownerrecords_english_complete.`,
            uploaded,
            total: results.length,
            errors: errors.length > 0 ? errors : undefined
          });
        } catch (error) {
          console.error('Error processing CSV:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing CSV file'
          });
        }
      });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading CSV file'
    });
  }
});

export default router;