import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import JMRRecord from '../models/mongo/JMRRecord.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads/csv/'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// GET /api/jmr - Get all JMR records with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      district, 
      taluka, 
      village, 
      project_id, 
      status,
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    if (district) filter.district = district;
    if (taluka) filter.taluka = taluka;
    if (village) filter.village = village;
    if (project_id) filter.project_id = project_id;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { survey_number: { $regex: search, $options: 'i' } },
        { owner_name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await JMRRecord
      .find(filter)
      .populate('project_id', 'projectName projectNumber')
      .populate('officer_id', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JMRRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: records
    });

  } catch (error) {
    console.error('Error fetching JMR records:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch JMR records',
      error: error.message 
    });
  }
});

// GET /api/jmr/:id - Get single JMR record
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JMR record ID' 
      });
    }

    const jmrRecord = await JMRRecord
      .findById(id)
      .populate('project_id', 'projectName projectNumber')
      .populate('officer_id', 'name email');
    
    if (!jmrRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'JMR record not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: jmrRecord
    });
  } catch (error) {
    console.error('Error fetching JMR record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch JMR record',
      error: error.message 
    });
  }
});

// POST /api/jmr - Create new JMR record
router.post('/', async (req, res) => {
  try {
    const {
      survey_number,
      sub_division_number,
      survey_sub_number,
      owner_id,
      owner_name,
      father_name,
      project_id,
      officer_id,
      measurement_date,
      measured_area,
      plot_area,
      land_type,
      land_classification,
      tribal_classification,
      village,
      revenue_village,
      taluka,
      district,
      category,
      irrigation_type,
      crop_type,
      reference_number,
      file_number,
      khata_number,
      khasra_number,
      mutation_number,
      land_record_number,
      boundary_north,
      boundary_south,
      boundary_east,
      boundary_west,
      acquisition_date,
      possession_date,
      verification_date,
      surveyor_name,
      witness_1,
      witness_2,
      structure_details,
      tree_details,
      well_details,
      total_structure_value,
      total_tree_value,
      total_well_value,
      compensation_amount,
      structure_compensation,
      tree_compensation,
      well_compensation,
      total_compensation,
      approval_authority,
      gazette_notification,
      remarks,
      status = 'draft'
    } = req.body;

    // Validate required fields
    if (!survey_number) {
      return res.status(400).json({ 
        success: false, 
        message: 'Survey number is required' 
      });
    }

    const newJMRRecord = new JMRRecord({
      survey_number,
      sub_division_number,
      survey_sub_number,
      owner_id,
      owner_name,
      father_name,
      project_id,
      officer_id,
      measurement_date,
      measured_area,
      plot_area,
      land_type,
      land_classification,
      tribal_classification,
      village,
      revenue_village,
      taluka,
      district,
      category,
      irrigation_type,
      crop_type,
      reference_number,
      file_number,
      khata_number,
      khasra_number,
      mutation_number,
      land_record_number,
      boundary_north,
      boundary_south,
      boundary_east,
      boundary_west,
      acquisition_date,
      possession_date,
      verification_date,
      surveyor_name,
      witness_1,
      witness_2,
      structure_details,
      tree_details,
      well_details,
      total_structure_value,
      total_tree_value,
      total_well_value,
      compensation_amount,
      structure_compensation,
      tree_compensation,
      well_compensation,
      total_compensation,
      approval_authority,
      gazette_notification,
      remarks,
      status
    });

    const savedRecord = await newJMRRecord.save();
    
    // Populate the saved record
    const populatedRecord = await JMRRecord
      .findById(savedRecord._id)
      .populate('project_id', 'projectName projectNumber')
      .populate('officer_id', 'name email');

    res.status(201).json({
      success: true,
      message: 'JMR record created successfully',
      data: populatedRecord
    });
  } catch (error) {
    console.error('Error creating JMR record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create JMR record',
      error: error.message 
    });
  }
});

// PUT /api/jmr/:id - Update JMR record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JMR record ID' 
      });
    }

    const updateData = { ...req.body };
    
    // Remove _id from update data if present
    delete updateData._id;

    const updatedRecord = await JMRRecord
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('project_id', 'projectName projectNumber')
      .populate('officer_id', 'name email');

    if (!updatedRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'JMR record not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'JMR record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    console.error('Error updating JMR record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update JMR record',
      error: error.message 
    });
  }
});

// DELETE /api/jmr/:id - Delete JMR record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid JMR record ID' 
      });
    }

    const deletedRecord = await JMRRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'JMR record not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'JMR record deleted successfully',
      data: deletedRecord
    });
  } catch (error) {
    console.error('Error deleting JMR record:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete JMR record',
      error: error.message 
    });
  }
});

// POST /api/jmr/upload-csv - Upload JMR records via CSV
router.post('/upload-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const csvFilePath = req.file.path;
    const jmrRecords = [];

    // Parse CSV file
    let isFirstRow = true;
    let defaults = {};
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          if (isFirstRow) {
            if (!row.surveyNo && !row.ownerName && row.project && row.district && row.taluka && row.village) {
              defaults = {
                project: row.project || row['Project'] || '',
                district: row.district || row['District'] || '',
                taluka: row.taluka || row['Taluka'] || '',
                village: row.village || row['Village'] || ''
              };
              isFirstRow = false;
              return;
            }
            isFirstRow = false;
          }
          // Map CSV columns to JMR record fields
          const record = {
            serialNo: row.serialNo || row['Serial No'] || '',
            surveyNo: row.surveyNo || row['Survey No'] || '',
            subDivisionNo: row.subDivisionNo || row['Sub Division'] || '',
            ownerName: row.ownerName || row['Owner Name'] || '',
            area: row.area || row['Area'] || '',
            classification: row.classification || row['Classification'] || '',
            remarks: row.remarks || row['Remarks'] || '',
            project: row.project || row['Project'] || defaults.project || '',
            district: row.district || row['District'] || defaults.district || '',
            taluka: row.taluka || row['Taluka'] || defaults.taluka || '',
            village: row.village || row['Village'] || defaults.village || '',
            measurementDate: row.measurementDate || row['Measurement Date'] || new Date().toISOString().split('T')[0],
            officerName: row.officerName || row['Officer Name'] || '',
            compensationRate: parseFloat(row.compensationRate || row['Compensation Rate'] || 0),
            totalCompensation: parseFloat(row.totalCompensation || row['Total Compensation'] || 0),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Only add records with required fields, using defaults if available
          if (record.serialNo && record.surveyNo && record.ownerName && record.project) {
            jmrRecords.push(record);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Insert records into MongoDB
    let insertedCount = 0;
    if (jmrRecords.length > 0) {
      const result = await db.collection('jmr_records').insertMany(jmrRecords);
      insertedCount = result.insertedCount;
    }

    // Clean up uploaded file
    fs.unlinkSync(csvFilePath);

    res.json({
      message: 'CSV uploaded successfully to MongoDB',
      count: insertedCount,
      totalRows: jmrRecords.length
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload CSV to MongoDB' });
  }
});

// GET /api/jmr/stats/summary - Get JMR statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalRecords = await db.collection('jmr_records').countDocuments();
    
    const projectStats = await db.collection('jmr_records').aggregate([
      { $group: { _id: '$project', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    const districtStats = await db.collection('jmr_records').aggregate([
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    const classificationStats = await db.collection('jmr_records').aggregate([
      { $group: { _id: '$classification', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    res.json({
      totalRecords,
      projectStats,
      districtStats,
      classificationStats
    });
  } catch (error) {
    console.error('Error fetching JMR statistics:', error);
    res.status(500).json({ error: 'Failed to fetch JMR statistics from MongoDB' });
  }
});

export default router;