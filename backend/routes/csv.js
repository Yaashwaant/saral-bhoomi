import express from 'express';
import fs from 'fs';
import csv from 'csv-parser';
import multer from 'multer';
import path from 'path';
import { readFileData } from '../utils/readFileData.js';

import MongoProject from '../models/mongo/Project.js';
import MongoUser from '../models/mongo/User.js';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoJMRRecord from '../models/mongo/JMRRecord.js';
import MongoAward from '../models/mongo/Award.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

function normalizeRow(row) {
  row['tribal_certificate_no'] = row['नाही'] || row.tribal_certificate_no || '';
  row['tribal_lag'] = row['आदिवासी_लाग'] || row.tribal_lag || '';
  // Trim canonical fields if present
  [
    'landowner_name','survey_number','area','acquired_area','rate','structure_trees_wells_amount',
    'total_compensation','solatium','final_amount','village','taluka','district',
    'contact_phone','contact_email','contact_address','bank_account_number','bank_ifsc_code','bank_name','bank_branch_name','bank_account_holder_name',
    'tribal_certificate_no','tribal_lag'
  ].forEach((k) => { if (row[k] !== undefined && row[k] !== null) row[k] = String(row[k]).trim(); });
  return row;
};

// Enhanced normalization: map Marathi headers to canonical fields used in validation
function normalizeRowEnhanced(raw) {
  const row = { ...raw };
  row.landowner_name = raw['खातेदाराचे नांव'] || raw.landowner_name || '';
  row.survey_number = raw['नविन स.नं.'] || raw.new_survey_number || raw.survey_number || '';
  row.area = raw['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)'] || raw.total_area_village_record || raw.area || '';
  row.acquired_area = raw['संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)'] || raw.acquired_area_sqm_hectare || raw.acquired_area || '';
  row.rate = raw['मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये'] || raw.approved_rate_per_hectare || raw.rate || '';
  row.total_compensation = raw['एकुण रक्कम (14+23)'] || raw.total_compensation_amount || raw.total_compensation || '';
  row.solatium = raw['100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5'] || raw.solatium_100_percent || raw.solatium || '';
  row.final_amount = raw['हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)'] || raw.final_payable_amount || raw.final_amount || '';
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

// Enhanced storage for both CSV and Excel files
const enhancedStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
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

const enhancedUpload = multer({
  storage: enhancedStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    
    if (allowedTypes.includes(file.mimetype) || 
        allowedExtensions.some(ext => file.originalname.toLowerCase().endsWith(ext))) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// @desc    Upload CSV file for project
// @route   POST /api/csv/upload/:projectId
// @access  Public (temporarily)
router.post('/upload/:projectId', upload.single('csvFile'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { overwrite = false } = req.body;
    
    // Check if project exists
    const project = await MongoProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }
    
    const records = [];
    const errors = [];
    let rowNumber = 1;
    
    // Read and parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        rowNumber++;
        row = normalizeRow(row);

        // Validate required fields (taluka/district optional in extended sheet)
        const requiredFields = [
          'landowner_name', 'survey_number', 'area', 'acquired_area',
          'rate', 'total_compensation', 'solatium', 'final_amount',
          'village'
        ];

        const missingFields = requiredFields.filter(field => !row[field]);
        if (missingFields.length > 0) {
          errors.push({
            row: rowNumber,
            error: `Missing required fields: ${missingFields.join(', ')}`
          });
          return;
        }
        
        // Create record object
        const record = {
          project_id: projectId,
          landowner_name: row.landowner_name,
          survey_number: row.survey_number,
          area: row.area,
          acquired_area: row.acquired_area,
          rate: row.rate,
          structure_trees_wells_amount: row.structure_trees_wells_amount || '0',
          total_compensation: row.total_compensation,
          solatium: row.solatium,
          final_amount: row.final_amount,
          village: row.village,
          taluka: row.taluka || 'NA',
          district: row.district || 'NA',
          // Flattened contact and bank fields to match model
          contact_phone: row.contact_phone || '',
          contact_email: row.contact_email || '',
          contact_address: row.contact_address || '',
          bank_account_number: row.bank_account_number || '',
          bank_ifsc_code: row.bank_ifsc_code || '',
          bank_name: row.bank_name || '',
          bank_branch_name: row.bank_branch_name || '',
          bank_account_holder_name: row.bank_account_holder_name || row.landowner_name,
          // Tribal fields
          is_tribal: !!row.is_tribal,
          tribal_certificate_no: row.tribal_certificate_no || '',
          tribal_lag: row.tribal_lag || '',
          // Use demo officer user id seeded during init
          createdBy: 1
        };
        
        records.push(record);
      })
      .on('end', async () => {
        try {
          if (errors.length > 0) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            
            return res.status(400).json({
              success: false,
              message: 'CSV file contains errors',
              errors: errors
            });
          }
          
          // Check for duplicate survey numbers
          const existingRecords = await MongoLandownerRecord.find({ 
            project_id: projectId,
            survey_number: { $in: records.map(r => r.survey_number) }
          });
          
          if (existingRecords.length > 0 && !overwrite) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            
            return res.status(400).json({
              success: false,
              message: 'Duplicate survey numbers found',
              duplicates: existingRecords.map(r => r.survey_number)
            });
          }
          
          // Delete existing records if overwrite is true
          if (overwrite && existingRecords.length > 0) {
            await MongoLandownerRecord.deleteMany({ 
              project_id: projectId,
              survey_number: { $in: records.map(r => r.survey_number) }
            });
          }
          
          // Insert new records
          const insertedRecords = await MongoLandownerRecord.insertMany(records);
          
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);
          
          res.status(200).json({
            success: true,
            message: `Successfully uploaded ${insertedRecords.length} records`,
            count: insertedRecords.length,
            projectId: projectId
          });
          
        } catch (error) {
          // Clean up uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          
          console.error('CSV processing error:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing CSV file'
          });
        }
      })
      .on('error', (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        console.error('CSV parsing error:', error);
        res.status(500).json({
          success: false,
          message: 'Error parsing CSV file'
        });
      });
      
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Upload CSV and optionally assign to agent immediately
// @route   POST /api/csv/upload-with-assignment/:projectId
// @access  Public (temporarily)
router.post('/upload-with-assignment/:projectId', upload.single('csvFile'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { /*assignToAgent, agentId,*/ generateNotice = false, overwrite = false } = req.body;

    // Coerce flags and agent id safely
    // Demo policy: do NOT assign any agent during CSV upload. Notices may be generated.
    const assignToAgentBool = false;
    const generateNoticeBool = String(generateNotice) === 'true';
    const agentIdInt = NaN;
    const hasValidAgent = false;
    
    console.log('📝 CSV Upload with Assignment:', { projectId, assignToAgent: assignToAgentBool, agentId: hasValidAgent ? agentIdInt : undefined, generateNotice: generateNoticeBool });
    
    // Check if project exists
    const project = await MongoProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }
    
    // Agent assignment disabled in this route (handled via Proceed to KYC)
    
    const records = [];
    const errors = [];
    let rowNumber = 1;
    
    // Read and parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        rowNumber++;
        // Normalize extended headers to expected keys (match basic upload route)
        row = normalizeRow(row);

        // Validate required fields
        const requiredFields = [
          'landowner_name', 'survey_number', 'area', 'acquired_area',
          'rate', 'total_compensation', 'solatium', 'final_amount',
          'village', 'taluka', 'district'
        ];
        // Trim required fields
        requiredFields.forEach(f => { if (row[f] !== undefined && row[f] !== null) row[f] = String(row[f]).trim(); });

        const missingFields = requiredFields.filter(field => !row[field]);
        if (missingFields.length > 0) {
          errors.push({
            row: rowNumber,
            error: `Missing required fields: ${missingFields.join(', ')}`
          });
          return;
        }
        
        // Create record object (flatten contact/bank fields to match model)
          const record = {
            project_id: projectId,
           landowner_name: row.landowner_name,
           survey_number: row.survey_number,
           area: row.area,
           acquired_area: row.acquired_area,
           rate: row.rate,
           structure_trees_wells_amount: row.structure_trees_wells_amount || '0',
           total_compensation: row.total_compensation,
           solatium: row.solatium,
           final_amount: row.final_amount,
          village: row.village,
          taluka: row.taluka,
          district: row.district,
          contact_phone: row.contact_phone || '',
          contact_email: row.contact_email || '',
          contact_address: row.contact_address || '',
          bank_account_number: row.bank_account_number || '',
          bank_ifsc_code: row.bank_ifsc_code || '',
          bank_name: row.bank_name || '',
          bank_branch_name: row.bank_branch_name || '',
          bank_account_holder_name: row.bank_account_holder_name || row.landowner_name,
            createdBy: 1,
          // No agent assignment here; KYC assignment happens via Proceed to KYC
        };
        
        records.push(record);
      })
      .on('end', async () => {
        try {
          if (errors.length > 0) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            
            return res.status(400).json({
              success: false,
              message: 'CSV file contains errors',
              errors: errors
            });
          }
          
          // Check for duplicate survey numbers
          const existingRecords = await MongoLandownerRecord.find({ 
            project_id: projectId,
            survey_number: { $in: records.map(r => r.survey_number) }
          });
          
          if (existingRecords.length > 0) {
            if (!overwrite) {
              // Clean up uploaded file
              fs.unlinkSync(req.file.path);
              return res.status(400).json({
                success: false,
                message: 'Duplicate survey numbers found',
                duplicates: existingRecords.map(r => r.survey_number)
              });
            }
            // Overwrite requested: delete existing duplicates for this project
            await MongoLandownerRecord.deleteMany({
              project_id: projectId,
              survey_number: { $in: existingRecords.map(r => r.survey_number) }
            });
          }
          
          // Insert new records
          const insertedRecords = await MongoLandownerRecord.insertMany(records);
          
          // No agent assignment here
          
          // Notice creation block (no assignment)
          const noticeAssignments = [];
          if (generateNoticeBool) {
            // Update landowner records with notice info
            for (const record of insertedRecords) {
              const noticeNumber = `NOTICE-${Date.now()}-${record.survey_number}`;
              const noticeDate = new Date();
              const noticeContent = `महाराष्ट्र शासन<br/>
उपजिल्हाधिकारी (भूसंपादन) ${project.projectName}<br/>
नोटीस क्रमांक: ${noticeNumber}<br/>
दिनांक: ${noticeDate.toLocaleDateString('hi-IN')}<br/>
<br/>
प्रति, ${record.landowner_name}<br/>
सर्वे क्रमांक: ${record.survey_number}<br/>
गाव: ${record.village}<br/>
<br/>
आपल्या जमिनीचे संपादन करण्यात येत आहे. कृपया आवश्यक कागदपत्रे सादर करा.`;

              await MongoLandownerRecord.findByIdAndUpdate(record._id, {
                noticeGenerated: true,
                noticeNumber,
                noticeDate,
                noticeContent
              });
            }
          }

          // No NoticeAssignment creation with agent during upload
          
          // Clean up uploaded file
          fs.unlinkSync(req.file.path);
          
          const response = {
            success: true,
            message: `Successfully uploaded ${insertedRecords.length} records`,
            count: insertedRecords.length,
            projectId: projectId,
            records: insertedRecords.map(r => ({
              id: r._id,
              surveyNumber: r.survey_number,
              landownerName: r.landowner_name,
              village: r.village,
              assignedAgent: r.assignedAgent || null,
              kycStatus: r.kycStatus
            }))
          };
          
          // No assignment details in response
          
          res.status(200).json(response);
          
        } catch (error) {
          // Clean up uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          
          console.error('CSV processing error:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing CSV file'
          });
        }
      })
      .on('error', (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        console.error('CSV parsing error:', error);
        res.status(500).json({
          success: false,
          message: 'Error parsing CSV file'
        });
      });
      
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get CSV template
// @route   GET /api/csv/template
// @access  Public (temporarily)
router.get('/template', async (req, res) => {
  try {
    // New template with Marathi headers and tribal columns
    const headers = [
      'landowner_name','survey_number','area','acquired_area','rate','structure_trees_wells_amount','total_compensation','solatium','final_amount',
      'village','taluka','district','contact_phone','contact_email','contact_address','bank_account_number','bank_ifsc_code','bank_name','bank_branch_name','bank_account_holder_name','tribal_certificate_no','tribal_lag'
    ];
    const example = [
      'कमळी कमळाकर मंडळ','40','0.1850','0.0504','53100000','0','4010513','4010513','8021026','उंबरपाडा नंदाडे','पालघर','पालघर','9876543210','landowner@example.com','उंबरपाडा नंदाडे, पालघर','1234567890','SBIN0001234','State Bank of India','Palghar','कमळी कमळाकर मंडळ','नाही','',''
    ];
    const csvContent = headers.join(',') + '\n' + example.map(v => `"${v}"`).join(',');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="parishisht-k-template.csv"');
    res.send(csvContent);
    
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get landowner records by project
// @route   GET /api/csv/project/:projectId
// @access  Public (temporarily)
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      village, 
      taluka, 
      district,
      kycStatus,
      paymentStatus,
      noticeGenerated
    } = req.query;
    
    // Build filter object
    const filter = { project_id: projectId };
    if (village) filter.village = village;
    if (taluka) filter.taluka = taluka;
    if (district) filter.district = district;
    if (kycStatus) filter.kycStatus = kycStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (noticeGenerated !== undefined) filter.noticeGenerated = noticeGenerated === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await MongoLandownerRecord.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    const total = await MongoLandownerRecord.countDocuments(filter);
    
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
    console.error('Get landowner records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Export landowner records as CSV
// @route   GET /api/csv/export/:projectId
// @access  Public (temporarily)
router.get('/export/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { village, taluka, district, kycStatus, paymentStatus, lang } = req.query;
    
    // Build filter object
    const filter = { project_id: projectId };
    if (village) filter.village = village;
    if (taluka) filter.taluka = taluka;
    if (district) filter.district = district;
    if (kycStatus) filter.kycStatus = kycStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    const records = await MongoLandownerRecord.find(filter)
      .sort({ createdAt: -1 });
    
    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No records found for export'
      });
    }
    
    // Convert to CSV format (supports English export via ?lang=en)
    const useEnglish = String(lang).toLowerCase() === 'en' || String(lang).toLowerCase() === 'english';
    let headers;
    let rows;
    if (useEnglish) {
      headers = [
        'landownerName', 'surveyNumber', 'area', 'acquiredArea',
        'rate', 'structuresAmount', 'totalCompensation', 'solatium',
        'finalCompensation', 'village', 'taluka', 'district', 'kycStatus',
        'paymentStatus', 'noticeGenerated', 'assignedAgent'
      ];
      rows = records.map(r => {
        const j = r.toJSON();
        return [
          j.landownerName, j.surveyNumber, j.area, j.acquiredArea,
          j.rate, j.structuresAmount, j.totalCompensation, j.solatium,
          j.finalCompensation, j.village, j.taluka, j.district,
          j.kycStatus, j.paymentStatus, j.noticeGenerated,
          r.assignedAgent ?? ''
        ];
      });
    } else {
      headers = [
        'landowner_name', 'survey_number', 'area', 'acquired_area',
        'rate', 'structure_trees_wells_amount', 'total_compensation', 'solatium',
        'final_amount', 'village', 'taluka', 'district', 'kycStatus',
        'paymentStatus', 'noticeGenerated', 'assignedAgent'
      ];
      rows = records.map(record => [
        record.landowner_name, record.survey_number, record.area, record.acquired_area,
        record.rate, record.structure_trees_wells_amount, record.total_compensation, record.solatium,
        record.final_amount, record.village, record.taluka, record.district,
        record.kycStatus, record.paymentStatus, record.noticeGenerated,
        record.assignedAgent ? record.assignedAgent.name : ''
      ]);
    }

    const csvData = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v ?? ''}"`).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="landowner-records-${projectId}.csv"`);
    res.send(csvData);
    
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get CSV upload statistics
// @route   GET /api/csv/stats/:projectId
// @access  Public (temporarily)
router.get('/stats/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get all records for the project
    const records = await MongoLandownerRecord.find({ project_id: projectId });

    // Calculate stats manually since we're using Sequelize
    const stats = {
      totalRecords: records.length,
      totalCompensation: records.reduce((sum, r) => sum + (parseFloat(r.final_amount) || 0), 0),
      totalArea: records.reduce((sum, r) => sum + (parseFloat(r.area) || 0), 0),
      totalAcquiredArea: records.reduce((sum, r) => sum + (parseFloat(r.acquired_area) || 0), 0),
      noticeGenerated: records.filter(r => r.noticeGenerated).length,
      kycCompleted: records.filter(r => ['completed', 'approved'].includes(r.kycStatus)).length,
      paymentSuccess: records.filter(r => r.paymentStatus === 'success').length,
      paymentPending: records.filter(r => r.paymentStatus === 'pending').length
    };
    
    // Group by village
    const villageMap = {};
    records.forEach(record => {
      const village = record.village;
      if (!villageMap[village]) {
        villageMap[village] = {
          _id: village,
          count: 0,
          totalCompensation: 0,
          kycCompleted: 0,
          paymentSuccess: 0
        };
      }
      
      villageMap[village].count++;
      villageMap[village].totalCompensation += parseFloat(record.final_amount) || 0;
      if (['completed', 'approved'].includes(record.kycStatus)) {
        villageMap[village].kycCompleted++;
      }
      if (record.paymentStatus === 'success') {
        villageMap[village].paymentSuccess++;
      }
    });
    
    const villageStats = Object.values(villageMap).sort((a, b) => b.count - a.count);
    
    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalRecords: 0,
          totalCompensation: 0,
          totalArea: 0,
          totalAcquiredArea: 0,
          noticeGenerated: 0,
          kycCompleted: 0,
          paymentSuccess: 0,
          paymentPending: 0
        },
        byVillage: villageStats
      }
    });
    
  } catch (error) {
    console.error('Get CSV stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Ingest CSV data without file upload (accepts csvContent string or rows array)
// @route   POST /api/csv/ingest/:projectId
// @access  Public (temporarily)
router.post('/ingest/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    // Support raw text or nested JSON body (handle frontend quirks)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { csvContent, rows, assignToAgent = false, agentId, generateNotice = false, overwrite = false } = body;

    const assignToAgentBool = String(assignToAgent) === 'true' || assignToAgent === true;
    const generateNoticeBool = String(generateNotice) === 'true' || generateNotice === true;
    const agentIdInt = parseInt(agentId, 10);
    const hasValidAgent = Number.isInteger(agentIdInt) && agentIdInt > 0;

    const project = await MongoProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Optional validate agent
    let agent = null;
    if (assignToAgentBool && hasValidAgent) {
      agent = await MongoUser.findById(agentIdInt);
      if (!agent || agent.role !== 'agent') {
        return res.status(400).json({ success: false, message: 'Invalid agent ID or agent not found' });
      }
    }

    // Resolve a valid creator user id to satisfy FK constraints
    let createdById = null;
    try {
      if (req.user?.id) {
        const u = await MongoUser.findById(req.user.id);
        if (u) createdById = u.id;
      }
      if (!createdById) {
        const anyOfficer = await MongoUser.findOne({ role: 'officer', isActive: true }, null, { sort: { id: 1 } });
        if (anyOfficer) createdById = anyOfficer.id;
      }
      if (!createdById) {
        // As a last resort, create a demo officer
        const demo = await MongoUser.create({ name: 'CSV Importer', email: `csv_importer_${Date.now()}@saral.gov.in`, password: 'password123', role: 'officer', department: 'Land Acquisition', phone: '0000000000', isActive: true });
        createdById = demo.id;
      }
    } catch (e) {
      // If even this fails, fallback to 1 (may still fail but we tried)
      createdById = 1;
    }

    const records = [];
    const errors = [];
    let rowNumber = 1;

    const handleRow = (row) => {
      rowNumber++;
      // Normalize headers (Marathi/English variants)
      row = normalizeRow(row);

      // Keep taluka/district optional to match basic upload route
      const requiredFields = [
        'landowner_name', 'survey_number', 'area', 'acquired_area',
        'rate', 'total_compensation', 'solatium', 'final_amount',
        'village'
      ];
      requiredFields.forEach(f => { if (row[f] !== undefined && row[f] !== null) row[f] = String(row[f]).trim(); });
      const missingFields = requiredFields.filter(field => !row[field]);
      if (missingFields.length > 0) {
        errors.push({ row: rowNumber, error: `Missing required fields: ${missingFields.join(', ')}` });
        return;
      }

      const record = {
        project_id: projectId,
        landowner_name: row.landowner_name,
        survey_number: row.survey_number,
        area: row.area,
        acquired_area: row.acquired_area,
        rate: row.rate,
        structure_trees_wells_amount: row.structure_trees_wells_amount || '0',
        total_compensation: row.total_compensation,
        solatium: row.solatium,
        final_amount: row.final_amount,
        village: row.village,
        // Keep optional in CSV but model requires non-empty; use NA fallback
        taluka: row.taluka || 'NA',
        district: row.district || 'NA',
        contact_phone: row.contact_phone || '',
        contact_email: row.contact_email || '',
        contact_address: row.contact_address || '',
        bank_account_number: row.bank_account_number || '',
        bank_ifsc_code: row.bank_ifsc_code || '',
        bank_name: row.bank_name || '',
        bank_branch_name: row.bank_branch_name || '',
        bank_account_holder_name: row.bank_account_holder_name || row.landowner_name,
        is_tribal: !!row.is_tribal,
        tribal_certificate_no: row.tribal_certificate_no || '',
        tribal_lag: row.tribal_lag || '',
        createdBy: createdById,
        ...(assignToAgentBool && hasValidAgent && {
          assignedAgent: agentIdInt,
          assignedAt: new Date(),
          kycStatus: 'in_progress'
        })
      };
      records.push(record);
    };

    if (Array.isArray(rows) && rows.length > 0) {
      // If rows came from frontend parsed CSV, ensure keys are trimmed and quoted values cleaned
      rows.forEach((raw) => {
        const cleaned = {};
        Object.keys(raw || {}).forEach((k) => {
          const key = String(k).trim().replace(/"/g, '');
          let val = raw[k];
          if (typeof val === 'string') {
            val = val.trim().replace(/"/g, '');
          }
          cleaned[key] = val;
        });
        handleRow(cleaned);
      });
    } else if (typeof csvContent === 'string' && csvContent.trim().length > 0) {
      const cleanedCsv = csvContent.replace(/\uFEFF/g, '').replace(/\r/g, '');
      await new Promise((resolve, reject) => {
        Readable.from(cleanedCsv)
          .pipe(csv())
          .on('data', (row) => handleRow(row))
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      return res.status(400).json({ success: false, message: 'No rows or csvContent provided' });
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'CSV data contains errors', errors });
    }

    // Duplicate check should allow multiple owners per same survey number.
    // Consider duplicate only if same (surveyNumber + ownerName) pair already exists.
    const uniquePairs = new Set(records.map(r => `${r.survey_number}__${r.landowner_name}`));
    const surveys = Array.from(new Set(records.map(r => r.survey_number)));
    const existingForSurveys = await MongoLandownerRecord.find({
      project_id: projectId,
      survey_number: { $in: surveys }
    });
    const existingPairs = new Set(existingForSurveys.map(r => `${r.survey_number}__${r.landowner_name}`));
    const duplicatePairs = Array.from(uniquePairs).filter(p => existingPairs.has(p));
    if (duplicatePairs.length > 0) {
      if (!overwrite) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate owner+survey pairs found',
          duplicates: duplicatePairs
        });
      }
      // Overwrite requested: delete existing matching pairs
      for (const pair of duplicatePairs) {
        const [survey, owner] = pair.split('__');
        await MongoLandownerRecord.deleteOne({
          project_id: projectId,
          survey_number: survey,
          landowner_name: owner
        });
      }
    }

    let insertedRecords;
    try {
      insertedRecords = await MongoLandownerRecord.insertMany(records);
    } catch (e) {
      console.error('Bulk create failed:', e?.message || e);
      return res.status(500).json({ success: false, message: 'Failed to insert records', details: e?.message || String(e) });
    }

    if (generateNoticeBool) {
      for (const record of insertedRecords) {
        const noticeNumber = `NOTICE-${Date.now()}-${record.survey_number}`;
        const noticeDate = new Date();
        const noticeContent = `महाराष्ट्र शासन<br/>
उपजिल्हाधिकारी (भूसंपादन) ${project.projectName}<br/>
नोटीस क्रमांक: ${noticeNumber}<br/>
दिनांक: ${noticeDate.toLocaleDateString('hi-IN')}<br/>
<br/>
प्रति, ${record.landowner_name}<br/>
सर्वे क्रमांक: ${record.survey_number}<br/>
गाव: ${record.village}<br/>
<br/>
आपल्या जमिनीचे संपादन करण्यात येत आहे. कृपया आवश्यक कागदपत्रे सादर करा.`;

        await MongoLandownerRecord.findByIdAndUpdate(record._id, {
          noticeGenerated: true,
          noticeNumber,
          noticeDate,
          noticeContent
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully ingested ${insertedRecords.length} records`,
      count: insertedRecords.length,
      projectId
    });

  } catch (error) {
    console.error('CSV ingest error:', error);
    return res.status(500).json({ success: false, message: 'Server error while ingesting CSV' });
  }
});

// @desc    Upload JMR CSV
// @route   POST /api/csv/upload-jmr
// @access  Private
router.post('/upload-jmr', authorize(['officer', 'admin']), upload.single('file'), async (req, res) => {
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
              if (!record.survey_number || !record.measured_area) {
                errors.push(`Row ${results.indexOf(record) + 1}: Missing required fields (survey_number, measured_area)`);
                continue;
              }

              // Check if JMR already exists for this survey number and project
              const existingJMR = await MongoJMRRecord.findOne({ 
                survey_number: record.survey_number,
                project_id 
              });
              
              if (existingJMR) {
                errors.push(`Row ${results.indexOf(record) + 1}: JMR already exists for survey number ${record.survey_number}`);
                continue;
              }

              // Create new JMR record
              const newJMR = new MongoJMRRecord({
                project_id,
                officer_id: req.user.id,
                survey_number: record.survey_number,
                measured_area: parseFloat(record.measured_area) || 0,
                category: record.category || 'agricultural',
                measurement_date: record.measurement_date ? new Date(record.measurement_date) : new Date(),
                notes: record.notes || '',
                status: 'completed'
              });

              await newJMR.save();
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
            message: `JMR CSV upload completed. ${uploaded} records uploaded successfully.`,
            uploaded,
            total: results.length,
            errors: errors.length > 0 ? errors : undefined
          });
        } catch (error) {
          console.error('Error processing JMR CSV:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing JMR CSV file'
          });
        }
      });
  } catch (error) {
    console.error('Error uploading JMR CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading JMR CSV file'
    });
  }
});

// @desc    Upload Awards CSV
// @route   POST /api/csv/upload-awards
// @access  Private
router.post('/upload-awards', authorize(['officer', 'admin']), upload.single('file'), async (req, res) => {
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
              if (!record.survey_number || !record.base_amount) {
                errors.push(`Row ${results.indexOf(record) + 1}: Missing required fields (survey_number, base_amount)`);
                continue;
              }

              // Check if Award already exists for this survey number and project
              const existingAward = await MongoAward.findOne({ 
                survey_number: record.survey_number,
                project_id 
              });
              
              if (existingAward) {
                errors.push(`Row ${results.indexOf(record) + 1}: Award already exists for survey number ${record.survey_number}`);
                continue;
              }

              // Create new Award record
              const newAward = new MongoAward({
                project_id,
                officer_id: req.user.id,
                survey_number: record.survey_number,
                award_number: record.award_number || `AWD-${Date.now()}-${record.survey_number}`,
                award_date: record.award_date ? new Date(record.award_date) : new Date(),
                base_amount: parseFloat(record.base_amount) || 0,
                solatium: parseFloat(record.solatium) || 0,
                additional_amounts: parseFloat(record.additional_amounts) || 0,
                total_amount: parseFloat(record.total_amount) || 0,
                notes: record.notes || '',
                award_status: 'pending'
              });

              await newAward.save();
              uploaded++;
            } catch (error) {
              console.error(`Error processing row ${results.indexOf(record) + 1}:`, error);
              errors.push(`Row ${results.indexOf(record) + 1}: ${error.message}`);
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.status(200).json({
            success: false,
            message: `Awards CSV upload completed. ${uploaded} records uploaded successfully.`,
            uploaded,
            total: results.length,
            errors: errors.length > 0 ? errors : undefined
          });
        } catch (error) {
          console.error('Error processing Awards CSV:', error);
          res.status(500).json({
            success: false,
            message: 'Error processing Awards CSV file'
          });
        }
      });
  } catch (error) {
    console.error('Error uploading Awards CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading Awards CSV file'
    });
    }
});

// @desc    Enhanced upload for both CSV and Excel files with new Marathi format support
// @route   POST /api/csv/upload-enhanced/:projectId
// @access  Public (temporarily)
router.post('/upload-enhanced/:projectId', enhancedUpload.single('file'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { overwrite = false } = req.body;
    
    // Check if project exists
    const project = await MongoProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV or Excel file'
      });
    }
    
    const records = [];
    const errors = [];
    let rowNumber = 1;
    
    try {
      // Determine file type
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const isExcel = ['.xlsx', '.xls'].includes(fileExtension);
      
      console.log(`Processing ${isExcel ? 'Excel' : 'CSV'} file: ${req.file.originalname}`);
      
      // Read file data
      const fileData = await readFileData(req.file.path, isExcel ? 'xlsx' : 'csv');
      
      console.log(`File contains ${fileData.length} rows`);
      
      // Process each row
      for (const rawRow of fileData) {
        rowNumber++;
        
        // Use enhanced normalization for new format
        const row = normalizeRowEnhanced(rawRow);
        
        console.log(`Processing row ${rowNumber}:`, {
          landowner_name: row.landowner_name,
          survey_number: row.survey_number,
          area: row.area,
          acquired_area: row.acquired_area
        });
        
        // Validate required fields
        const requiredFields = [
          'landowner_name', 'survey_number', 'area', 'acquired_area',
          'rate', 'total_compensation', 'solatium', 'final_amount',
          'village'
        ];
        
        const missingFields = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');
        if (missingFields.length > 0) {
          errors.push({
            row: rowNumber,
            error: `Missing required fields: ${missingFields.join(', ')}`
          });
          continue;
        }
        
        // Check for duplicate survey number within village if not overwriting
        if (!overwrite) {
          const existingRecord = await MongoLandownerRecord.findOne({ 
            survey_number: row.survey_number.toString().trim(),
            project_id: projectId,
            village: row.village || req.body.village
          });
          
          if (existingRecord) {
            errors.push({
              row: rowNumber,
              error: `Survey number ${row.survey_number} already exists in village ${row.village}`
            });
            continue;
          }
        }
        
        // Create record object with ALL new format fields populated
        const record = {
          project_id: projectId,
          
          // BASIC IDENTIFICATION FIELDS
          serial_number: row['अ.क्र'] || row.serial_number || '',
          survey_number: row['नविन स.नं.'] || row.new_survey_number || row.survey_number || '',
          landowner_name: row['खातेदाराचे नांव'] || row.landowner_name || '',
          
          // NEW FORMAT IDENTIFICATION FIELDS
          old_survey_number: row['जुना स.नं.'] || row.old_survey_number || '',
          new_survey_number: row['नविन स.नं.'] || row.new_survey_number || '',
          group_number: row['गट नंबर'] || row.group_number || '',
          cts_number: row['सी.टी.एस. नंबर'] || row.cts_number || '',
          
          // AREA FIELDS
          area: parseFloat(row['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)'] || row.total_area_village_record || row.area || 0),
          acquired_area: parseFloat(row['संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)'] || row.acquired_area_sqm_hectare || row.acquired_area || 0),
          total_area_village_record: parseFloat(row['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)'] || row.total_area_village_record || 0),
          acquired_area_sqm_hectare: parseFloat(row['संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)'] || row.acquired_area_sqm_hectare || 0),
          
          // LAND CLASSIFICATION FIELDS
          land_category: row['जमिनीचा प्रकार'] || row.land_category || '',
          land_type_classification: row['जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार'] || row.land_type_classification || '',
          agricultural_type: row['शेती'] || row.agricultural_type || '',
          agricultural_classification: row['शेती/वर्ग -1'] || row.agricultural_classification || '',
          
          // RATE AND MARKET VALUE FIELDS
          rate: parseFloat(row['मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये'] || row.approved_rate_per_hectare || row.rate || 0),
          approved_rate_per_hectare: parseFloat(row['मंजुर केबेला दर (प्रति हेक्टर) रक्कम रुपये'] || row.approved_rate_per_hectare || 0),
          market_value_acquired_area: parseFloat(row['संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू'] || row.market_value_acquired_area || 0),
          
          // SECTION 26 CALCULATION FIELDS
          section_26_2_factor: parseFloat(row['कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)'] || row.section_26_2_factor || 0),
          section_26_compensation: parseFloat(row['कलम 26 नुसार जमिनीचा मोबदला (9X10)'] || row.section_26_compensation || 0),
          
          // STRUCTURE COMPENSATION FIELDS
          structure_trees_wells_amount: parseFloat(row.structure_trees_wells_amount || 0),
          buildings_count: parseInt(row['बांधकामे संख्या'] || row.buildings_count || 0),
          buildings_amount: parseFloat(row['बांधकामे रक्कम रुपये'] || row.buildings_amount || 0),
          forest_trees_count: parseInt(row['वनझाडे झाडांची संख्या'] || row.forest_trees_count || 0),
          forest_trees_amount: parseFloat(row['वनझाडे झाडांची रक्कम रु.'] || row.forest_trees_amount || 0),
          fruit_trees_count: parseInt(row['फळझाडे झाडांची संख्या'] || row.fruit_trees_count || 0),
          fruit_trees_amount: parseFloat(row['फळझाडे झाडांची रक्कम रु.'] || row.fruit_trees_amount || 0),
          wells_borewells_count: parseInt(row['विहिरी/बोअरवेल संख्या'] || row.wells_borewells_count || 0),
          wells_borewells_amount: parseFloat(row['विहिरी/बोअरवेल रक्कम रुपये'] || row.wells_borewells_amount || 0),
          total_structures_amount: parseFloat(row['एकुण रक्कम रुपये (16+18+ 20+22)'] || row.total_structures_amount || 0),
          
          // COMPENSATION CALCULATION FIELDS
          total_compensation: parseFloat(row['एकुण रक्कम (14+23)'] || row.total_compensation_amount || row.total_compensation || 0),
          total_compensation_amount: parseFloat(row['एकुण रक्कम (14+23)'] || row.total_compensation_amount || 0),
          solatium: parseFloat(row['100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5'] || row.solatium_100_percent || row.solatium || 0),
          solatium_100_percent: parseFloat(row['100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5'] || row.solatium_100_percent || 0),
          determined_compensation: parseFloat(row['निर्धारित मोबदला 26 = (24+25)'] || row.determined_compensation || 0),
          additional_25_percent_compensation: parseFloat(row['एकूण रक्कमेवर  25%  वाढीव मोबदला'] || row.additional_25_percent_compensation || 0),
          total_final_compensation: parseFloat(row['एकुण मोबदला (26+ 27)'] || row.total_final_compensation || 0),
          deduction_amount: parseFloat(row['वजावट रक्कम रुपये'] || row.deduction_amount || 0),
          final_amount: parseFloat(row['हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)'] || row.final_payable_amount || row.final_amount || 0),
          final_payable_amount: parseFloat(row['हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)'] || row.final_payable_amount || 0),
          
          // LOCATION FIELDS
          village: row.village || req.body.village || 'NA',
          taluka: row.taluka || req.body.taluka || 'NA',
          district: row.district || req.body.district || 'NA',
          
          // CONTACT FIELDS
          contact_phone: row.contact_phone || '',
          contact_email: row.contact_email || '',
          contact_address: row.contact_address || '',
          
          // TRIBAL FIELDS
          is_tribal: !!row.is_tribal,
          tribal_certificate_no: row.tribal_certificate_no || '',
          tribal_lag: row.tribal_lag || '',
          
          // BANKING FIELDS
          bank_account_number: row.bank_account_number || '',
          bank_ifsc_code: row.bank_ifsc_code || '',
          bank_name: row.bank_name || '',
          bank_branch_name: row.bank_branch_name || '',
          bank_account_holder_name: row.bank_account_holder_name || row.landowner_name || '',
          
          // STATUS FIELDS
          kyc_status: 'pending',
          payment_status: row.payment_status || 'pending',
          notice_generated: false,
          assigned_agent: row.assigned_agent || '',
          
          // ADDITIONAL FIELDS
          notes: row.notes || '',
          remarks: row['शेरा'] || row.remarks || '',
          
          // METADATA FIELDS
          data_format: isExcel ? 'parishisht_k' : 'legacy',
          source_file_name: req.file.originalname,
          import_batch_id: Date.now().toString()
        };
        
        records.push(record);
      }
      
      // Save records to database
      let saved = 0;
      for (const record of records) {
        try {
          if (overwrite) {
            // Update existing record or create new one
            await MongoLandownerRecord.findOneAndUpdate(
              { survey_number: record.survey_number, project_id: projectId, village: record.village },
              record,
              { upsert: true, new: true }
            );
          } else {
            // Create new record
            const newRecord = new MongoLandownerRecord(record);
            await newRecord.save();
          }
          saved++;
        } catch (error) {
          console.error(`Error saving record for survey ${record.survey_number}:`, error);
          errors.push({
            survey_number: record.survey_number,
            error: error.message
          });
        }
      }
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(200).json({
        success: true,
        message: `File upload completed. ${saved} records processed successfully.`,
        data: {
          total_rows: fileData.length,
          processed: records.length,
          saved: saved,
          errors: errors.length,
          error_details: errors.length > 0 ? errors : undefined,
          file_type: isExcel ? 'Excel' : 'CSV',
          new_format_detected: isExcel
        }
      });
      
    } catch (fileError) {
      console.error('Error processing file:', fileError);
      
      // Clean up uploaded file
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: 'Error processing file: ' + fileError.message
      });
    }
    
  } catch (error) {
    console.error('Error in enhanced upload:', error);
    // Clean up uploaded file
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: 'Error in enhanced upload: ' + error.message
    });
  }
});

export default router;