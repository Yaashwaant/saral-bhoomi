import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import LandownerRecord from '../models/LandownerRecord.js';
import User from '../models/User.js';
import { authorize } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for KYC document upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/kyc');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const { recordId, documentType } = req.body;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${recordId}-${documentType}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG, DOC, and DOCX files are allowed'));
    }
  }
});

// @desc    Get KYC records pending approval
// @route   GET /api/kyc/pending
// @access  Public (temporarily)
router.get('/pending', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      projectId,
      village,
      taluka,
      district
    } = req.query;

    const filter = { 
      kycStatus: { $in: ['completed', 'in_progress'] },
      isActive: true
    };
    
    if (projectId) filter.projectId = projectId;
    if (village) filter.village = village;
    if (taluka) filter.taluka = taluka;
    if (district) filter.district = district;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const records = await LandownerRecord.find(filter)
      .populate('projectId', 'projectName pmisCode')
      .populate('assignedAgent', 'name email phone')
      .populate('kycCompletedBy', 'name email')
      .sort({ kycCompletedAt: -1, updatedAt: -1 })
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
    console.error('Get pending KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending KYC records'
    });
  }
});

// @desc    Approve KYC record
// @route   PUT /api/kyc/approve/:recordId
// @access  Public (temporarily)
router.put('/approve/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { approvalNotes = '', verifiedDocuments = [] } = req.body;

    const record = await LandownerRecord.findById(recordId)
      .populate('assignedAgent', 'name email')
      .populate('projectId', 'projectName pmisCode');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      });
    }

    if (!['completed', 'in_progress'].includes(record.kycStatus)) {
      return res.status(400).json({
        success: false,
        message: 'KYC record is not ready for approval'
      });
    }

    if (verifiedDocuments.length > 0) {
      record.documents.forEach(doc => {
        if (verifiedDocuments.includes(doc.type)) {
          doc.verified = true;
        }
      });
    }

    record.kycStatus = 'approved';
    record.kycCompletedAt = new Date();
    record.kycCompletedBy = req.user.id;
    if (approvalNotes) {
      record.notes = (record.notes || '') + `\n[${new Date().toISOString()}] Officer Approval: ${approvalNotes}`;
    }

    await record.save();

    res.status(200).json({
      success: true,
      message: 'KYC record approved successfully',
      data: {
        recordId: record._id,
        landownerName: record.खातेदाराचे_नांव,
        surveyNumber: record.सर्वे_नं,
        kycStatus: record.kycStatus,
        approvedAt: record.kycCompletedAt,
        approvedBy: req.user.name
      }
    });

  } catch (error) {
    console.error('Approve KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving KYC record'
    });
  }
});

// @desc    Reject KYC record  
// @route   PUT /api/kyc/reject/:recordId
// @access  Public (temporarily)
router.put('/reject/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { rejectionReason, rejectedDocuments = [] } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const record = await LandownerRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      });
    }

    record.kycStatus = 'rejected';
    record.kycCompletedAt = new Date();
    record.kycCompletedBy = req.user.id;

    const rejectionNote = `[${new Date().toISOString()}] Officer Rejection: ${rejectionReason}`;
    record.notes = (record.notes || '') + '\n' + rejectionNote;

    await record.save();

    res.status(200).json({
      success: true,
      message: 'KYC record rejected successfully',
      data: {
        recordId: record._id,
        landownerName: record.खातेदाराचे_नांव,
        kycStatus: record.kycStatus,
        rejectionReason
      }
    });

  } catch (error) {
    console.error('Reject KYC error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting KYC record'
    });
  }
});

export default router; 