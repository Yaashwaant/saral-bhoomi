import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import LandownerRecord from '../models/LandownerRecord.js';
import User from '../models/User.js';
import { authorize } from '../middleware/auth.js';
import { getCloudinary } from '../services/cloudinaryService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for KYC document upload (use memory storage to allow Cloudinary upload)
const upload = multer({
  storage: multer.memoryStorage(),
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

    const where = { 
      kycStatus: ['completed', 'in_progress'],
      isActive: true
    };
    
    if (projectId) where.projectId = projectId;
    if (village) where.village = village;
    if (taluka) where.taluka = taluka;
    if (district) where.district = district;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const records = await LandownerRecord.findAll({
      where,
      include: [
        { model: Project, attributes: ['projectName', 'pmisCode'] },
        { model: User, as: 'assignedAgentUser', attributes: ['name', 'email', 'phone'] },
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ],
      order: [['kycCompletedAt', 'DESC'], ['updatedAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    const total = await LandownerRecord.count({ where });

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

    const record = await LandownerRecord.findByPk(recordId, {
      include: [
        { model: User, as: 'assignedAgentUser', attributes: ['name', 'email'] },
        { model: Project, attributes: ['projectName', 'pmisCode'] }
      ]
    });

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

    const updateData = {
      kycStatus: 'approved',
      kycCompletedAt: new Date(),
      kycCompletedBy: req.user.id
    };

    if (approvalNotes) {
      updateData.notes = (record.notes || '') + `\n[${new Date().toISOString()}] Officer Approval: ${approvalNotes}`;
    }

    await record.update(updateData);

    res.status(200).json({
      success: true,
      message: 'KYC record approved successfully',
      data: {
        recordId: record.id,
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

    const record = await LandownerRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      });
    }

    const rejectionNote = `[${new Date().toISOString()}] Officer Rejection: ${rejectionReason}`;
    await record.update({
      kycStatus: 'rejected',
      kycCompletedAt: new Date(),
      kycCompletedBy: req.user.id,
      notes: (record.notes || '') + '\n' + rejectionNote
    });

    res.status(200).json({
      success: true,
      message: 'KYC record rejected successfully',
      data: {
        recordId: record.id,
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

// New: Multipart upload endpoint to support file field directly
router.post('/upload-multipart/:recordId', upload.single('file'), async (req, res) => {
  try {
    const { recordId } = req.params;
    const { documentType = 'document', notes = '' } = req.body || {};

    const record = await LandownerRecord.findByPk(parseInt(recordId, 10));
    if (!record) {
      return res.status(404).json({ success: false, message: 'Landowner record not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const originalName = req.file.originalname || 'document';
    const safeName = `${Date.now()}-${originalName}`.replace(/[^a-zA-Z0-9._-]/g, '_');
    const mimeType = req.file.mimetype || 'application/octet-stream';

    let finalFileUrl = null;

    // Try Cloudinary
    try {
      const cloudinary = getCloudinary();
      const base64 = req.file.buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;
      const uploadRes = await cloudinary.uploader.upload(dataUri, {
        public_id: `saral_bhoomi/kyc/${record.id}/${safeName}`,
        resource_type: 'auto',
        folder: `saral_bhoomi/kyc/${record.id}`
      });
      finalFileUrl = uploadRes.secure_url || uploadRes.url;
    } catch (e) {
      console.warn('Cloudinary KYC upload failed, falling back to local:', e && (e.message || e));
    }

    // Fallback local
    if (!finalFileUrl) {
      const dirPath = path.join(process.cwd(), 'uploads', 'kyc', String(record.id));
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const absPath = path.join(dirPath, safeName);
      fs.writeFileSync(absPath, req.file.buffer);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      finalFileUrl = `${baseUrl}/uploads/kyc/${record.id}/${encodeURIComponent(safeName)}`;
    }

    const currentDocuments = Array.isArray(record.documents) ? record.documents : [];
    const newDocument = {
      id: `${Date.now()}`,
      type: documentType,
      fileName: originalName,
      fileUrl: finalFileUrl,
      fileSize: req.file.size || 0,
      mimeType: mimeType,
      notes: notes || '',
      uploadedAt: new Date(),
      uploadedBy: req.user?.id || null,
      verified: false
    };

    const updatedDocuments = [...currentDocuments, newDocument];

    await record.update({
      documents: updatedDocuments,
      kycStatus: record.kycStatus === 'pending' ? 'in_progress' : record.kycStatus,
      updatedAt: new Date()
    });

    return res.status(200).json({ success: true, message: 'Document uploaded', data: { document: newDocument } });
  } catch (error) {
    console.error('KYC multipart upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
});