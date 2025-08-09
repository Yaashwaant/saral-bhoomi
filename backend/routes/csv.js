import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';
import LandownerRecord from '../models/LandownerRecord.js';
import Project from '../models/Project.js';
import { authorize } from '../middleware/auth.js';
import User from '../models/User.js'; // Added import for User
import NoticeAssignment from '../models/NoticeAssignment.js'; // Added import for NoticeAssignment
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Normalize a CSV row by mapping English and Marathi variants into canonical keys
const normalizeRow = (row = {}) => {
  const r = { ...row };
  // Owner name
  r['खातेदाराचे_नांव'] = r['खातेदाराचे_नांव'] || r['ownerName'] || r['landownerName'] || r['name'] || '';
  // Survey number
  r['सर्वे_नं'] = r['सर्वे_नं'] || r['स.नं./हि.नं./ग.नं.'] || r['Survey'] || r['surveyNumber'] || r['survey_no'] || r['survey'] || '';
  // Area fields
  r['क्षेत्र'] = r['क्षेत्र'] || r['नमुना_7_12_नुसार_जमिनीचे_क्षेत्र'] || r['Area'] || r['area'] || '';
  r['संपादित_क्षेत्र'] = r['संपादित_क्षेत्र'] || r['संपादित_जमिनीचे_क्षेत्र'] || r['AcquiredArea'] || r['acquiredArea'] || r['acquired_area'] || '';
  // Financial fields
  r['दर'] = r['दर'] || r['मंजुर_केलेला_दर'] || r['Rate'] || r['rate'] || '';
  r['संरचना_झाडे_विहिरी_रक्कम'] = r['संरचना_झाडे_विहिरी_रक्कम'] || r['structuresAmount'] || r['structures_amount'] || '0';
  r['एकूण_मोबदला'] = r['एकूण_मोबदला'] || r['एकुण_मोबदला'] || r['TotalAmount'] || r['totalCompensation'] || r['total_compensation'] || '';
  r['सोलेशियम_100'] = r['सोलेशियम_100'] || r['Solatium'] || r['solatium'] || '';
  r['अंतिम_रक्कम'] = r['अंतिम_रक्कम'] || r['FinalAmount'] || r['finalCompensation'] || '';
  // Location fields
  r['village'] = r['village'] || r['गांव'] || r['गाव'] || '';
  r['taluka'] = r['taluka'] || r['तालुका'] || r['तहसील'] || r['Tehsil'] || '';
  r['district'] = r['district'] || r['जिल्हा'] || r['District'] || '';
  // Contact fields (Marathi ↔ English)
  r['phone'] = r['phone'] || r['मोबाईल'] || r['फोन'] || '';
  r['email'] = r['email'] || r['ईमेल'] || '';
  r['address'] = r['address'] || r['पत्ता'] || '';
  // Bank fields (Marathi ↔ English)
  r['accountNumber'] = r['accountNumber'] || r['खाते_क्रमांक'] || '';
  r['ifscCode'] = r['ifscCode'] || r['IFSC'] || r['आयएफएससी'] || '';
  r['bankName'] = r['bankName'] || r['बँक_नाव'] || '';
  r['branchName'] = r['branchName'] || r['शाखा'] || '';
  r['accountHolderName'] = r['accountHolderName'] || r['खातेदाराचे_नांव'] || r['खातेधारक_नाव'] || '';
  // Trim canonical fields if present
  [
    'खातेदाराचे_नांव','सर्वे_नं','क्षेत्र','संपादित_क्षेत्र','दर','संरचना_झाडे_विहिरी_रक्कम',
    'एकूण_मोबदला','सोलेशियम_100','अंतिम_रक्कम','village','taluka','district',
    'phone','email','address','accountNumber','ifscCode','bankName','branchName','accountHolderName'
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
    const project = await Project.findByPk(projectId);
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
          'खातेदाराचे_नांव', 'सर्वे_नं', 'क्षेत्र', 'संपादित_क्षेत्र',
          'दर', 'एकूण_मोबदला', 'सोलेशियम_100', 'अंतिम_रक्कम',
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
          project_id: parseInt(projectId, 10),
          खातेदाराचे_नांव: row.खातेदाराचे_नांव,
          सर्वे_नं: row.सर्वे_नं,
          क्षेत्र: row.क्षेत्र,
          संपादित_क्षेत्र: row.संपादित_क्षेत्र,
          दर: row.दर,
          संरचना_झाडे_विहिरी_रक्कम: row.संरचना_झाडे_विहिरी_रक्कम || '0',
          एकूण_मोबदला: row.एकूण_मोबदला,
          सोलेशियम_100: row.सोलेशियम_100,
          अंतिम_रक्कम: row.अंतिम_रक्कम,
          village: row.village,
          taluka: row.taluka,
          district: row.district,
          // Flattened contact and bank fields to match model
          contactPhone: row.phone || '',
          contactEmail: row.email || '',
          contactAddress: row.address || '',
          bankAccountNumber: row.accountNumber || '',
          bankIfscCode: row.ifscCode || '',
          bankName: row.bankName || '',
          bankBranchName: row.branchName || '',
          bankAccountHolderName: row.accountHolderName || row.खातेदाराचे_नांव,
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
          const existingRecords = await LandownerRecord.findAll({ 
            where: {
              project_id: parseInt(projectId, 10),
              सर्वे_नं: { [Op.in]: records.map(r => r.सर्वे_नं) }
            }
          });
          
          if (existingRecords.length > 0 && !overwrite) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            
            return res.status(400).json({
              success: false,
              message: 'Duplicate survey numbers found',
              duplicates: existingRecords.map(r => r.सर्वे_नं)
            });
          }
          
          // Delete existing records if overwrite is true
          if (overwrite && existingRecords.length > 0) {
            await LandownerRecord.destroy({ 
              where: {
                project_id: parseInt(projectId, 10),
                सर्वे_नं: { [Op.in]: records.map(r => r.सर्वे_नं) }
              }
            });
          }
          
          // Insert new records
          const insertedRecords = await LandownerRecord.bulkCreate(records);
          
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
    const project = await Project.findByPk(projectId);
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
          'खातेदाराचे_नांव', 'सर्वे_नं', 'क्षेत्र', 'संपादित_क्षेत्र',
          'दर', 'एकूण_मोबदला', 'सोलेशियम_100', 'अंतिम_रक्कम',
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
            project_id: parseInt(projectId, 10),
          खातेदाराचे_नांव: row.खातेदाराचे_नांव,
          सर्वे_नं: row.सर्वे_नं,
          क्षेत्र: row.क्षेत्र,
          संपादित_क्षेत्र: row.संपादित_क्षेत्र,
          दर: row.दर,
          संरचना_झाडे_विहिरी_रक्कम: row.संरचना_झाडे_विहिरी_रक्कम || '0',
          एकूण_मोबदला: row.एकूण_मोबदला,
          सोलेशियम_100: row.सोलेशियम_100,
          अंतिम_रक्कम: row.अंतिम_रक्कम,
          village: row.village,
          taluka: row.taluka,
          district: row.district,
          contactPhone: row.phone || '',
          contactEmail: row.email || '',
          contactAddress: row.address || '',
          bankAccountNumber: row.accountNumber || '',
          bankIfscCode: row.ifscCode || '',
          bankName: row.bankName || '',
          bankBranchName: row.branchName || '',
          bankAccountHolderName: row.accountHolderName || row.खातेदाराचे_नांव,
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
          const existingRecords = await LandownerRecord.findAll({ 
            where: {
              project_id: parseInt(projectId, 10),
              सर्वे_नं: { [Op.in]: records.map(r => r.सर्वे_नं) }
            }
          });
          
          if (existingRecords.length > 0) {
            if (!overwrite) {
              // Clean up uploaded file
              fs.unlinkSync(req.file.path);
              return res.status(400).json({
                success: false,
                message: 'Duplicate survey numbers found',
                duplicates: existingRecords.map(r => r.सर्वे_नं)
              });
            }
            // Overwrite requested: delete existing duplicates for this project
            await LandownerRecord.destroy({
              where: {
                project_id: parseInt(projectId, 10),
                सर्वे_नं: { [Op.in]: existingRecords.map(r => r.सर्वे_नं) }
              }
            });
          }
          
          // Insert new records
          const insertedRecords = await LandownerRecord.bulkCreate(records);
          
          // No agent assignment here
          
          // Notice creation block (no assignment)
          const noticeAssignments = [];
          if (generateNoticeBool) {
            // Update landowner records with notice info
            for (const record of insertedRecords) {
              const noticeNumber = `NOTICE-${Date.now()}-${record.सर्वे_नं}`;
              const noticeDate = new Date();
              const noticeContent = `महाराष्ट्र शासन<br/>
उपजिल्हाधिकारी (भूसंपादन) ${project.projectName}<br/>
नोटीस क्रमांक: ${noticeNumber}<br/>
दिनांक: ${noticeDate.toLocaleDateString('hi-IN')}<br/>
<br/>
प्रति, ${record.खातेदाराचे_नांव}<br/>
सर्वे क्रमांक: ${record.सर्वे_नं}<br/>
गाव: ${record.village}<br/>
<br/>
आपल्या जमिनीचे संपादन करण्यात येत आहे. कृपया आवश्यक कागदपत्रे सादर करा.`;

              await record.update({
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
              id: r.id,
              surveyNumber: r.सर्वे_नं,
              landownerName: r.खातेदाराचे_नांव,
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
    const templateData = [
      {
        खातेदाराचे_नांव: 'Sample Landowner Name',
        सर्वे_नं: '123',
        क्षेत्र: '0.5000',
        संपादित_क्षेत्र: '0.1000',
        दर: '5000000',
        संरचना_झाडे_विहिरी_रक्कम: '50000',
        एकूण_मोबदला: '2500000',
        सोलेशियम_100: '2500000',
        अंतिम_रक्कम: '5000000',
        village: 'Sample Village',
        taluka: 'Sample Taluka',
        district: 'Sample District',
        phone: '9876543210',
        email: 'landowner@example.com',
        address: 'Sample Address',
        accountNumber: '1234567890',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        branchName: 'Sample Branch',
        accountHolderName: 'Sample Landowner Name'
      }
    ];
    
    // Convert to CSV format
    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
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
    const filter = { projectId };
    if (village) filter.village = village;
    if (taluka) filter.taluka = taluka;
    if (district) filter.district = district;
    if (kycStatus) filter.kycStatus = kycStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (noticeGenerated !== undefined) filter.noticeGenerated = noticeGenerated === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const records = await LandownerRecord.findAll({
      where: filter,
      include: [
        { model: User, as: 'assignedAgentUser', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit: parseInt(limit)
    });
    
    const total = await LandownerRecord.count({ where: filter });
    
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
    const filter = { projectId };
    if (village) filter.village = village;
    if (taluka) filter.taluka = taluka;
    if (district) filter.district = district;
    if (kycStatus) filter.kycStatus = kycStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    const records = await LandownerRecord.findAll({
      where: filter,
      order: [['createdAt', 'DESC']]
    });
    
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
        'ownerName', 'surveyNumber', 'area', 'acquiredArea',
        'rate', 'structuresAmount', 'totalCompensation', 'solatium',
        'finalCompensation', 'village', 'taluka', 'district', 'kycStatus',
        'paymentStatus', 'noticeGenerated', 'assignedAgent'
      ];
      rows = records.map(r => {
        const j = r.toJSON();
        return [
          j.ownerName, j.surveyNumber, j.area, j.acquiredArea,
          j.rate, j.structuresAmount, j.totalCompensation, j.solatium,
          j.finalCompensation, j.village, j.taluka, j.district,
          j.kycStatus, j.paymentStatus, j.noticeGenerated,
          r.assignedAgent ?? ''
        ];
      });
    } else {
      headers = [
        'खातेदाराचे_नांव', 'सर्वे_नं', 'क्षेत्र', 'संपादित_क्षेत्र',
        'दर', 'संरचना_झाडे_विहिरी_रक्कम', 'एकूण_मोबदला', 'सोलेशियम_100',
        'अंतिम_रक्कम', 'village', 'taluka', 'district', 'kycStatus',
        'paymentStatus', 'noticeGenerated', 'assignedAgent'
      ];
      rows = records.map(record => [
        record.खातेदाराचे_नांव, record.सर्वे_नं, record.क्षेत्र, record.संपादित_क्षेत्र,
        record.दर, record.संरचना_झाडे_विहिरी_रक्कम, record.एकूण_मोबदला, record.सोलेशियम_100,
        record.अंतिम_रक्कम, record.village, record.taluka, record.district,
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
    const records = await LandownerRecord.findAll({
      where: { projectId }
    });

    // Calculate stats manually since we're using Sequelize
    const stats = {
      totalRecords: records.length,
      totalCompensation: records.reduce((sum, r) => sum + (parseFloat(r.अंतिम_रक्कम) || 0), 0),
      totalArea: records.reduce((sum, r) => sum + (parseFloat(r.क्षेत्र) || 0), 0),
      totalAcquiredArea: records.reduce((sum, r) => sum + (parseFloat(r.संपादित_क्षेत्र) || 0), 0),
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
      villageMap[village].totalCompensation += parseFloat(record.अंतिम_रक्कम) || 0;
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

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Optional validate agent
    let agent = null;
    if (assignToAgentBool && hasValidAgent) {
      agent = await User.findByPk(agentIdInt);
      if (!agent || agent.role !== 'agent') {
        return res.status(400).json({ success: false, message: 'Invalid agent ID or agent not found' });
      }
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
        'खातेदाराचे_नांव', 'सर्वे_नं', 'क्षेत्र', 'संपादित_क्षेत्र',
        'दर', 'एकूण_मोबदला', 'सोलेशियम_100', 'अंतिम_रक्कम',
        'village'
      ];
      requiredFields.forEach(f => { if (row[f] !== undefined && row[f] !== null) row[f] = String(row[f]).trim(); });
      const missingFields = requiredFields.filter(field => !row[field]);
      if (missingFields.length > 0) {
        errors.push({ row: rowNumber, error: `Missing required fields: ${missingFields.join(', ')}` });
        return;
      }

      const record = {
        project_id: parseInt(projectId, 10),
        खातेदाराचे_नांव: row.खातेदाराचे_नांव,
        सर्वे_नं: row.सर्वे_नं,
        क्षेत्र: row.क्षेत्र,
        संपादित_क्षेत्र: row.संपादित_क्षेत्र,
        दर: row.दर,
        संरचना_झाडे_विहिरी_रक्कम: row.संरचना_झाडे_विहिरी_रक्कम || '0',
        एकूण_मोबदला: row.एकूण_मोबदला,
        सोलेशियम_100: row.सोलेशियम_100,
        अंतिम_रक्कम: row.अंतिम_रक्कम,
        village: row.village,
        taluka: row.taluka || '',
        district: row.district || '',
        contactPhone: row.phone || '',
        contactEmail: row.email || '',
        contactAddress: row.address || '',
        bankAccountNumber: row.accountNumber || '',
        bankIfscCode: row.ifscCode || '',
        bankName: row.bankName || '',
        bankBranchName: row.branchName || '',
        bankAccountHolderName: row.accountHolderName || row.खातेदाराचे_नांव,
        createdBy: 1,
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

    // Duplicate survey check
    const existingRecords = await LandownerRecord.findAll({
      where: {
        project_id: parseInt(projectId, 10),
        सर्वे_नं: { [Op.in]: records.map(r => r.सर्वे_नं) }
      }
    });
    if (existingRecords.length > 0) {
      if (!overwrite) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate survey numbers found',
          duplicates: existingRecords.map(r => r.सर्वे_नं)
        });
      }
      await LandownerRecord.destroy({
        where: {
          project_id: parseInt(projectId, 10),
          सर्वे_नं: { [Op.in]: existingRecords.map(r => r.सर्वे_नं) }
        }
      });
    }

    const insertedRecords = await LandownerRecord.bulkCreate(records);

    if (generateNoticeBool) {
      for (const record of insertedRecords) {
        const noticeNumber = `NOTICE-${Date.now()}-${record.सर्वे_नं}`;
        const noticeDate = new Date();
        const noticeContent = `महाराष्ट्र शासन<br/>
उपजिल्हाधिकारी (भूसंपादन) ${project.projectName}<br/>
नोटीस क्रमांक: ${noticeNumber}<br/>
दिनांक: ${noticeDate.toLocaleDateString('hi-IN')}<br/>
<br/>
प्रति, ${record.खातेदाराचे_नांव}<br/>
सर्वे क्रमांक: ${record.सर्वे_नं}<br/>
गाव: ${record.village}<br/>
<br/>
आपल्या जमिनीचे संपादन करण्यात येत आहे. कृपया आवश्यक कागदपत्रे सादर करा.`;

        await record.update({
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