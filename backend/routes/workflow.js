import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import workflowService from '../services/workflowService.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadMulterFile, generateHashFromCloudinaryUrl } from '../services/cloudinaryService.js';

const router = express.Router();

// Configure multer for memory storage (files will be uploaded to Cloudinary)
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Allow CSV, PDF, DOC, DOCX, JPG, PNG files
    const allowedTypes = /csv|pdf|doc|docx|jpg|jpeg|png/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV, PDF, DOC, DOCX, JPG, PNG files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware to ensure user is authenticated
router.use(authenticateToken);

// Helper function to validate survey number format
const validateSurveyNumber = (value) => {
  if (!value || typeof value !== 'string') {
    throw new Error('Survey number is required and must be a string');
  }
  if (value.length < 3) {
    throw new Error('Survey number must be at least 3 characters long');
  }
  return true;
};

// Helper function to validate amount
const validateAmount = (value) => {
  if (value === undefined || value === null) return true;
  const num = parseFloat(value);
  if (isNaN(num) || num < 0) {
    throw new Error('Amount must be a positive number');
  }
  return true;
};

// ============================================================================
// JMR TO AWARD WORKFLOW
// ============================================================================

/**
 * POST /api/workflow/jmr-to-award
 * Process JMR to Award workflow for a single record
 */
router.post('/jmr-to-award', [
  body('survey_number').custom(validateSurveyNumber),
  body('project_id').isInt({ min: 1 }).withMessage('Valid project ID is required'),
  body('landowner_id').notEmpty().withMessage('Landowner ID is required'),
  body('landowner_name').optional().isString(),
  body('award_number').optional().isString(),
  body('award_date').optional().isISO8601().toDate(),
  body('base_amount').custom(validateAmount),
  body('solatium').custom(validateAmount),
  body('additional_amounts').optional().isObject(),
  body('village').notEmpty().withMessage('Village is required'),
  body('taluka').notEmpty().withMessage('Taluka is required'),
  body('district').notEmpty().withMessage('District is required'),
  body('land_type').isIn(['Agricultural', 'Non-Agricultural']).withMessage('Valid land type is required'),
  body('tribal_classification').isBoolean().withMessage('Tribal classification must be boolean'),
  body('category').optional().isString(),
  body('measured_area').custom(validateAmount),
  body('unit').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const result = await workflowService.processJMRToAward(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.award
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/workflow/jmr-to-award/bulk
 * Process JMR to Award workflow for multiple records via CSV
 */
router.post('/jmr-to-award/bulk', upload.single('csv_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    // Parse CSV file
    const csv = require('csv-parser');
    const fs = require('fs');
    const results = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Process bulk data
    const bulkResult = await workflowService.bulkProcessWorkflow(results, req.user.id, 'jmr_to_award');

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Bulk processing completed. ${bulkResult.successful} successful, ${bulkResult.failed} failed.`,
      data: bulkResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// AWARD TO NOTICE WORKFLOW
// ============================================================================

/**
 * POST /api/workflow/award-to-notice
 * Process Award to Notice workflow for a single record
 */
router.post('/award-to-notice', [
  body('survey_number').custom(validateSurveyNumber),
  body('project_id').optional().isInt({ min: 1 }),
  body('landowner_name').optional().isString(),
  body('amount').custom(validateAmount),
  body('notice_date').optional().isISO8601().toDate(),
  body('village').optional().isString(),
  body('taluka').optional().isString(),
  body('district').optional().isString(),
  body('land_type').optional().isIn(['Agricultural', 'Non-Agricultural']),
  body('tribal_classification').optional().isBoolean(),
  body('objection_deadline').optional().isISO8601().toDate(),
  body('notice_type').optional().isString(),
  body('description').optional().isString(),
  body('attachments').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const result = await workflowService.processAwardToNotice(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.notice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/workflow/award-to-notice/bulk
 * Process Award to Notice workflow for multiple records via CSV
 */
router.post('/award-to-notice/bulk', upload.single('csv_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const csv = require('csv-parser');
    const fs = require('fs');
    const results = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const bulkResult = await workflowService.bulkProcessWorkflow(results, req.user.id, 'award_to_notice');

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Bulk processing completed. ${bulkResult.successful} successful, ${bulkResult.failed} failed.`,
      data: bulkResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// NOTICE TO DOCUMENT UPLOAD WORKFLOW
// ============================================================================

/**
 * POST /api/workflow/notice-to-documents
 * Process Notice to Document Upload workflow
 */
router.post('/notice-to-documents', upload.array('attachments', 10), [
  body('survey_number').custom(validateSurveyNumber),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Upload files to Cloudinary
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const cloudinaryResult = await uploadMulterFile(file, {
            folder: 'workflow/documents',
            public_id: `notice-${req.body.survey_number}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
          });
          
          // Generate hash for blockchain
          const documentHash = await generateHashFromCloudinaryUrl(
            cloudinaryResult.cloudinary_url,
            `${req.body.survey_number}-${file.originalname}-${file.size}`
          );
          
          attachments.push({
            cloudinary_url: cloudinaryResult.cloudinary_url,
            public_id: cloudinaryResult.public_id,
            original_filename: file.originalname,
            file_size: file.size,
            mimetype: file.mimetype,
            document_hash: documentHash,
            upload_timestamp: cloudinaryResult.upload_timestamp
          });
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: `Failed to upload file ${file.originalname}: ${uploadError.message}`
          });
        }
      }
    }

    const documentData = {
      ...req.body,
      attachments
    };

    const result = await workflowService.processNoticeToDocumentUpload(documentData, req.user.id);
    
    res.json({
      success: true,
      message: result.message,
      data: result.notice,
      uploaded_files: attachments.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/workflow/notice-to-documents/bulk
 * Process Notice to Document Upload workflow for multiple records
 */
router.post('/notice-to-documents/bulk', upload.single('csv_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const csv = require('csv-parser');
    const fs = require('fs');
    const results = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const bulkResult = await workflowService.bulkProcessWorkflow(results, req.user.id, 'notice_to_documents');

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Bulk processing completed. ${bulkResult.successful} successful, ${bulkResult.failed} failed.`,
      data: bulkResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// NOTICE TO PAYMENT SLIP WORKFLOW
// ============================================================================

/**
 * POST /api/workflow/notice-to-payment
 * Process Notice to Payment Slip workflow
 */
router.post('/notice-to-payment', [
  body('survey_number').custom(validateSurveyNumber),
  body('project_id').optional().isInt({ min: 1 }),
  body('amount').custom(validateAmount),
  body('reason_if_pending').optional().isString(),
  body('payment_date').optional().isISO8601().toDate(),
  body('payment_method').optional().isString(),
  body('bank_details').optional().isObject(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const result = await workflowService.processNoticeToPaymentSlip(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: result.payment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/workflow/notice-to-payment/bulk
 * Process Notice to Payment Slip workflow for multiple records
 */
router.post('/notice-to-payment/bulk', upload.single('csv_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const csv = require('csv-parser');
    const fs = require('fs');
    const results = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const bulkResult = await workflowService.bulkProcessWorkflow(results, req.user.id, 'notice_to_payment');

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Bulk processing completed. ${bulkResult.successful} successful, ${bulkResult.failed} failed.`,
      data: bulkResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// PAYMENT RELEASE WORKFLOW
// ============================================================================

/**
 * POST /api/workflow/payment-release
 * Process Payment Release workflow
 */
router.post('/payment-release', [
  body('survey_number').custom(validateSurveyNumber),
  body('utr_number').optional().isString(),
  body('receipt_path').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const result = await workflowService.processPaymentRelease(req.body, req.user.id);
    
    res.json({
      success: true,
      message: result.message,
      data: result.payment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/workflow/payment-release/bulk
 * Process Payment Release workflow for multiple records
 */
router.post('/payment-release/bulk', upload.single('csv_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const csv = require('csv-parser');
    const fs = require('fs');
    const results = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const bulkResult = await workflowService.bulkProcessWorkflow(results, req.user.id, 'payment_release');

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Bulk processing completed. ${bulkResult.successful} successful, ${bulkResult.failed} failed.`,
      data: bulkResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================================================
// WORKFLOW STATUS AND QUERIES
// ============================================================================

/**
 * GET /api/workflow/status/:surveyNumber
 * Get complete workflow status for a survey number
 */
router.get('/status/:surveyNumber', async (req, res) => {
  try {
    const { surveyNumber } = req.params;
    
    if (!surveyNumber) {
      return res.status(400).json({
        success: false,
        message: 'Survey number is required'
      });
    }

    const status = await workflowService.getWorkflowStatus(surveyNumber);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/workflow/progress/:projectId
 * Get workflow progress for all survey numbers in a project
 */
router.get('/progress/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required'
      });
    }

    // This would need to be implemented in the workflow service
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Workflow progress endpoint - to be implemented',
      data: {
        project_id: projectId,
        total_surveys: 0,
        completed: 0,
        in_progress: 0,
        pending: 0
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/workflow/templates/:type
 * Download CSV templates for different workflow stages
 */
router.get('/templates/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    let template = '';
    let filename = '';
    
    switch (type) {
      case 'jmr_to_award':
        template = [
          'survey_number,project_id,landowner_id,landowner_name,award_number,award_date,base_amount,solatium,village,taluka,district,land_type,tribal_classification,category,measured_area,unit,notes',
          'SY-2024-001,1,OWN-001,John Doe,AWD-001,2024-01-15,50000,10000,Village A,Taluka A,District A,Agricultural,false,Residential,5.5,acres,Sample award data',
          'SY-2024-002,1,OWN-002,Jane Smith,AWD-002,2024-01-16,75000,15000,Village B,Taluka B,District B,Non-Agricultural,true,Commercial,3.2,acres,Another sample'
        ].join('\n');
        filename = 'jmr-to-award-template.csv';
        break;
        
      case 'award_to_notice':
        template = [
          'survey_number,project_id,landowner_name,amount,notice_date,village,taluka,district,land_type,tribal_classification,objection_deadline,notice_type,description',
          'SY-2024-001,1,John Doe,60000,2024-01-20,Village A,Taluka A,District A,Agricultural,false,2024-02-20,Acquisition,Notice for land acquisition',
          'SY-2024-002,1,Jane Smith,90000,2024-01-21,Village B,Taluka B,District B,Non-Agricultural,true,2024-02-21,Acquisition,Notice for land acquisition'
        ].join('\n');
        filename = 'award-to-notice-template.csv';
        break;
        
      case 'notice_to_payment':
        template = [
          'survey_number,project_id,amount,reason_if_pending,payment_date,payment_method,notes',
          'SY-2024-001,1,60000,Approval pending,2024-01-25,Bank Transfer,Payment slip for notice',
          'SY-2024-002,1,90000,Approval pending,2024-01-26,Bank Transfer,Payment slip for notice'
        ].join('\n');
        filename = 'notice-to-payment-template.csv';
        break;
        
      case 'payment_release':
        template = [
          'survey_number,utr_number,notes',
          'SY-2024-001,UTR123456789,Payment released successfully',
          'SY-2024-002,UTR987654321,Payment released successfully'
        ].join('\n');
        filename = 'payment-release-template.csv';
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid template type'
        });
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(template);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
