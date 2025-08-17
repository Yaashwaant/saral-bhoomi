import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authorize } from '../middleware/auth.js';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, Word, Excel, and CSV files are allowed.'), false);
    }
  }
});

// @desc    Get documents for a project
// @route   GET /api/documents/:projectId
// @access  Private
router.get('/:projectId', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Validate project exists
    const project = await MongoProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get all landowner records for the project with documents
    const records = await MongoLandownerRecord.find({ 
      project_id: projectId,
      is_active: true 
    }).select('survey_number landowner_name documents');

    // Extract and format documents
    const documents = [];
    records.forEach(record => {
      if (record.documents && Array.isArray(record.documents)) {
        record.documents.forEach(doc => {
          documents.push({
            id: doc._id || doc.name,
            survey_number: record.survey_number,
            landowner_name: record.landowner_name,
            name: doc.name,
            url: doc.url,
            type: doc.type,
            uploaded_at: doc.uploaded_at,
            record_id: record._id
          });
        });
      }
    });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching documents'
    });
  }
});

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private
router.post('/upload', authorize(['officer', 'admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const {
      survey_number,
      document_type,
      document_category,
      project_id,
      landowner_id,
      notes
    } = req.body;

    if (!survey_number || !document_type || !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: survey_number, document_type, project_id'
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

    // Find the landowner record
    let landownerRecord = await MongoLandownerRecord.findOne({ 
      survey_number,
      project_id 
    });

    if (!landownerRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found for this survey number and project'
      });
    }

    // Create document object
    const newDocument = {
      name: req.file.originalname,
      url: `/uploads/documents/${req.file.filename}`,
      type: document_type,
      category: document_category,
      uploaded_at: new Date(),
      notes: notes || '',
      uploaded_by: req.user.id
    };

    // Add document to landowner record
    const currentDocuments = Array.isArray(landownerRecord.documents) ? landownerRecord.documents : [];
    const updatedDocuments = [...currentDocuments, newDocument];

    await MongoLandownerRecord.findByIdAndUpdate(landownerRecord._id, {
      documents: updatedDocuments
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: newDocument.name,
        name: newDocument.name,
        url: newDocument.url,
        type: newDocument.type,
        category: newDocument.category,
        uploaded_at: newDocument.uploaded_at,
        survey_number: landownerRecord.survey_number,
        landowner_name: landownerRecord.landowner_name
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading document'
    });
  }
});

// @desc    Delete document
// @route   DELETE /api/documents/:documentId
// @access  Private
router.delete('/:documentId', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { documentId } = req.params;
    const { record_id } = req.body;

    if (!record_id) {
      return res.status(400).json({
        success: false,
        message: 'Record ID is required'
      });
    }

    // Find the landowner record
    const landownerRecord = await MongoLandownerRecord.findById(record_id);
    if (!landownerRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    // Find and remove the document
    const currentDocuments = Array.isArray(landownerRecord.documents) ? landownerRecord.documents : [];
    const documentIndex = currentDocuments.findIndex(doc => 
      doc._id?.toString() === documentId || doc.name === documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Remove document from array
    const removedDocument = currentDocuments.splice(documentIndex, 1)[0];
    const updatedDocuments = currentDocuments;

    // Update the record
    await MongoLandownerRecord.findByIdAndUpdate(record_id, {
      documents: updatedDocuments
    });

    // Delete the physical file if it exists
    if (removedDocument.url && removedDocument.url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), removedDocument.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document'
    });
  }
});

// @desc    Get document by ID
// @route   GET /api/documents/file/:filename
// @access  Private
router.get('/file/:filename', authorize(['officer', 'admin']), (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads/documents', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file'
    });
  }
});

export default router;
