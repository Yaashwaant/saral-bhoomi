import express from 'express';
import LandownerRecord from '../models/LandownerRecord.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import admin from 'firebase-admin';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { getCloudinary } from '../services/cloudinaryService.js';

const router = express.Router();

// Cloudinary is configured centrally via service. Nothing needed here.

// @desc    Get all agents
// @route   GET /api/agents/list
// @access  Public
router.get('/list', async (req, res) => {
  try {
    const agents = await User.findAll({
      where: { role: 'agent', isActive: true },
      attributes: ['id', 'name', 'email', 'phone', 'department'],
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: agents.length,
      agents: agents
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents'
    });
  }
});

// @desc    Assign agent to landowner record
// @route   PUT /api/agents/assign
// @access  Public
router.put('/assign', async (req, res) => {
  try {
    const { landownerId, agentId, surveyNumber, projectId } = req.body;
    
    console.log('Assigning agent:', { landownerId, agentId });
    
    // Validate inputs
    const landownerIdInt = parseInt(landownerId, 10);
    const agentIdInt = parseInt(agentId, 10);
    if (!Number.isInteger(landownerIdInt) || !Number.isInteger(agentIdInt)) {
      // Try to fallback to surveyNumber + projectId if provided
      if (!surveyNumber || !projectId) {
        return res.status(400).json({
          success: false,
          message: 'Valid numeric Landowner ID and Agent ID are required (or provide surveyNumber and projectId)'
        });
      }
    }
    
    // Find the landowner record
    let landownerRecord = Number.isInteger(landownerIdInt) ? await LandownerRecord.findByPk(landownerIdInt) : null;
    if (!landownerRecord && surveyNumber && projectId) {
      landownerRecord = await LandownerRecord.findOne({
        where: {
          सर्वे_नं: surveyNumber,
          project_id: parseInt(projectId, 10)
        }
      });
    }
    if (!landownerRecord) {
      return res.status(404).json({ success: false, message: 'Landowner record not found' });
    }
    
    // Find the agent
    const agent = await User.findByPk(agentIdInt);
    if (!agent || agent.role !== 'agent') {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Update the landowner record
    await landownerRecord.update({
      assignedAgent: agentIdInt,
      assignedAt: new Date(),
      kycStatus: 'pending'
    });
    
    console.log('Agent assigned successfully');
    
    res.status(200).json({
      success: true,
      message: 'Agent assigned successfully',
      data: {
        landownerId: landownerRecord.id,
        agentId: agent.id,
        assignedAt: landownerRecord.assignedAt
      }
    });
    
  } catch (error) {
    console.error('Error assigning agent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign agent'
    });
  }
});

// @desc    Get agent's assigned records
// @route   GET /api/agents/assigned
// @access  Public
router.get('/assigned', async (req, res) => {
  try {
    // Determine agent via email first (stable across FE/BE), then id
    let agentId;
    const agentEmail = (req.query.agentEmail || '').toString().trim();
    if (agentEmail) {
      const byEmail = await User.findOne({ where: { email: agentEmail, role: 'agent', isActive: true } });
      if (byEmail) agentId = byEmail.id;
    }
    if (!agentId) {
      const queryId = req.query.agentId;
      const queryParsed = parseInt(queryId, 10);
      const userParsed = parseInt(req.user?.id, 10);
      agentId = Number.isInteger(queryParsed)
        ? queryParsed
        : Number.isInteger(userParsed)
          ? userParsed
          : 4;
    }
    
    console.log('Fetching assigned records for agent:', agentId);
    
    // Find agent
    const agent = await User.findByPk(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Get assigned records including notice fields for agent portal
    const records = await LandownerRecord.findAll({
      where: {
        assignedAgent: agentId,
        isActive: true
      },
      // return commonly used fields; allow model to alias columns
      attributes: [
        'id', 'project_id', 'खातेदाराचे_नांव', 'सर्वे_नं', 'village', 'taluka', 'district',
        'क्षेत्र', 'संपादित_क्षेत्र', 'एकूण_मोबदला', 'अंतिम_रक्कम',
        'noticeGenerated', 'noticeNumber', 'noticeDate', 'noticeContent',
        'kycStatus', 'paymentStatus', 'assignedAgent', 'assignedAt'
      ],
      order: [['assignedAt', 'DESC']]
    });
    
    console.log(`Found ${records.length} assigned records`);
    
    res.status(200).json({ success: true, count: records.length, records });
    
  } catch (error) {
    console.error('Error fetching assigned records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned records'
    });
  }
});

// Alias endpoint for enhanced agent dashboard compatibility
router.get('/assigned-with-notices', async (req, res) => {
  try {
    // Determine agent via email first, then id
    let agentId;
    const agentEmail = (req.query.agentEmail || '').toString().trim();
    if (agentEmail) {
      const byEmail = await User.findOne({ where: { email: agentEmail, role: 'agent', isActive: true } });
      if (byEmail) agentId = byEmail.id;
    }
    if (!agentId) {
      const queryId = req.query.agentId;
      const queryParsed = parseInt(queryId, 10);
      const userParsed = parseInt(req.user?.id, 10);
      agentId = Number.isInteger(queryParsed)
        ? queryParsed
        : Number.isInteger(userParsed)
          ? userParsed
          : 4;
    }

    console.log('Fetching assigned-with-notices for agent:', agentId);

    const agent = await User.findByPk(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const records = await LandownerRecord.findAll({
      where: { assignedAgent: agentId, isActive: true },
      attributes: [
        'id', 'project_id', 'खातेदाराचे_नांव', 'सर्वे_नं', 'village', 'taluka', 'district',
        'क्षेत्र', 'संपादित_क्षेत्र', 'एकूण_मोबदला', 'अंतिम_रक्कम',
        'noticeGenerated', 'noticeNumber', 'noticeDate', 'noticeContent',
        'kycStatus', 'paymentStatus', 'assignedAgent', 'assignedAt'
      ],
      order: [['assignedAt', 'DESC']]
    });

    return res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error('Error fetching assigned-with-notices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assigned-with-notices' });
  }
});

// @desc    Update KYC status
// @route   PUT /api/agents/kyc-status
// @access  Public
router.put('/kyc-status', async (req, res) => {
  try {
    const { landownerId, kycStatus, notes } = req.body;
    
    console.log('Updating KYC status:', { landownerId, kycStatus });
    
    // Find and update the landowner record
    const record = await LandownerRecord.findByPk(landownerId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }
    
    await record.update({
      kycStatus: kycStatus,
      kycNotes: notes || record.kycNotes,
      kycUpdatedAt: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'KYC status updated successfully',
      data: {
        landownerId: record.id,
        kycStatus: record.kycStatus,
        updatedAt: record.kycUpdatedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating KYC status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update KYC status'
    });
  }
});

export default router; 
 
// --- Extended endpoints for agent portal compatibility ---
// KYC status update using path param variant (alias)
router.put('/kyc-status/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { kycStatus, notes } = req.body || {};

    const record = await LandownerRecord.findByPk(parseInt(recordId, 10));
    if (!record) {
      return res.status(404).json({ success: false, message: 'Landowner record not found' });
    }

    await record.update({
      kycStatus: kycStatus || record.kycStatus,
      kycNotes: notes || record.kycNotes,
      kycUpdatedAt: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'KYC status updated successfully',
      data: { landownerId: record.id, kycStatus: record.kycStatus, updatedAt: record.kycUpdatedAt }
    });
  } catch (error) {
    console.error('Error updating KYC status (param):', error);
    return res.status(500).json({ success: false, message: 'Failed to update KYC status' });
  }
});

// Document upload (JSON metadata only for MVP)
router.post('/upload-document/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { documentType, fileName, fileUrl, fileSize, mimeType, notes, fileBase64 } = req.body || {};

    const record = await LandownerRecord.findByPk(parseInt(recordId, 10));
    if (!record) {
      return res.status(404).json({ success: false, message: 'Landowner record not found' });
    }

    // If client sent raw base64, try Cloudinary first, then Firebase Storage, else local filesystem
    let finalFileUrl = fileUrl;
    // 1) Cloudinary (preferred CDN)
    if (!finalFileUrl && fileBase64 && (process.env.CLOUDINARY_URL || (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET))) {
      try {
        const safeName = `${Date.now()}-${fileName || 'document'}`.replace(/[^a-zA-Z0-9._-]/g, '_');
        const dataUri = `data:${mimeType || 'application/octet-stream'};base64,${fileBase64}`;
        const cloudinary = getCloudinary();
        const uploadRes = await cloudinary.uploader.upload(dataUri, {
          public_id: `saral_bhoomi/kyc/${record.id}/${safeName}`,
          resource_type: 'auto',
          folder: `saral_bhoomi/kyc/${record.id}`
        });
        finalFileUrl = uploadRes.secure_url || uploadRes.url;
      } catch (e) {
        console.warn('Cloudinary upload failed, will try Firebase/local:', e.message);
      }
    }

    // 2) Firebase Storage
    if (!finalFileUrl && fileBase64 && admin.apps.length) {
      try {
        const bucket = admin.storage().bucket();
        const safeName = `${Date.now()}-${fileName || 'document.bin'}`;
        const destPath = `kyc/${record.id}/${safeName}`;
        const buffer = Buffer.from(fileBase64, 'base64');
        const file = bucket.file(destPath);
        await file.save(buffer, {
          contentType: mimeType || 'application/octet-stream',
          public: false,
          resumable: false,
          metadata: { cacheControl: 'public, max-age=31536000' }
        });
        // Generate a signed URL (read-only) valid for 7 days for agent portal
        const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });
        finalFileUrl = signedUrl;
      } catch (e) {
        console.warn('Admin upload failed, falling back to provided URL:', e.message);
      }
    }

    // Fallback: if no Firebase Storage (or failed) and we have base64, save locally under /uploads
    if (!finalFileUrl && fileBase64) {
      try {
        const safeName = `${Date.now()}-${fileName || 'document.bin'}`;
        const dirPath = path.join(process.cwd(), 'uploads', 'kyc', String(record.id));
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        const absFilePath = path.join(dirPath, safeName);
        const buffer = Buffer.from(fileBase64, 'base64');
        fs.writeFileSync(absFilePath, buffer);
        // Serve via express static at /uploads
        const publicPath = `/uploads/kyc/${record.id}/${encodeURIComponent(safeName)}`;
        // Construct absolute URL for convenience
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        finalFileUrl = `${baseUrl}${publicPath}`;
      } catch (e) {
        console.warn('Local upload fallback failed:', e.message);
      }
    }

    const currentDocuments = Array.isArray(record.documents) ? record.documents : [];
    const newDocument = {
      id: `${Date.now()}`,
      type: documentType,
      fileName: fileName,
      fileUrl: finalFileUrl,
      fileSize: fileSize || 0,
      mimeType: mimeType || 'application/octet-stream',
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

    try {
      if (admin.apps.length) {
        const db = admin.firestore();
        await db.collection('kycDocuments').add({
          landownerId: record.id,
          documentType,
          fileName,
          fileUrl,
          fileSize: fileSize || 0,
          mimeType: mimeType || 'application/octet-stream',
          notes: notes || '',
          uploadedAt: new Date().toISOString(),
          uploadedBy: req.user?.id || null,
          verified: false
        });
      }
    } catch (e) {
      console.warn('Failed to mirror document to Firestore:', e.message);
    }

    return res.status(200).json({ success: true, message: 'Document uploaded', data: { document: newDocument } });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
});