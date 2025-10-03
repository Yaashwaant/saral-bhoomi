import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import CompleteEnglishLandownerRecord from '../models/mongo/CompleteEnglishLandownerRecord.js';
import Project from '../models/mongo/Project.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// GET /api/complete-english-landowner-records - Get all records with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      project_id,
      search,
      village,
      taluka,
      district,
      kyc_status,
      payment_status,
      compensation_distribution_status,
      assigned_agent,
      blockchain_status,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Build filter object
    const filter = { is_active: true };
    
    if (project_id) filter.project_id = project_id;
    if (village) filter.village = new RegExp(village, 'i');
    if (taluka) filter.taluka = new RegExp(taluka, 'i');
    if (district) filter.district = new RegExp(district, 'i');
    if (kyc_status) filter.kyc_status = kyc_status;
    if (payment_status) filter.payment_status = payment_status;
    if (compensation_distribution_status) filter.compensation_distribution_status = compensation_distribution_status;
    if (assigned_agent) filter.assigned_agent = assigned_agent;
    if (blockchain_status) filter.blockchain_status = blockchain_status;

    // Add search functionality
    if (search) {
      filter.$or = [
        { owner_name: new RegExp(search, 'i') },
        { serial_number: new RegExp(search, 'i') },
        { old_survey_number: new RegExp(search, 'i') },
        { new_survey_number: new RegExp(search, 'i') },
        { cts_number: new RegExp(search, 'i') },
        { group_number: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const records = await CompleteEnglishLandownerRecord.find(filter)
      .populate('project_id', 'name project_number')
      .populate('assigned_agent', 'name email')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CompleteEnglishLandownerRecord.countDocuments(filter);

    res.json({
      success: true,
      data: records,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total,
        per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching landowner records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records',
      error: error.message
    });
  }
});

// GET /api/complete-english-landowner-records/:id - Get single record
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const record = await CompleteEnglishLandownerRecord.findById(req.params.id)
      .populate('project_id', 'name project_number')
      .populate('assigned_agent', 'name email')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .populate('kyc_verified_by', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner record',
      error: error.message
    });
  }
});

// POST /api/complete-english-landowner-records - Create new record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const recordData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const record = new CompleteEnglishLandownerRecord(recordData);
    await record.save();

    const populatedRecord = await CompleteEnglishLandownerRecord.findById(record._id)
      .populate('project_id', 'name project_number')
      .populate('created_by', 'name email');

    res.status(201).json({
      success: true,
      message: 'Landowner record created successfully',
      data: populatedRecord
    });
  } catch (error) {
    console.error('Error creating landowner record:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating landowner record',
      error: error.message
    });
  }
});

// PUT /api/complete-english-landowner-records/:id - Update record
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_by: req.user.id,
      updated_at: new Date()
    };

    const record = await CompleteEnglishLandownerRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('project_id', 'name project_number')
     .populate('assigned_agent', 'name email')
     .populate('updated_by', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    res.json({
      success: true,
      message: 'Landowner record updated successfully',
      data: record
    });
  } catch (error) {
    console.error('Error updating landowner record:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating landowner record',
      error: error.message
    });
  }
});

// DELETE /api/complete-english-landowner-records/:id - Soft delete record
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const record = await CompleteEnglishLandownerRecord.findByIdAndUpdate(
      req.params.id,
      { 
        is_active: false,
        updated_by: req.user.id,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    res.json({
      success: true,
      message: 'Landowner record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting landowner record',
      error: error.message
    });
  }
});

// POST /api/complete-english-landowner-records/bulk-create - Bulk create records
router.post('/bulk-create', authenticateToken, async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Records array is required and cannot be empty'
      });
    }

    // Add metadata to each record
    const recordsWithMetadata = records.map(record => ({
      ...record,
      created_by: req.user.id,
      updated_by: req.user.id,
      data_source: 'BULK_CREATE'
    }));

    const createdRecords = await CompleteEnglishLandownerRecord.insertMany(recordsWithMetadata);

    res.status(201).json({
      success: true,
      message: `${createdRecords.length} landowner records created successfully`,
      data: createdRecords
    });
  } catch (error) {
    console.error('Error bulk creating landowner records:', error);
    res.status(400).json({
      success: false,
      message: 'Error bulk creating landowner records',
      error: error.message
    });
  }
});

// POST /api/complete-english-landowner-records/upload-csv - Upload CSV file
router.post('/upload-csv', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const { project_id } = req.body;
    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Verify project exists
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const results = [];
    const errors = [];

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        try {
          // Map CSV columns to schema fields
          const record = {
            serial_number: data.serial_number || data['Serial Number'],
            owner_name: data.owner_name || data['Owner Name'],
            old_survey_number: data.old_survey_number || data['Old Survey Number'],
            new_survey_number: data.new_survey_number || data['New Survey Number'],
            group_number: data.group_number || data['Group Number'],
            cts_number: data.cts_number || data['CTS Number'],
            village: data.village || data['Village'],
            taluka: data.taluka || data['Taluka'],
            district: data.district || data['District'],
            land_area_as_per_7_12: parseFloat(data.land_area_as_per_7_12 || data['Land Area as per 7/12'] || 0),
            acquired_land_area: parseFloat(data.acquired_land_area || data['Acquired Land Area'] || 0),
            land_type: data.land_type || data['Land Type'],
            land_classification: data.land_classification || data['Land Classification'],
            approved_rate_per_hectare: parseFloat(data.approved_rate_per_hectare || data['Approved Rate per Hectare'] || 0),
            market_value_as_per_acquired_area: parseFloat(data.market_value_as_per_acquired_area || data['Market Value as per Acquired Area'] || 0),
            factor_as_per_section_26_2: parseFloat(data.factor_as_per_section_26_2 || data['Factor as per Section 26(2)'] || 1),
            land_compensation_as_per_section_26: parseFloat(data.land_compensation_as_per_section_26 || data['Land Compensation as per Section 26'] || 0),
            structures: parseFloat(data.structures || data['Structures'] || 0),
            forest_trees: parseFloat(data.forest_trees || data['Forest Trees'] || 0),
            fruit_trees: parseFloat(data.fruit_trees || data['Fruit Trees'] || 0),
            wells_borewells: parseFloat(data.wells_borewells || data['Wells/Borewells'] || 0),
            total_structures_amount: parseFloat(data.total_structures_amount || data['Total Structures Amount'] || 0),
            total_amount_14_23: parseFloat(data.total_amount_14_23 || data['Total Amount 14-23'] || 0),
            solatium_amount: parseFloat(data.solatium_amount || data['Solatium Amount'] || 0),
            determined_compensation_26: parseFloat(data.determined_compensation_26 || data['Determined Compensation 26'] || 0),
            enhanced_compensation_25_percent: parseFloat(data.enhanced_compensation_25_percent || data['Enhanced Compensation 25%'] || 0),
            total_compensation_26_27: parseFloat(data.total_compensation_26_27 || data['Total Compensation 26-27'] || 0),
            deduction_amount: parseFloat(data.deduction_amount || data['Deduction Amount'] || 0),
            final_payable_compensation: parseFloat(data.final_payable_compensation || data['Final Payable Compensation'] || 0),
            remarks: data.remarks || data['Remarks'] || '',
            project_id: project_id,
            created_by: req.user.id,
            updated_by: req.user.id,
            data_source: 'CSV_UPLOAD'
          };

          results.push(record);
        } catch (error) {
          errors.push({
            row: results.length + errors.length + 1,
            error: error.message,
            data: data
          });
        }
      })
      .on('end', async () => {
        try {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          if (results.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No valid records found in CSV file',
              errors: errors
            });
          }

          // Insert records into database
          const createdRecords = await CompleteEnglishLandownerRecord.insertMany(results);

          res.json({
            success: true,
            message: `Successfully imported ${createdRecords.length} records from CSV`,
            data: {
              imported_count: createdRecords.length,
              error_count: errors.length,
              errors: errors.slice(0, 10) // Return first 10 errors only
            }
          });
        } catch (dbError) {
          console.error('Database error during CSV import:', dbError);
          res.status(500).json({
            success: false,
            message: 'Error saving records to database',
            error: dbError.message
          });
        }
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        fs.unlinkSync(req.file.path);
        res.status(400).json({
          success: false,
          message: 'Error parsing CSV file',
          error: error.message
        });
      });

  } catch (error) {
    console.error('Error uploading CSV:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error uploading CSV file',
      error: error.message
    });
  }
});

// GET /api/complete-english-landowner-records/stats/overview - Get overview statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { project_id } = req.query;
    const filter = { is_active: true };
    
    if (project_id) filter.project_id = project_id;

    const [
      totalRecords,
      kycPending,
      kycApproved,
      paymentPending,
      paymentCompleted,
      blockchainSynced,
      totalCompensation
    ] = await Promise.all([
      CompleteEnglishLandownerRecord.countDocuments(filter),
      CompleteEnglishLandownerRecord.countDocuments({ ...filter, kyc_status: 'PENDING' }),
      CompleteEnglishLandownerRecord.countDocuments({ ...filter, kyc_status: 'APPROVED' }),
      CompleteEnglishLandownerRecord.countDocuments({ ...filter, payment_status: 'PENDING' }),
      CompleteEnglishLandownerRecord.countDocuments({ ...filter, payment_status: 'COMPLETED' }),
      CompleteEnglishLandownerRecord.countDocuments({ ...filter, blockchain_status: 'SYNCED' }),
      CompleteEnglishLandownerRecord.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$final_payable_compensation' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total_records: totalRecords,
        kyc_stats: {
          pending: kycPending,
          approved: kycApproved,
          approval_rate: totalRecords > 0 ? ((kycApproved / totalRecords) * 100).toFixed(2) : 0
        },
        payment_stats: {
          pending: paymentPending,
          completed: paymentCompleted,
          completion_rate: totalRecords > 0 ? ((paymentCompleted / totalRecords) * 100).toFixed(2) : 0
        },
        blockchain_stats: {
          synced: blockchainSynced,
          sync_rate: totalRecords > 0 ? ((blockchainSynced / totalRecords) * 100).toFixed(2) : 0
        },
        compensation_stats: {
          total_amount: totalCompensation[0]?.total || 0,
          average_amount: totalRecords > 0 ? ((totalCompensation[0]?.total || 0) / totalRecords).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching overview statistics',
      error: error.message
    });
  }
});

export default router;