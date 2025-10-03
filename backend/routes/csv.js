import express from 'express';
import fs from 'fs';
import csv from 'csv-parser';
import multer from 'multer';
import path from 'path';
import { readFileData } from '../utils/readFileData.js';

import MongoProject from '../models/mongo/Project.js';
import MongoUser from '../models/mongo/User.js';
import CompleteEnglishLandownerRecord from '../models/mongo/CompleteEnglishLandownerRecord.js';
import MongoJMRRecord from '../models/mongo/JMRRecord.js';
import MongoAward from '../models/mongo/Award.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

function normalizeRow(row) {
  row['tribal_certificate_no'] = row['नाही'] || row.tribal_certificate_no || '';
  row['tribal_lag'] = row['आदिवासी_लाग'] || row.tribal_lag || '';
  // Trim canonical fields if present - updated for CompleteEnglishLandownerRecord
  [
    'owner_name','new_survey_number','land_area_as_per_7_12','acquired_land_area','approved_rate_per_hectare','total_structures_amount',
    'total_amount_14_23','solatium_amount','final_payable_compensation','village','taluka','district',
    'contact_phone','contact_email','contact_address','bank_account_number','bank_ifsc_code','bank_name','bank_branch_name','bank_account_holder_name',
    'tribal_certificate_no','tribal_lag'
  ].forEach((k) => { if (row[k] !== undefined && row[k] !== null) row[k] = String(row[k]).trim(); });
  return row;
};

// Enhanced normalization: map Marathi headers to canonical fields used in validation
function normalizeRowEnhanced(raw) {
  const row = { ...raw };
  // Map to CompleteEnglishLandownerRecord field names
  row.owner_name = raw['खातेदाराचे नांव'] || raw.landowner_name || raw.owner_name || '';
  row.new_survey_number = raw['नविन स.नं.'] || raw.new_survey_number || raw.survey_number || '';
  row.land_area_as_per_7_12 = raw['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)'] || raw.total_area_village_record || raw.area || '';
  row.acquired_land_area = raw['संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)'] || raw.acquired_area_sqm_hectare || raw.acquired_area || '';
  row.approved_rate_per_hectare = raw['मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये'] || raw.approved_rate_per_hectare || raw.rate || '';
  row.total_amount_14_23 = raw['एकुण रक्कम (14+23)'] || raw.total_compensation_amount || raw.total_compensation || '';
  row.solatium_amount = raw['100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5'] || raw.solatium_100_percent || raw.solatium || '';
  row.final_payable_compensation = raw['हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)'] || raw.final_payable_amount || raw.final_amount || '';
  // Keep existing village/taluka/district if present; req.body defaults are applied later during record creation
  return normalizeRow(row);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve('uploads/csv');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Upload CSV endpoint
router.post('/upload', authorize, upload.single('csvFile'), async (req, res) => {
  try {
    const { projectId, village, taluka, district, overwrite } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
    }

    const records = [];
    const errors = [];

    // Read and parse CSV
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const normalizedRow = normalizeRowEnhanced(row);
          
          // Add project and location data
          normalizedRow.project_id = projectId;
          normalizedRow.village = normalizedRow.village || village;
          normalizedRow.taluka = normalizedRow.taluka || taluka;
          normalizedRow.district = normalizedRow.district || district;
          
          records.push(normalizedRow);
        } catch (error) {
          errors.push(`Row ${records.length + 1}: ${error.message}`);
        }
      })
      .on('end', async () => {
        try {
          if (errors.length > 0) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
              success: false,
              message: 'CSV file contains errors',
              errors: errors
            });
          }
          
          // Check for duplicate survey numbers
          const existingRecords = await CompleteEnglishLandownerRecord.find({ 
            project_id: projectId,
            new_survey_number: { $in: records.map(r => r.new_survey_number) }
          });
          
          if (existingRecords.length > 0 && !overwrite) {
            fs.unlinkSync(req.file.path);
            
            return res.status(400).json({
              success: false,
              message: 'Duplicate survey numbers found',
              duplicates: existingRecords.map(r => r.new_survey_number)
            });
          }
          
          // Delete existing records if overwrite is true
          if (overwrite && existingRecords.length > 0) {
            await CompleteEnglishLandownerRecord.deleteMany({ 
              project_id: projectId,
              new_survey_number: { $in: records.map(r => r.new_survey_number) }
            });
          }
          
          // Insert new records
          const insertedRecords = await CompleteEnglishLandownerRecord.insertMany(records);
          
          fs.unlinkSync(req.file.path);
          
          res.status(200).json({
            success: true,
            message: `Successfully uploaded ${insertedRecords.length} records`,
            count: insertedRecords.length,
            projectId: projectId
          });
          
        } catch (error) {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          
          console.error('CSV processing error:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing CSV file',
            error: error.message
          });
        }
      });

  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading CSV file',
      error: error.message
    });
  }
});

export default router;