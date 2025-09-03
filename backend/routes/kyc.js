import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoUser from '../models/mongo/User.js';
import MongoProject from '../models/mongo/Project.js';
import { authorize } from '../middleware/auth.js';
import { getCloudinary } from '../services/cloudinaryService.js';
import LedgerV2Service from '../services/ledgerV2Service.js';

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

    const filter = { 
      kyc_status: { $in: ['completed', 'in_progress'] },
      is_active: true
    };
    
    if (projectId) filter.project_id = projectId;
    if (village) filter.village = village;
    if (taluka) filter.taluka = taluka;
    if (district) filter.district = district;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const records = await MongoLandownerRecord.find(filter)
      .populate('project_id', 'projectName')
      .populate('assigned_agent', 'name email phone')
      .populate('created_by', 'name email')
      .sort({ kyc_completed_at: -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

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
      data: records.map(record => ({
        id: record._id,
        survey_number: record.survey_number,
        landowner_name: record.landowner_name,
        area: record.area,
        acquired_area: record.acquired_area,
        village: record.village,
        taluka: record.taluka,
        district: record.district,
        kyc_status: record.kyc_status,
        kyc_completed_at: record.kyc_completed_at,
        kyc_completed_by: record.kyc_completed_by,
        assigned_agent: record.assigned_agent ? {
          id: record.assigned_agent._id,
          name: record.assigned_agent.name,
          email: record.assigned_agent.email,
          phone: record.assigned_agent.phone
        } : null,
        project: record.project_id ? {
          id: record.project_id._id,
          projectName: record.project_id.projectName
        } : null,
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

    const record = await MongoLandownerRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      });
    }

    if (!['completed', 'in_progress'].includes(record.kyc_status)) {
      return res.status(400).json({
        success: false,
        message: 'KYC record is not ready for approval'
      });
    }

    const updateData = {
      kyc_status: 'approved',
      kyc_completed_at: new Date(),
      kyc_completed_by: req.user.id
    };

    if (approvalNotes) {
      updateData.notes = (record.notes || '') + `\n[${new Date().toISOString()}] Officer Approval: ${approvalNotes}`;
    }

    // Use Mongoose updateOne instead of Sequelize-style record.update
    await MongoLandownerRecord.updateOne(
      { _id: record._id },
      { $set: updateData }
    );

    res.status(200).json({
      success: true,
      message: 'KYC record approved successfully',
      data: {
        recordId: record._id,
        landownerName: record.landowner_name,
        surveyNumber: record.survey_number,
        kycStatus: record.kyc_status,
        approvedAt: record.kyc_completed_at,
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

    const record = await MongoLandownerRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'KYC record not found'
      });
    }

    const rejectionNote = `[${new Date().toISOString()}] Officer Rejection: ${rejectionReason}`;
    // Use Mongoose updateOne instead of Sequelize-style record.update
    await MongoLandownerRecord.updateOne(
      { _id: record._id },
      { $set: {
        kyc_status: 'rejected',
        kyc_completed_at: new Date(),
        kyc_completed_by: req.user.id,
        notes: (record.notes || '') + '\n' + rejectionNote
      }}
    );

    res.status(200).json({
      success: true,
      message: 'KYC record rejected successfully',
      data: {
        recordId: record._id,
        landownerName: record.landowner_name,
        kycStatus: record.kyc_status,
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

    const record = await MongoLandownerRecord.findById(parseInt(recordId, 10));
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

         // Use Mongoose updateOne instead of Sequelize-style record.update
     await MongoLandownerRecord.updateOne(
       { _id: record._id },
       { $set: {
         documents: updatedDocuments,
         kyc_status: record.kyc_status === 'pending' ? 'in_progress' : record.kyc_status,
         updatedAt: new Date()
       }}
     );

    // 🔗 Update blockchain with the new document data
    try {
      const ledgerV2 = new LedgerV2Service();
      await ledgerV2.appendTimelineEvent(
        record.survey_number,
        req.user?.id || 'kyc-user',
        'DOCUMENT_UPLOADED',
        {
          name: newDocument.fileName,
          type: newDocument.type,
          url: newDocument.fileUrl,
          file_size: newDocument.fileSize,
          mime_type: newDocument.mimeType,
          upload_source: 'kyc'
        },
        'KYC document uploaded',
        record.project_id
      );

      await ledgerV2.createOrUpdateFromLive(
        record.survey_number,
        req.user?.id || 'kyc-user',
        record.project_id,
        'kyc_document_uploaded'
      );
      
      console.log(`✅ Blockchain updated for survey ${record.survey_number} after KYC document upload`);
    } catch (blockchainError) {
      console.error('⚠️ Failed to update blockchain after KYC document upload:', blockchainError);
      // Don't fail the entire operation if blockchain update fails
    }

    return res.status(200).json({ success: true, message: 'Document uploaded and recorded on blockchain', data: { document: newDocument } });
  } catch (error) {
    console.error('KYC multipart upload error:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
});