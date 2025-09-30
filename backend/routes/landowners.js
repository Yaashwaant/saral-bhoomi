import express from 'express';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import MongoUser from '../models/mongo/User.js';
import { authorize } from '../middleware/auth.js';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import LedgerV2Service from '../services/ledgerV2Service.js';

const ledgerV2 = new LedgerV2Service();

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// @desc    Get all landowner records
// @route   GET /api/landowners/list
// @access  Public (for now)
router.get('/list', async (req, res) => {
  try {
    const records = await MongoLandownerRecord.find({ is_active: true })
      .populate('created_by', 'name email')
      .sort({ serial_number: 1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records: records.map(record => {
        const plain = record.toObject({ getters: true });
        const createdBy = plain.created_by;
        
        // Map payment_status from database to paymentStatus expected by frontend
        let paymentStatus = 'pending'; // default
        if (plain.payment_status === 'completed') {
          paymentStatus = 'success';
        } else if (plain.payment_status === 'pending') {
          paymentStatus = 'pending';
        } else if (plain.payment_status === 'rejected') {
          paymentStatus = 'rejected';
        }
        
        return {
          id: record._id,
          ...plain,
          paymentStatus, // Add mapped paymentStatus field
          created_by: createdBy ? {
            id: createdBy._id,
            name: createdBy.name,
            email: createdBy.email
          } : null
        };
      })
    });
  } catch (error) {
    console.error('Error fetching landowner records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records'
    });
  }
});

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
      .sort({ serial_number: 1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records.map(record => {
        const plain = record.toObject({ getters: true });
        const createdBy = plain.created_by;
        
        // Map payment_status from database to paymentStatus expected by frontend
        let paymentStatus = 'pending'; // default
        if (plain.payment_status === 'completed') {
          paymentStatus = 'success';
        } else if (plain.payment_status === 'pending') {
          paymentStatus = 'pending';
        } else if (plain.payment_status === 'rejected') {
          paymentStatus = 'rejected';
        }
        
        return {
          id: record._id,
          ...plain,
          paymentStatus, // Add mapped paymentStatus field
          created_by: createdBy ? {
            id: createdBy._id,
            name: createdBy.name,
            email: createdBy.email
          } : null
        };
      })
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

    // Append timeline and roll-forward ledger v2 for record creation
    try {
      const officerId = String((created_by ?? req.user?.id) || 'system');
      await ledgerV2.appendTimelineEvent(
        String(survey_number),
        officerId,
        'LANDOWNER_RECORD_CREATED',
        {
          landowner_name,
          area: parseFloat(area) || 0,
          village,
          taluka,
          district
        },
        'Official portal record creation',
        String(project_id)
      );

      await ledgerV2.createOrUpdateFromLive(
        String(survey_number),
        officerId,
        String(project_id),
        'landowner_record_created'
      );
    } catch (e) {
      console.warn('⚠️ Could not update timeline/ledger after record creation:', e.message);
    }

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

              // Check if survey number already exists within the same village
              const existingRecord = await MongoLandownerRecord.findOne({ 
                survey_number: record.survey_number,
                project_id,
                village: record.village
              });
              
              if (existingRecord) {
                errors.push(`Row ${results.indexOf(record) + 1}: Survey number ${record.survey_number} already exists in village ${record.village}`);
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

          // Extract survey numbers for blockchain creation
          const surveyNumbers = results
            .filter((_, index) => !errors.some(error => error.includes(`Row ${index + 1}`)))
            .map(record => record.survey_number);

          res.status(200).json({
            success: true,
            message: `CSV upload completed. ${uploaded} records uploaded successfully.`,
            uploaded,
            total: results.length,
            survey_numbers: surveyNumbers, // 🔗 Added for blockchain creation
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

// Normalize Marathi/English keys to model fields
const normalizeUpdate = (body = {}) => {
  const b = { ...body };
  // Tribal and Contact/bank fields accept Marathi aliases
  // Correct mapping: is_tribal <- 'आदिवासी'; tribal_certificate_no <- 'आदिवासी_प्रमाणपत्र_क्रमांक' | 'tribal_certificate_number'; tribal_lag <- 'आदिवासी_लाग' | 'लागू'
  b.is_tribal = b.is_tribal ?? b['आदिवासी'] ?? b['tribal'] ?? b['isTribal'];
  b.tribal_certificate_no = b.tribal_certificate_no || b['tribal_certificate_number'] || b['आदिवासी_प्रमाणपत्र_क्रमांक'] || b['tribalCertNo'];
  b.tribal_lag = b.tribal_lag || b['आदिवासी_लाग'] || b['लागू'] || b['tribalLag'];
  b.contact_phone = b.contact_phone || b['मोबाईल'] || b['फोन'];
  b.contact_email = b.contact_email || b['ईमेल'];
  b.contact_address = b.contact_address || b['पत्ता'];
  b.bank_account_number = b.bank_account_number || b['खाते_क्रमांक'];
  b.bank_ifsc_code = b.bank_ifsc_code || b['IFSC'] || b['आयएफएससी'];
  b.bank_name = b.bank_name || b['बँक_नाव'];
  b.bank_branch_name = b.bank_branch_name || b['शाखा'];
  b.bank_account_holder_name = b.bank_account_holder_name || b['खातेधारक_नाव'] || b['खातेदाराचे_नांव'];
  b.remarks = b.remarks || b['शेरा'];
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

    // Make all fields updatable: build updates dynamically from request body after normalization
    const body = normalizeUpdate(req.body);
    const updates = {};
    Object.keys(body).forEach(k => {
      if (body[k] !== undefined) {
        updates[k] = body[k];
      }
    });
    // Prevent accidental overwrite of Mongo _id
    delete updates._id;

    // Use Mongoose updateOne instead of Sequelize-style record.update
    const updateResult = await MongoLandownerRecord.updateOne(
      { _id: req.params.id },
      { $set: updates }
    );

    if (updateResult.modifiedCount > 0) {
      // Fetch the updated record
      const updatedRecord = await MongoLandownerRecord.findById(req.params.id);

      // Append timeline and roll-forward ledger v2 for official edits
      try {
        const surveyNumber = String(updatedRecord.new_survey_number || updatedRecord.survey_number || '');
        const officerId = String((req.user && req.user.id) || 'system');
        const projectId = String(updatedRecord.project_id || '');

        // Record an official update event with the normalized fields changed
        await ledgerV2.appendTimelineEvent(
          surveyNumber,
          officerId,
          'LANDOWNER_RECORD_UPDATED',
          updates,
          'Official portal update',
          projectId || null
        );

        // Rebuild or update the v2 ledger block from LIVE DB to keep integrity valid
        await ledgerV2.createOrUpdateFromLive(
          surveyNumber,
          officerId,
          projectId || null,
          'landowner_record_update'
        );
      } catch (e) {
        console.warn('⚠️ Ledger v2 update after official edit failed:', e.message);
      }

      res.status(200).json({ success: true, record: updatedRecord });
    } else {
      res.status(200).json({ success: true, message: 'No changes made', record });
    }
  } catch (error) {
    console.error('Update landowner error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Generate notice for landowner
// @route   POST /api/landowners/generate-notice
// @access  Private (Officer, Admin)
router.post('/generate-notice', async (req, res) => {
  try {
    const {
      survey_number,
      landowner_name,
      area,
      village,
      taluka,
      district,
      total_compensation,
      is_tribal,
      tribal_certificate_no,
      tribal_lag,
      project_id
    } = req.body;

    if (!survey_number || !landowner_name || !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: survey_number, landowner_name, project_id'
      });
    }

    // Find the landowner record
    const landownerRecord = await MongoLandownerRecord.findOne({
      survey_number,
      project_id,
      is_active: true
    });

    if (!landownerRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    // Generate notice number
    const noticeNumber = `NOTICE-${survey_number.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
    const noticeDate = new Date();

    // Generate notice content (this will be enhanced by the frontend)
    const noticeContent = `Notice for ${landowner_name} - Survey ${survey_number}`;

    // Update the landowner record with notice information
    await MongoLandownerRecord.updateOne(
      { _id: landownerRecord._id },
      {
        $set: {
          notice_generated: true,
          notice_number: noticeNumber,
          notice_date: noticeDate,
          notice_content: noticeContent,
          updatedAt: new Date()
        }
      }
    );

    // Fetch the updated record
    const updatedRecord = await MongoLandownerRecord.findById(landownerRecord._id);

    // Append timeline and roll-forward ledger v2 for notice generation
    try {
      const officerId = String(req.user?.id || 'system');
      await ledgerV2.appendTimelineEvent(
        String(survey_number),
        officerId,
        'NOTICE_GENERATED',
        { notice_number: noticeNumber, notice_date: noticeDate },
        'Official notice generated',
        String(project_id)
      );

      await ledgerV2.createOrUpdateFromLive(
        String(survey_number),
        officerId,
        String(project_id),
        'notice_generated'
      );
    } catch (e) {
      console.warn('⚠️ Could not update timeline/ledger after notice generation:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Notice generated successfully',
      data: {
        notice_number: noticeNumber,
        notice_date: noticeDate,
        landowner_id: landownerRecord._id,
        survey_number,
        landowner_name
      }
    });
  } catch (error) {
    console.error('Error generating notice:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating notice'
    });
  }
});

export default router;