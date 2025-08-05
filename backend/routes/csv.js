import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import LandownerRecord from '../models/LandownerRecord.js';
import Project from '../models/Project.js';
import { authorize } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

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
// @access  Private (Admin, Officer)
router.post('/upload/:projectId', authorize('admin', 'officer'), upload.single('csvFile'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { overwrite = false } = req.body;
    
    // Check if project exists
    const project = await Project.findById(projectId);
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
        
        // Validate required fields
        const requiredFields = [
          'खातेदाराचे_नांव', 'सर्वे_नं', 'क्षेत्र', 'संपादित_क्षेत्र',
          'दर', 'एकूण_मोबदला', 'सोलेशियम_100', 'अंतिम_रक्कम',
          'village', 'taluka', 'district'
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
          projectId: projectId,
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
          contactInfo: {
            phone: row.phone || '',
            email: row.email || '',
            address: row.address || ''
          },
          bankDetails: {
            accountNumber: row.accountNumber || '',
            ifscCode: row.ifscCode || '',
            bankName: row.bankName || '',
            branchName: row.branchName || '',
            accountHolderName: row.accountHolderName || row.खातेदाराचे_नांव
          },
          createdBy: req.user.id
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
          const existingRecords = await LandownerRecord.find({ 
            projectId: projectId,
            सर्वे_नं: { $in: records.map(r => r.सर्वे_नं) }
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
            await LandownerRecord.deleteMany({ 
              projectId: projectId,
              सर्वे_नं: { $in: records.map(r => r.सर्वे_नं) }
            });
          }
          
          // Insert new records
          const insertedRecords = await LandownerRecord.insertMany(records);
          
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

// @desc    Get CSV template
// @route   GET /api/csv/template
// @access  Private (Admin, Officer)
router.get('/template', authorize('admin', 'officer'), async (req, res) => {
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
// @access  Private (Admin, Officer)
router.get('/project/:projectId', authorize('admin', 'officer'), async (req, res) => {
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
    
    const records = await LandownerRecord.find(filter)
      .populate('assignedAgent', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await LandownerRecord.countDocuments(filter);
    
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
// @access  Private (Admin, Officer)
router.get('/export/:projectId', authorize('admin', 'officer'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { village, taluka, district, kycStatus, paymentStatus } = req.query;
    
    // Build filter object
    const filter = { projectId };
    if (village) filter.village = village;
    if (taluka) filter.taluka = taluka;
    if (district) filter.district = district;
    if (kycStatus) filter.kycStatus = kycStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    const records = await LandownerRecord.find(filter).sort({ createdAt: -1 });
    
    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No records found for export'
      });
    }
    
    // Convert to CSV format
    const headers = [
      'खातेदाराचे_नांव', 'सर्वे_नं', 'क्षेत्र', 'संपादित_क्षेत्र',
      'दर', 'संरचना_झाडे_विहिरी_रक्कम', 'एकूण_मोबदला', 'सोलेशियम_100',
      'अंतिम_रक्कम', 'village', 'taluka', 'district', 'kycStatus',
      'paymentStatus', 'noticeGenerated', 'assignedAgent'
    ];
    
    const csvData = [
      headers.join(','),
      ...records.map(record => [
        `"${record.खातेदाराचे_नांव}"`,
        `"${record.सर्वे_नं}"`,
        `"${record.क्षेत्र}"`,
        `"${record.संपादित_क्षेत्र}"`,
        `"${record.दर}"`,
        `"${record.संरचना_झाडे_विहिरी_रक्कम}"`,
        `"${record.एकूण_मोबदला}"`,
        `"${record.सोलेशियम_100}"`,
        `"${record.अंतिम_रक्कम}"`,
        `"${record.village}"`,
        `"${record.taluka}"`,
        `"${record.district}"`,
        `"${record.kycStatus}"`,
        `"${record.paymentStatus}"`,
        `"${record.noticeGenerated}"`,
        `"${record.assignedAgent ? record.assignedAgent.name : ''}"`
      ].join(','))
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
// @access  Private (Admin, Officer)
router.get('/stats/:projectId', authorize('admin', 'officer'), async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const stats = await LandownerRecord.aggregate([
      { $match: { projectId: projectId } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalCompensation: { $sum: { $toDouble: '$अंतिम_रक्कम' } },
          totalArea: { $sum: { $toDouble: '$क्षेत्र' } },
          totalAcquiredArea: { $sum: { $toDouble: '$संपादित_क्षेत्र' } },
          noticeGenerated: { $sum: { $cond: ['$noticeGenerated', 1, 0] } },
          kycCompleted: { $sum: { $cond: [{ $in: ['$kycStatus', ['completed', 'approved']] }, 1, 0] } },
          paymentSuccess: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'success'] }, 1, 0] } },
          paymentPending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } }
        }
      }
    ]);
    
    const villageStats = await LandownerRecord.aggregate([
      { $match: { projectId: projectId } },
      {
        $group: {
          _id: '$village',
          count: { $sum: 1 },
          totalCompensation: { $sum: { $toDouble: '$अंतिम_रक्कम' } },
          kycCompleted: { $sum: { $cond: [{ $in: ['$kycStatus', ['completed', 'approved']] }, 1, 0] } },
          paymentSuccess: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'success'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
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

export default router; 