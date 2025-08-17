import express from 'express';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import MongoUser from '../models/mongo/User.js';
import { authorize } from '../middleware/auth.js';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// @desc    Get landowner records by project
// @route   GET /api/landowners/:projectId
// @access  Public (for now)
router.get('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Validate project exists
    const project = await MongoProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const records = await MongoLandownerRecord.find({ 
      project_id: projectId,
      is_active: true 
    })
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records.map(record => ({
        id: record._id,
        survey_number: record.survey_number,
        landowner_name: record.landowner_name,
        area: record.area,
        acquired_area: record.acquired_area,
        rate: record.rate,
        structure_trees_wells_amount: record.structure_trees_wells_amount,
        total_compensation: record.total_compensation,
        solatium: record.solatium,
        final_amount: record.final_amount,
        village: record.village,
        taluka: record.taluka,
        district: record.district,
        contact_phone: record.contact_phone,
        contact_email: record.contact_email,
        contact_address: record.contact_address,
        is_tribal: record.is_tribal,
        tribal_certificate_no: record.tribal_certificate_no,
        tribal_lag: record.tribal_lag,
        bank_account_number: record.bank_account_number,
        bank_ifsc_code: record.bank_ifsc_code,
        bank_name: record.bank_name,
        bank_branch_name: record.bank_branch_name,
        bank_account_holder_name: record.bank_account_holder_name,
        kyc_status: record.kyc_status,
        payment_status: record.payment_status,
        notice_generated: record.notice_generated,
        notice_number: record.notice_number,
        notice_date: record.notice_date,
        notice_content: record.notice_content,
        assigned_agent: record.assigned_agent,
        assigned_at: record.assigned_at,
        documents: record.documents,
        notes: record.notes,
        blockchain_verified: record.blockchain_verified,
        created_by: record.created_by ? {
          id: record.created_by._id,
          name: record.created_by.name,
          email: record.created_by.email
        } : null,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching landowner records by project:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records'
    });
  }
});

// @desc    Create new landowner record
// @route   POST /api/landowners
// @access  Private
router.post('/', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const {
      survey_number,
      landowner_name,
      area,
      acquired_area,
      rate,
      structure_trees_wells_amount,
      total_compensation,
      solatium,
      final_amount,
      village,
      taluka,
      district,
      contact_phone,
      contact_email,
      contact_address,
      is_tribal,
      tribal_certificate_no,
      tribal_lag,
      bank_account_number,
      bank_ifsc_code,
      bank_name,
      bank_branch_name,
      bank_account_holder_name,
      assigned_agent,
      notes,
      project_id,
      created_by
    } = req.body;

    // Validate required fields
    if (!survey_number || !landowner_name || !area || !village || !taluka || !district || !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: survey_number, landowner_name, area, village, taluka, district, project_id'
      });
    }

    // Check if survey number already exists
    const existingRecord = await MongoLandownerRecord.findOne({ 
      survey_number,
      project_id 
    });
    
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Survey number already exists for this project'
      });
    }

    // Validate project exists
    const project = await MongoProject.findById(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Create new landowner record
    const newRecord = new MongoLandownerRecord({
      survey_number,
      landowner_name,
      area: parseFloat(area) || 0,
      acquired_area: parseFloat(acquired_area) || 0,
      rate: parseFloat(rate) || 0,
      structure_trees_wells_amount: parseFloat(structure_trees_wells_amount) || 0,
      total_compensation: parseFloat(total_compensation) || 0,
      solatium: parseFloat(solatium) || 0,
      final_amount: parseFloat(final_amount) || 0,
      village,
      taluka,
      district,
      contact_phone,
      contact_email,
      contact_address,
      is_tribal: Boolean(is_tribal),
      tribal_certificate_no,
      tribal_lag,
      bank_account_number,
      bank_ifsc_code,
      bank_name,
      bank_branch_name,
      bank_account_holder_name,
      kyc_status: 'pending',
      payment_status: 'pending',
      notice_generated: false,
      assigned_agent,
      notes,
      blockchain_verified: false,
      project_id,
      created_by: created_by || req.user.id
    });

    const savedRecord = await newRecord.save();

    res.status(201).json({
      success: true,
      message: 'Landowner record created successfully',
      data: {
        id: savedRecord._id,
        survey_number: savedRecord.survey_number,
        landowner_name: savedRecord.landowner_name,
        area: savedRecord.area,
        village: savedRecord.village,
        taluka: savedRecord.taluka,
        district: savedRecord.district,
        kyc_status: savedRecord.kyc_status,
        payment_status: savedRecord.payment_status
      }
    });
  } catch (error) {
    console.error('Error creating landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating landowner record'
    });
  }
});

// @desc    Upload CSV file for bulk land records
// @route   POST /api/landowners/upload-csv
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
    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // Validate project exists
    const project = await MongoProject.findById(project_id);
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
              if (!record.survey_number || !record.landowner_name || !record.area || 
                  !record.village || !record.taluka || !record.district) {
                errors.push(`Row ${results.indexOf(record) + 1}: Missing required fields`);
                continue;
              }

              // Check if survey number already exists
              const existingRecord = await MongoLandownerRecord.findOne({ 
                survey_number: record.survey_number,
                project_id 
              });
              
              if (existingRecord) {
                errors.push(`Row ${results.indexOf(record) + 1}: Survey number ${record.survey_number} already exists`);
                continue;
              }

              // Create new landowner record
              const newRecord = new MongoLandownerRecord({
                survey_number: record.survey_number,
                landowner_name: record.landowner_name,
                area: parseFloat(record.area) || 0,
                acquired_area: parseFloat(record.acquired_area) || 0,
                rate: parseFloat(record.rate) || 0,
                structure_trees_wells_amount: parseFloat(record.structure_trees_wells_amount) || 0,
                total_compensation: parseFloat(record.total_compensation) || 0,
                solatium: parseFloat(record.solatium) || 0,
                final_amount: parseFloat(record.final_amount) || 0,
                village: record.village,
                taluka: record.taluka,
                district: record.district,
                contact_phone: record.contact_phone,
                contact_email: record.contact_email,
                contact_address: record.contact_address,
                is_tribal: record.is_tribal === 'true' || record.is_tribal === true,
                tribal_certificate_no: record.tribal_certificate_no,
                tribal_lag: record.tribal_lag,
                bank_account_number: record.bank_account_number,
                bank_ifsc_code: record.bank_ifsc_code,
                bank_name: record.bank_name,
                bank_branch_name: record.bank_branch_name,
                bank_account_holder_name: record.bank_account_holder_name,
                kyc_status: 'pending',
                payment_status: 'pending',
                notice_generated: false,
                assigned_agent: record.assigned_agent,
                notes: record.notes,
                blockchain_verified: false,
                project_id,
                created_by: req.user.id
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
            message: `CSV upload completed. ${uploaded} records uploaded successfully.`,
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

// @desc    Get all landowner records
// @route   GET /api/landowners/list
// @access  Public (for now)
router.get('/list', async (req, res) => {
  try {
    const records = await MongoLandownerRecord.find({ is_active: true })
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records: records.map(record => ({
        id: record._id,
        survey_number: record.survey_number,
        landowner_name: record.landowner_name,
        area: record.area,
        acquired_area: record.acquired_area,
        rate: record.rate,
        total_compensation: record.total_compensation,
        solatium: record.solatium,
        final_amount: record.final_amount,
        village: record.village,
        taluka: record.taluka,
        district: record.district,
        contact_phone: record.contact_phone,
        contact_email: record.contact_email,
        contact_address: record.contact_address,
        is_tribal: record.is_tribal,
        tribal_certificate_no: record.tribal_certificate_no,
        tribal_lag: record.tribal_lag,
        bank_account_number: record.bank_account_number,
        bank_ifsc_code: record.bank_ifsc_code,
        bank_name: record.bank_name,
        bank_branch_name: record.bank_branch_name,
        bank_account_holder_name: record.bank_account_holder_name,
        kyc_status: record.kyc_status,
        payment_status: record.payment_status,
        notice_generated: record.notice_generated,
        notice_number: record.notice_number,
        notice_date: record.notice_date,
        notice_content: record.notice_content,
        kyc_completed_at: record.kyc_completed_at,
        kyc_completed_by: record.kyc_completed_by,
        payment_initiated_at: record.payment_initiated_at,
        payment_completed_at: record.payment_completed_at,
        bank_reference: record.bank_reference,
        assigned_agent: record.assigned_agent,
        assigned_at: record.assigned_at,
        documents: record.documents,
        notes: record.notes,
        is_active: record.is_active,
        created_by: record.created_by ? {
          id: record.created_by._id,
          name: record.created_by.name,
          email: record.created_by.email
        } : null,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching landowner records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records'
    });
  }
});

// @desc    Get landowner record by ID
// @route   GET /api/landowners/:id
// @access  Public (for now)
router.get('/:id', async (req, res) => {
  try {
    const record = await MongoLandownerRecord.findById(req.params.id)
      .populate('created_by', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    res.status(200).json({
      success: true,
      record: {
        id: record._id,
        survey_number: record.survey_number,
        landowner_name: record.landowner_name,
        area: record.area,
        acquired_area: record.acquired_area,
        rate: record.rate,
        total_compensation: record.total_compensation,
        solatium: record.solatium,
        final_amount: record.final_amount,
        village: record.village,
        taluka: record.taluka,
        district: record.district,
        contact_phone: record.contact_phone,
        contact_email: record.contact_email,
        contact_address: record.contact_address,
        is_tribal: record.is_tribal,
        tribal_certificate_no: record.tribal_certificate_no,
        tribal_lag: record.tribal_lag,
        bank_account_number: record.bank_account_number,
        bank_ifsc_code: record.bank_ifsc_code,
        bank_name: record.bank_name,
        bank_branch_name: record.bank_branch_name,
        bank_account_holder_name: record.bank_account_holder_name,
        kyc_status: record.kyc_status,
        payment_status: record.payment_status,
        notice_generated: record.notice_generated,
        notice_number: record.notice_number,
        notice_date: record.notice_date,
        notice_content: record.notice_content,
        kyc_completed_at: record.kyc_completed_at,
        kyc_completed_by: record.kyc_completed_by,
        payment_initiated_at: record.payment_initiated_at,
        payment_completed_at: record.payment_completed_at,
        bank_reference: record.bank_reference,
        assigned_agent: record.assigned_agent,
        assigned_at: record.assigned_at,
        documents: record.documents,
        notes: record.notes,
        is_active: record.is_active,
        created_by: record.created_by ? {
          id: record.created_by._id,
          name: record.created_by.name,
          email: record.created_by.email
        } : null,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner record'
    });
  }
});

// Normalize Marathi/English keys to model fields
const normalizeUpdate = (body = {}) => {
  const b = { ...body };
  // Tribal and Contact/bank fields accept Marathi aliases
  // Correct mapping: is_tribal <- 'आदिवासी'; tribal_certificate_no <- 'आदिवासी_प्रमाणपत्र_क्रमांक'; tribal_lag <- 'आदिवासी_लाग' | 'लागू'
  b.is_tribal = b.is_tribal ?? b['आदिवासी'] ?? b['tribal'];
  b.tribal_certificate_no = b.tribal_certificate_no || b['आदिवासी_प्रमाणपत्र_क्रमांक'] || b['tribalCertNo'];
  b.tribal_lag = b.tribal_lag || b['आदिवासी_लाग'] || b['लागू'] || b['tribalLag'];
  b.contact_phone = b.contact_phone || b['मोबाईल'] || b['फोन'];
  b.contact_email = b.contact_email || b['ईमेल'];
  b.contact_address = b.contact_address || b['पत्ता'];
  b.bank_account_number = b.bank_account_number || b['खाते_क्रमांक'];
  b.bank_ifsc_code = b.bank_ifsc_code || b['IFSC'] || b['आयएफएससी'];
  b.bank_name = b.bank_name || b['बँक_नाव'];
  b.bank_branch_name = b.bank_branch_name || b['शाखा'];
  b.bank_account_holder_name = b.bank_account_holder_name || b['खातेधारक_नाव'] || b['खातेदाराचे_नांव'];
  return b;
};

// @desc    Update landowner record (partial)
// @route   PUT /api/landowners/:id
// @access  Public (temporarily)
router.put('/:id', async (req, res) => {
  try {
    const record = await MongoLandownerRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Landowner record not found' });
    }

    const updatable = [
      'kyc_status', 'payment_status', 'assigned_agent', 'assigned_at', 'contact_phone', 'contact_email',
      'contact_address', 'bank_account_number', 'bank_ifsc_code', 'bank_name', 'bank_branch_name',
      'bank_account_holder_name', 'documents', 'notes', 'is_active',
      'is_tribal', 'tribal_certificate_no', 'tribal_lag'
    ];
    const body = normalizeUpdate(req.body);
    const updates = {};
    updatable.forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });

    await record.update(updates);
    res.status(200).json({ success: true, record });
  } catch (error) {
    console.error('Update landowner error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router; 