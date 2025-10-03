import express from 'express';
import { authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import CompleteEnglishLandownerRecord from '../models/mongo/CompleteEnglishLandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import { uploadFileBuffer } from '../services/cloudinaryService.js';
import { validateProjectId } from '../middleware/validation.js';
import LedgerV2Service from '../services/ledgerV2Service.js';

const router = express.Router();

// @desc    Get documents for a project
// @route   GET /api/documents/:projectId
// @access  Private
router.get('/:projectId', authorize('officer', 'admin'), async (req, res) => {
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
    const records = await CompleteEnglishLandownerRecord.find({ 
      project_id: projectId,
      is_active: true 
    }).select('new_survey_number owner_name documents');

    // Extract and format documents
    const documents = [];
    records.forEach(record => {
      if (record.documents && Array.isArray(record.documents)) {
        record.documents.forEach(doc => {
          documents.push({
            id: doc._id || doc.name,
            new_survey_number: record.new_survey_number,
            owner_name: record.owner_name,
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
router.post('/upload', authorize('officer', 'admin'), upload.single('file'), validateProjectId, async (req, res) => {
  console.log('🔍 Upload endpoint accessed');
  console.log('👤 User:', req.user);
  console.log('📁 File:', req.file);
  console.log('📝 Body:', req.body);
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const {
      new_survey_number,
      document_type,
      document_category,
      project_id,
      landowner_id,
      notes
    } = req.body;

    if (!new_survey_number || !document_type || !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: new_survey_number, document_type, project_id'
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
    let landownerRecord = await CompleteEnglishLandownerRecord.findOne({ 
      new_survey_number,
      project_id 
    });

    if (!landownerRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found for this survey number and project'
      });
    }

    console.log('📁 Uploading file to Cloudinary:', req.file.originalname);

    // Upload file to Cloudinary
    const cloudinaryResult = await uploadFileBuffer(req.file.buffer, {
      folder: `saral-bhoomi/${project_id}/${new_survey_number}`,
      public_id: `${document_type}_${Date.now()}`,
      resource_type: 'auto'
    });

    console.log('☁️ File uploaded to Cloudinary:', cloudinaryResult.secure_url);

    // Create document object with Cloudinary URL
    const newDocument = {
      name: req.file.originalname,
      url: cloudinaryResult.secure_url,
      cloudinary_id: cloudinaryResult.public_id,
      type: document_type,
      category: document_category || 'general',
      uploaded_at: new Date(),
      notes: notes || '',
      uploaded_by: req.user.id,
      file_size: req.file.size,
      mime_type: req.file.mimetype
    };

    // Add document to landowner record
    const currentDocuments = Array.isArray(landownerRecord.documents) ? landownerRecord.documents : [];
    
    // Clean existing documents to ensure they're objects
    const cleanCurrentDocuments = currentDocuments.filter(doc => 
      typeof doc === 'object' && doc !== null && doc.name && doc.url && doc.type
    );
    
    const updatedDocuments = [...cleanCurrentDocuments, newDocument];

    console.log('🔍 Updating landowner record with ID:', landownerRecord._id);
    console.log('🔍 Landowner record type:', typeof landownerRecord._id);
    console.log('🔍 Current documents count:', currentDocuments.length);
    console.log('🔍 Clean documents count:', cleanCurrentDocuments.length);
    console.log('🔍 New document to add:', newDocument);
    console.log('🔍 Updated documents array:', updatedDocuments);

    // Validate the documents array before update
    try {
      // Try using findByIdAndUpdate first
      const updateResult = await CompleteEnglishLandownerRecord.findByIdAndUpdate(
        landownerRecord._id,
        { documents: updatedDocuments },
        { new: true, runValidators: true }
      );
      
      console.log('✅ Update result:', updateResult);
      
    } catch (updateError) {
      console.error('❌ findByIdAndUpdate failed, trying updateOne...');
      
      try {
        // Fallback to updateOne
        const updateResult = await CompleteEnglishLandownerRecord.updateOne(
          { _id: landownerRecord._id },
          { documents: updatedDocuments }
        );
        
        console.log('✅ UpdateOne result:', updateResult);
        console.log('✅ Modified count:', updateResult.modifiedCount);
        
      } catch (updateOneError) {
        console.error('❌ Both update methods failed');
        console.error('❌ UpdateOne error:', updateOneError.message);
        
        // Try to get more details about the existing documents
        const existingRecord = await CompleteEnglishLandownerRecord.findById(landownerRecord._id);
        if (existingRecord && existingRecord.documents) {
          console.log('🔍 Existing documents structure:', existingRecord.documents);
          console.log('🔍 First document type:', typeof existingRecord.documents[0]);
          console.log('🔍 First document:', existingRecord.documents[0]);
        }
        
        throw updateOneError;
      }
    }

    console.log('💾 Document saved to MongoDB for survey:', new_survey_number);

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully to Cloudinary',
      data: {
        id: newDocument.name,
        name: newDocument.name,
        url: newDocument.url,
        cloudinary_id: newDocument.cloudinary_id,
        type: newDocument.type,
        category: newDocument.category,
        uploaded_at: newDocument.uploaded_at,
        new_survey_number: landownerRecord.new_survey_number,
        owner_name: landownerRecord.owner_name,
        file_size: newDocument.file_size,
        mime_type: newDocument.mime_type
      }
    });
  } catch (error) {
    console.error('❌ Error uploading document:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading document to Cloudinary'
    });
  }
});

// @desc    Upload document (Field Officer)
// @route   POST /api/documents/field-upload
// @access  Private
router.post('/field-upload', authorize('field_officer', 'officer', 'admin'), upload.single('file'), validateProjectId, async (req, res) => {
  console.log('🔍 Field upload endpoint accessed');
  console.log('👤 User:', req.user);
  console.log('📁 File:', req.file);
  console.log('📝 Body:', req.body);
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const {
      new_survey_number,
      document_type,
      project_id,
      notes
    } = req.body;

    if (!new_survey_number || !document_type || !project_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: new_survey_number, document_type, project_id'
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
    let landownerRecord = await CompleteEnglishLandownerRecord.findOne({ 
      new_survey_number,
      project_id 
    });

    if (!landownerRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found for this survey number and project'
      });
    }

    console.log('📁 Field Officer uploading file to Cloudinary:', req.file.originalname);

    // Upload file to Cloudinary
    const cloudinaryResult = await uploadFileBuffer(req.file.buffer, {
      folder: `saral-bhoomi/${project_id}/${new_survey_number}/field-officer`,
      public_id: `${document_type}_${Date.now()}_field`,
      resource_type: 'auto'
    });

    console.log('☁️ File uploaded to Cloudinary by Field Officer:', cloudinaryResult.secure_url);

    // Create document object with Cloudinary URL
    const newDocument = {
      name: req.file.originalname,
      url: cloudinaryResult.secure_url,
      cloudinary_id: cloudinaryResult.public_id,
      type: document_type,
      category: 'field_officer_upload',
      uploaded_at: new Date(),
      notes: notes || '',
      uploaded_by: req.user.id,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      upload_source: 'field_officer'
    };

    // Add document to landowner record
    const currentDocuments = Array.isArray(landownerRecord.documents) ? landownerRecord.documents : [];
    const updatedDocuments = [...currentDocuments, newDocument];

    console.log('🔍 Updating landowner record with ID:', landownerRecord._id);
    console.log('🔍 Landowner record type:', typeof landownerRecord._id);

    // Use updateOne instead of findByIdAndUpdate to avoid ObjectId casting issues
    await CompleteEnglishLandownerRecord.updateOne(
      { _id: landownerRecord._id },
      { documents: updatedDocuments }
    );

    console.log('💾 Field Officer document saved to MongoDB for survey:', new_survey_number);

    // Append DOCUMENT_UPLOADED timeline event and roll-forward ledger to keep hashes in sync
    try {
      const ledgerV2 = new LedgerV2Service();
      await ledgerV2.appendTimelineEvent(
        new_survey_number,
        req.user.id,
        'DOCUMENT_UPLOADED',
        {
          name: newDocument.name,
          type: newDocument.type,
          url: newDocument.url,
          cloudinary_id: newDocument.cloudinary_id,
          category: newDocument.category,
          upload_source: newDocument.upload_source
        },
        'Field officer uploaded document',
        project_id
      );

      await ledgerV2.createOrUpdateFromLive(
        new_survey_number,
        req.user.id,
        project_id,
        'document_uploaded'
      );
    } catch (e) {
      console.warn('⚠️ Could not update timeline/ledger after field document upload:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully by Field Officer',
      data: {
        id: newDocument.name,
        name: newDocument.name,
        url: newDocument.url,
        cloudinary_id: newDocument.cloudinary_id,
        type: newDocument.type,
        category: newDocument.category,
        uploaded_at: newDocument.uploaded_at,
        new_survey_number: landownerRecord.new_survey_number,
        owner_name: landownerRecord.owner_name,
        file_size: newDocument.file_size,
        mime_type: newDocument.mime_type,
        upload_source: newDocument.upload_source
      }
    });
  } catch (error) {
    console.error('❌ Error uploading document by Field Officer:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error uploading document to Cloudinary'
    });
  }
});

// @desc    Delete document
// @route   DELETE /api/documents/:documentId
// @access  Private
router.delete('/:documentId', authorize('officer', 'admin'), async (req, res) => {
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
    const landownerRecord = await CompleteEnglishLandownerRecord.findById(record_id);
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
    await CompleteEnglishLandownerRecord.findByIdAndUpdate(record_id, {
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
router.get('/file/:filename', authorize('officer', 'admin'), (req, res) => {
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
