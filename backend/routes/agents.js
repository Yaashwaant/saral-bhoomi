import express from 'express';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoUser from '../models/mongo/User.js';
import MongoProject from '../models/mongo/Project.js';
import admin from 'firebase-admin';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';
import { getCloudinary } from '../services/cloudinaryService.js';
import { authorize } from '../middleware/auth.js';
import LedgerV2Service from '../services/ledgerV2Service.js';

const router = express.Router();

// Cloudinary is configured centrally via service. Nothing needed here.

// @desc    Get all agents
// @route   GET /api/agents/list
// @access  Public
router.get('/list', async (req, res) => {
  try {
    const agents = await MongoUser.find({
      role: { $in: ['agent', 'field_officer'] },
      is_active: true
    }).select('_id name email phone department role').sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: agents.length,
      agents: agents.map(agent => ({
        id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        department: agent.department,
        role: agent.role
      }))
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch agents', agents: [] });
  }
});

// Backward-compatible alias for older frontends
router.get('/list-all', async (req, res) => {
  try {
    const agents = await MongoUser.find({
      role: { $in: ['agent', 'field_officer'] },
      is_active: true
    }).select('_id name email phone department role').sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: agents.length,
      agents: agents.map(agent => ({
        id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        department: agent.department,
        role: agent.role
      }))
    });
  } catch (error) {
    console.error('Error fetching agents (list-all):', error);
    res.status(500).json({ success: false, message: 'Failed to fetch agents', agents: [] });
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
      const byEmail = await MongoUser.findOne({ email: agentEmail, role: 'agent', is_active: true });
      if (byEmail) agentId = byEmail._id;
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
    const agent = await MongoUser.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Get assigned records including notice fields for agent portal
    const records = await MongoLandownerRecord.find({
      assigned_agent: agentId,
      is_active: true
    }).select([
      '_id', 'project_id', 'landowner_name', 'survey_number', 'village', 'taluka', 'district',
      'area', 'total_compensation', 'kyc_status', 'payment_status', 'assigned_agent', 'assigned_at'
    ]).sort({ assigned_at: -1 });
    
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
      const byEmail = await MongoUser.findOne({ email: agentEmail, role: 'agent', is_active: true });
      if (byEmail) agentId = byEmail._id;
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

    const agent = await MongoUser.findById(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const records = await MongoLandownerRecord.find({
      assigned_agent: agentId,
      is_active: true
    }).select([
      '_id', 'project_id', 'landowner_name', 'survey_number', 'village', 'taluka', 'district',
      'area', 'total_compensation', 'kyc_status', 'payment_status', 'assigned_agent', 'assigned_at'
    ]).sort({ assigned_at: -1 });

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
    const record = await MongoLandownerRecord.findById(landownerId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }
    
    await MongoLandownerRecord.findByIdAndUpdate(landownerId, {
      kyc_status: kycStatus,
      kyc_notes: notes || record.kyc_notes,
      kyc_updated_at: new Date()
    });
    
    res.status(200).json({
      success: true,
      message: 'KYC status updated successfully',
      data: {
        landownerId: record._id,
        kycStatus: kycStatus,
        updatedAt: new Date()
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

// @desc    Assign agent to landowner record
// @route   POST /api/agents/assign
// @access  Private (Officer, Admin)
router.post('/assign', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { landowner_id, agent_id, project_id, assignment_notes } = req.body;

    if (!landowner_id || !agent_id || !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: landowner_id, agent_id, project_id'
      });
    }

    // Validate landowner record exists
    const landownerRecord = await MongoLandownerRecord.findById(landowner_id);
    if (!landownerRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    // Validate agent exists (be lenient with incoming id formats)
    let agent = null;
    try {
      agent = await MongoUser.findById(agent_id);
    } catch (e) {
      // ignore cast error, try resolving by known demo name below
    }
    if (!agent) {
      // Attempt to resolve demo field officer by name
      agent = await MongoUser.findOne({ name: 'Rajesh Patil - Field Officer', role: { $in: ['agent', 'field_officer'] }, is_active: true });
    }
    if (!agent || !['agent', 'field_officer'].includes(agent.role)) {
      return res.status(404).json({ success: false, message: 'Agent not found or invalid role' });
    }

    // Validate project exists
    const project = await MongoProject.findById(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update landowner record with agent assignment
    await MongoLandownerRecord.findByIdAndUpdate(landowner_id, {
      assigned_agent: agent._id,
      assigned_at: new Date(),
      notes: assignment_notes || `Assigned to agent: ${agent.name}`
    });

    res.status(200).json({
      success: true,
      message: 'Agent assigned successfully',
      data: {
        landowner_id,
        agent_id: agent._id,
        agent_name: agent.name,
        assigned_at: new Date(),
        project_id,
        project_name: project.projectName
      }
    });
  } catch (error) {
    console.error('Error assigning agent:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning agent'
    });
  }
});

// @desc    Get agent assignments
// @route   GET /api/agents/assignments/:agentId
// @access  Private
router.get('/assignments/:agentId', authorize(['field_officer', 'officer', 'admin']), async (req, res) => {
  try {
    const { agentId } = req.params;
    const { project_id } = req.query;

    // Find assignments for this agent
    const assignments = await MongoLandownerRecord.find({
      assigned_agent: agentId,
      is_active: true,
      ...(project_id && { project_id })
    })
      .populate('created_by', 'name email')
      .sort({ assigned_at: -1 });

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments.map(assignment => ({
        id: assignment._id,
        survey_number: assignment.survey_number,
        landowner_name: assignment.landowner_name,
        area: assignment.area,
        village: assignment.village,
        taluka: assignment.taluka,
        district: assignment.district,
        total_compensation: assignment.total_compensation,
        is_tribal: assignment.is_tribal,
        tribal_certificate_no: assignment.tribal_certificate_no,
        tribal_lag: assignment.tribal_lag,
        kyc_status: assignment.kyc_status,
        assigned_at: assignment.assigned_at,
        assignment_notes: assignment.assignment_notes,
        documents_uploaded: assignment.documents && assignment.documents.length > 0,
        project_id: assignment.project_id,
        created_at: assignment.createdAt,
        updated_at: assignment.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching agent assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching agent assignments'
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

    const record = await MongoLandownerRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Landowner record not found' });
    }

    await MongoLandownerRecord.findByIdAndUpdate(recordId, {
      kyc_status: kycStatus || record.kyc_status,
      kyc_notes: notes || record.kyc_notes,
      kyc_updated_at: new Date()
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

    const record = await MongoLandownerRecord.findById(recordId);
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

    await MongoLandownerRecord.findByIdAndUpdate(recordId, {
      documents: updatedDocuments,
      kyc_status: record.kyc_status === 'pending' ? 'in_progress' : record.kyc_status,
      updated_at: new Date()
    });

    // 🔗 Update blockchain with the new document data
    try {
      const ledgerV2 = new LedgerV2Service();
      await ledgerV2.appendTimelineEvent(
        record.survey_number,
        req.user?.id || 'agent',
        'DOCUMENT_UPLOADED',
        {
          name: newDocument.fileName,
          type: newDocument.type,
          url: newDocument.fileUrl,
          file_size: newDocument.fileSize,
          mime_type: newDocument.mimeType,
          upload_source: 'agent'
        },
        'Agent uploaded KYC document',
        record.project_id
      );

      await ledgerV2.createOrUpdateFromLive(
        record.survey_number,
        req.user?.id || 'agent',
        record.project_id,
        'agent_document_uploaded'
      );
      
      console.log(`✅ Blockchain updated for survey ${record.survey_number} after agent document upload`);
    } catch (blockchainError) {
      console.error('⚠️ Failed to update blockchain after agent document upload:', blockchainError);
      // Don't fail the entire operation if blockchain update fails
    }

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

    return res.status(200).json({ success: true, message: 'Document uploaded and recorded on blockchain', data: { document: newDocument } });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
});