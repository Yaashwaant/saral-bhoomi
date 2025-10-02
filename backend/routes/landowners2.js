import express from 'express';
import mongoose from 'mongoose';
import MongoLandownerRecord2 from '../models/mongo/LandownerRecord2.js';
import MongoProject from '../models/mongo/Project.js';
import MongoUser from '../models/mongo/User.js';
import { authorize } from '../middleware/auth.js';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const router = express.Router();

// Configure multer for CSV uploads
const upload = multer({ dest: 'uploads/' });

// @desc    Get all landowner records from landrecords2 collection
// @route   GET /api/landowners2/list
// @access  Public (for now)
router.get('/list', async (req, res) => {
  try {
    const records = await MongoLandownerRecord2.find({ is_active: true })
      .populate('created_by', 'name email')
      .sort({ serial_number: 1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records: records.map(record => {
        const plain = record.toObject({ getters: true });
        const createdBy = plain.created_by;
        return {
          id: record._id,
          ...plain,
          created_by: createdBy ? {
            id: createdBy._id,
            name: createdBy.name,
            email: createdBy.email
          } : null
        };
      })
    });
  } catch (error) {
    console.error('Error fetching landowner records from landrecords2:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records'
    });
  }
});

// @desc    Get landowner records by project from landrecords2 collection
// @route   GET /api/landowners2/:projectId
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

    // Query with ObjectId project_id since data is now stored as ObjectId in database
    const records = await MongoLandownerRecord2.find({ 
      project_id: new mongoose.Types.ObjectId(projectId),
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
        return {
          id: record._id,
          ...plain,
          created_by: createdBy ? {
            id: createdBy._id,
            name: createdBy.name,
            email: createdBy.email
          } : null
        };
      })
    });
  } catch (error) {
    console.error('Error fetching landowner records by project from landrecords2:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records'
    });
  }
});

// @desc    Create new landowner record in landrecords2 collection
// @route   POST /api/landowners2
// @access  Private
router.post('/', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const {
      अ_क्र,
      खातेदाराचे_नांव,
      जुना_स_नं,
      नविन_स_नं,
      गट_नंबर,
      सी_टी_एस_नंबर,
      Village,
      Taluka,
      District,
      गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर,
      संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर,
      जमिनीचा_प्रकार,
      जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार,
      मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये,
      संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू,
      कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8,
      कलम_26_नुसार_जमिनीचा_मोबदला_9X10,
      बांधकामे,
      वनझाडे,
      फळझाडे,
      विहिरी_बोअरवेल,
      एकुण_रक्कम_रुपये_16_18_20_22,
      एकुण_रक्कम_14_23,
      सोलेशियम_दिलासा_रक्कम,
      निर्धारित_मोबदला_26,
      एकूण_रक्कमेवर_25_वाढीव_मोबदला,
      एकुण_मोबदला_26_27,
      वजावट_रक्कम_रुपये,
      हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये,
      शेरा,
      मोबदला_वाटप_तपशिल,
      father_name,
      address,
      contact_phone,
      contact_email,
      contact_address,
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
    if (!अ_क्र || !खातेदाराचे_नांव || !Village || !Taluka || !District) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: अ_क्र, खातेदाराचे_नांव, Village, Taluka, District'
      });
    }

    // Use default project ID if not provided (ROB project)
    const finalProjectId = project_id || '68da6edf579af093415f639e';

    // Check if serial number already exists for this project
    const existingRecord = await MongoLandownerRecord2.findOne({ 
      अ_क्र,
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

    // Create new landowner record with Marathi field names
    const newRecord = new MongoLandownerRecord2({
      अ_क्र,
      खातेदाराचे_नांव,
      जुना_स_नं,
      नविन_स_नं,
      गट_नंबर,
      सी_टी_एस_नंबर,
      Village,
      Taluka,
      District,
      गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर: parseFloat(गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर) || 0,
      संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर: parseFloat(संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर) || 0,
      जमिनीचा_प्रकार,
      जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार,
      मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये: parseFloat(मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये) || 0,
      संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू: parseFloat(संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू) || 0,
      कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8: parseFloat(कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8) || 1,
      कलम_26_नुसार_जमिनीचा_मोबदला_9X10: parseFloat(कलम_26_नुसार_जमिनीचा_मोबदला_9X10) || 0,
      बांधकामे: parseFloat(बांधकामे) || 0,
      वनझाडे: parseFloat(वनझाडे) || 0,
      फळझाडे: parseFloat(फळझाडे) || 0,
      विहिरी_बोअरवेल: parseFloat(विहिरी_बोअरवेल) || 0,
      एकुण_रक्कम_रुपये_16_18_20_22: parseFloat(एकुण_रक्कम_रुपये_16_18_20_22) || 0,
      एकुण_रक्कम_14_23: parseFloat(एकुण_रक्कम_14_23) || 0,
      सोलेशियम_दिलासा_रक्कम: parseFloat(सोलेशियम_दिलासा_रक्कम) || 0,
      निर्धारित_मोबदला_26: parseFloat(निर्धारित_मोबदला_26) || 0,
      एकूण_रक्कमेवर_25_वाढीव_मोबदला: parseFloat(एकूण_रक्कमेवर_25_वाढीव_मोबदला) || 0,
      एकुण_मोबदला_26_27: parseFloat(एकुण_मोबदला_26_27) || 0,
      वजावट_रक्कम_रुपये: parseFloat(वजावट_रक्कम_रुपये) || 0,
      हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये: parseFloat(हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये) || 0,
      शेरा: शेरा || '',
      मोबदला_वाटप_तपशिल: मोबदला_वाटप_तपशिल || '',
      father_name,
      address,
      contact_phone,
      contact_email,
      contact_address,
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
      Village,
      Taluka,
      District,
      project_id: finalProjectId,
      created_by: created_by || req.user.id
    });

    const savedRecord = await newRecord.save();

    res.status(201).json({
      success: true,
      message: 'Landowner record created successfully in landrecords2',
      data: {
        id: savedRecord._id,
        अ_क्र: savedRecord.अ_क्र,
        खातेदाराचे_नांव: savedRecord.खातेदाराचे_नांव,
        Village: savedRecord.Village,
        Taluka: savedRecord.Taluka,
        District: savedRecord.District,
        kyc_status: savedRecord.kyc_status,
        payment_status: savedRecord.payment_status,
        project_id: savedRecord.project_id
      }
    });
  } catch (error) {
    console.error('Error creating landowner record in landrecords2:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating landowner record'
    });
  }
});

// @desc    Upload CSV file for bulk land records to landrecords2 collection
// @route   POST /api/landowners2/upload-csv
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
              if (!record.serial_number || !record.landowner_name || !record.area || 
                  !record.village || !record.taluka || !record.district) {
                errors.push(`Row ${results.indexOf(record) + 1}: Missing required fields (serial_number, landowner_name, area, village, taluka, district)`);
                continue;
              }

              // Check if serial number already exists
              const existingRecord = await MongoLandownerRecord2.findOne({ 
                serial_number: record.serial_number,
                project_id: finalProjectId 
              });
              
              if (existingRecord) {
                errors.push(`Row ${results.indexOf(record) + 1}: Serial number ${record.serial_number} already exists`);
                continue;
              }

              // Create new landowner record
              const newRecord = new MongoLandownerRecord2({
                serial_number: record.serial_number,
                old_survey_number: record.old_survey_number,
                new_survey_number: record.new_survey_number,
                group_number: record.group_number,
                cts_number: record.cts_number,
                landowner_name: record.landowner_name,
                father_name: record.father_name,
                address: record.address,
                area: parseFloat(record.area) || 0,
                acquired_area: parseFloat(record.acquired_area) || 0,
                total_area_village_record: parseFloat(record.total_area_village_record) || 0,
                acquired_area_sqm_hectare: parseFloat(record.acquired_area_sqm_hectare) || 0,
                land_classification: record.land_classification,
                irrigation_type: record.irrigation_type,
                crop_type: record.crop_type,
                rate: parseFloat(record.rate) || 0,
                structure_trees_wells_amount: parseFloat(record.structure_trees_wells_amount) || 0,
                total_compensation: parseFloat(record.total_compensation) || 0,
                solatium: parseFloat(record.solatium) || 0,
                final_amount: parseFloat(record.final_amount) || 0,
                is_tribal: record.is_tribal === 'true' || record.is_tribal === true,
                tribal_certificate_no: record.tribal_certificate_no,
                tribal_lag: record.tribal_lag,
                contact_phone: record.contact_phone,
                contact_email: record.contact_email,
                contact_address: record.contact_address,
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
                village: record.village,
                taluka: record.taluka,
                district: record.district,
                project_id: finalProjectId,
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
            message: `CSV upload completed. ${uploaded} records uploaded successfully to landrecords2.`,
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

// @desc    Update landowner record in landrecords2 collection (partial)
// @route   PUT /api/landowners2/:id
// @access  Public (temporarily)
router.put('/:id', async (req, res) => {
  try {
    const record = await MongoLandownerRecord2.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Landowner record not found in landrecords2' });
    }

    const updatable = [
      'serial_number', 'old_survey_number', 'new_survey_number', 'group_number', 'cts_number',
      'landowner_name', 'father_name', 'address', 'area', 'acquired_area', 'total_area_village_record',
      'acquired_area_sqm_hectare', 'land_classification', 'irrigation_type', 'crop_type',
      'rate', 'structure_trees_wells_amount', 'total_compensation', 'solatium', 'final_amount',
      'kyc_status', 'payment_status', 'assigned_agent', 'assigned_at', 'contact_phone', 'contact_email',
      'contact_address', 'bank_account_number', 'bank_ifsc_code', 'bank_name', 'bank_branch_name',
      'bank_account_holder_name', 'documents', 'notes', 'is_active',
      'is_tribal', 'tribal_certificate_no', 'tribal_lag', 'village', 'taluka', 'district'
    ];
    
    const updates = {};
    updatable.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Use Mongoose updateOne instead of Sequelize-style record.update
    const updateResult = await MongoLandownerRecord2.updateOne(
      { _id: req.params.id },
      { $set: updates }
    );

    if (updateResult.modifiedCount > 0) {
      // Fetch the updated record
      const updatedRecord = await MongoLandownerRecord2.findById(req.params.id);
      res.status(200).json({ success: true, record: updatedRecord });
    } else {
      res.status(200).json({ success: true, message: 'No changes made', record });
    }
  } catch (error) {
    console.error('Update landowner error in landrecords2:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @desc    Generate notice for landowner in landrecords2 collection
// @route   POST /api/landowners2/generate-notice
// @access  Private (Officer, Admin)
router.post('/generate-notice', async (req, res) => {
  try {
    const {
      serial_number,
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

    if (!serial_number || !landowner_name || !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: serial_number, landowner_name, project_id'
      });
    }

    // Find the landowner record
    const landownerRecord = await MongoLandownerRecord2.findOne({
      serial_number,
      project_id,
      is_active: true
    });

    if (!landownerRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found in landrecords2'
      });
    }

    // Generate notice number
    const noticeNumber = `NOTICE-${serial_number.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
    const noticeDate = new Date();

    // Generate notice content (this will be enhanced by the frontend)
    const noticeContent = `Notice for ${landowner_name} - Serial ${serial_number}`;

    // Update the landowner record with notice information
    await MongoLandownerRecord2.updateOne(
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
    const updatedRecord = await MongoLandownerRecord2.findById(landownerRecord._id);

    res.status(200).json({
      success: true,
      message: 'Notice generated successfully from landrecords2',
      data: {
        notice_number: noticeNumber,
        notice_date: noticeDate,
        landowner_id: landownerRecord._id,
        serial_number,
        landowner_name
      }
    });
  } catch (error) {
    console.error('Error generating notice from landrecords2:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating notice'
    });
  }
});

export default router;