import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import { authorize } from '../middleware/auth.js';
import MongoUser from '../models/mongo/User.js'; // Added import for User
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Normalize a CSV row by mapping English and Marathi variants into canonical keys
const normalizeRow = (row = {}) => {
  const r = { ...row };
  // Owner name
  r['landowner_name'] = r['खातेदाराचे_नांव'] || r['ownerName'] || r['landownerName'] || r['name'] || '';
  // Survey number
  r['survey_number'] = r['सर्वे_नं'] || r['स.नं./हि.नं./ग.नं.'] || r['Survey'] || r['surveyNumber'] || r['survey_no'] || r['survey'] || '';
  // Area fields
  r['area'] = r['क्षेत्र'] || r['नमुना_7_12_नुसार_जमिनीचे_क्षेत्र'] || r['Area'] || r['area'] || '';
  r['acquired_area'] = r['संपादित_क्षेत्र'] || r['संपादित_जमिनीचे_क्षेत्र'] || r['AcquiredArea'] || r['acquiredArea'] || r['acquired_area'] || '';
  // Financial fields
  r['rate'] = r['दर'] || r['मंजुर_केलेला_दर'] || r['Rate'] || r['rate'] || '';
  r['structure_trees_wells_amount'] = r['संरचना_झाडे_विहिरी_रक्कम'] || r['structuresAmount'] || r['structures_amount'] || '0';
  r['total_compensation'] = r['एकूण_मोबदला'] || r['एकुण_मोबदला'] || r['TotalAmount'] || r['totalCompensation'] || r['total_compensation'] || '';
  r['solatium'] = r['सोलेशियम_100'] || r['Solatium'] || r['solatium'] || '';
  r['final_amount'] = r['अंतिम_रक्कम'] || r['FinalAmount'] || r['finalCompensation'] || '';
  // Location fields
  r['village'] = r['village'] || r['गांव'] || r['गाव'] || '';
  r['taluka'] = r['taluka'] || r['तालुका'] || r['तहसील'] || r['Tehsil'] || '';
  r['district'] = r['district'] || r['जिल्हा'] || r['District'] || '';
  // Contact fields (Marathi ↔ English)
  r['contact_phone'] = r['phone'] || r['मोबाईल'] || r['फोन'] || '';
  r['contact_email'] = r['email'] || r['ईमेल'] || '';
  r['contact_address'] = r['address'] || r['पत्ता'] || '';
  // Bank fields (Marathi ↔ English)
  r['bank_account_number'] = r['accountNumber'] || r['खाते_क्रमांक'] || '';
  r['bank_ifsc_code'] = r['ifscCode'] || r['IFSC'] || r['आयएफएससी'] || '';
  r['bank_name'] = r['bankName'] || r['बँक_नाव'] || '';
  r['bank_branch_name'] = r['branchName'] || r['शाखा'] || '';
  r['bank_account_holder_name'] = r['accountHolderName'] || r['खातेदाराचे_नांव'] || r['खातेधारक_नाव'] || '';
  // Tribal fields: STRICTLY decide from Marathi column 'आदिवासी'
  const rawTribal = r['आदिवासी'];
  const truthyVals = ['होय','true','1','yes','y'];
  const falsyVals = ['नाही','false','0','no','n'];
  let isTribal = false;
  if (typeof rawTribal === 'string') {
    const v = rawTribal.trim().toLowerCase();
    isTribal = truthyVals.includes(v) ? true : (falsyVals.includes(v) ? false : false);
  } else if (typeof rawTribal === 'boolean') {
    isTribal = rawTribal;
  } else if (typeof rawTribal === 'number') {
    isTribal = rawTribal === 1;
  }
  r['is_tribal'] = isTribal;
  // Correct mapping: certificate from 'आदिवासी_प्रमाणपत्र_क्रमांक'; lag from 'आदिवासी_लाग'/'लागू'
  r['tribal_certificate_no'] = r['tribalCertificateNo'] || r['आदिवासी_прमाणपत्र_क्रमांक'] || r['आदिवासी_प्रमाणपत्र_क्रमांक'] || r['tribalCertNo'] || '';
  r['tribal_lag'] = r['tribalLag'] || r['आदिवासी_लाग'] || r['लागू'] || '';
  // Trim canonical fields if present
  [
    'landowner_name','survey_number','area','acquired_area','rate','structure_trees_wells_amount',
    'total_compensation','solatium','final_amount','village','taluka','district',
    'contact_phone','contact_email','contact_address','bank_account_number','bank_ifsc_code','bank_name','bank_branch_name','bank_account_holder_name',
    'tribal_certificate_no','tribal_lag'
  ].forEach((k) => { if (r[k] !== undefined && r[k] !== null) r[k] = String(r[k]).trim(); });
  return r;
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/csv');
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

export default router; 