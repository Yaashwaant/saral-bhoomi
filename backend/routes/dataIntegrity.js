import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import dataIntegrityService from '../services/dataIntegrityService.js';

const router = express.Router();

// Initialize data integrity service
dataIntegrityService.initialize();

/**
 * @route GET /api/data-integrity/status
 * @desc Get data integrity service status
 * @access Private
 */
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const status = dataIntegrityService.getStatus();
    res.json({
      success: true,
      data: status,
      message: 'Data integrity service status retrieved'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get service status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/data-integrity/add-land-records
 * @desc Step 1: Add land records and create initial blockchain block
 * @access Private
 */
router.post('/add-land-records', authMiddleware, async (req, res) => {
  try {
    const { 
      survey_number, 
      jmr_data, 
      award_data, 
      land_record_data, 
      project_name, 
      landowner_name, 
      metadata 
    } = req.body;
    
    if (!survey_number || !project_name || !landowner_name) {
      return res.status(400).json({
        success: false,
        message: 'Survey number, project name, and landowner name are required'
      });
    }

    // Prepare survey data
    const surveyData = {
      survey_number,
      jmr: jmr_data || {},
      award: award_data || {},
      landRecord: land_record_data || {}
    };

    // Add land records to blockchain
    const result = await dataIntegrityService.addLandRecords(
      survey_number, 
      surveyData, 
      project_name, 
      landowner_name, 
      metadata || {}
    );

    res.json({
      success: true,
      data: result,
      message: 'Land records added to blockchain successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add land records',
      error: error.message
    });
  }
});

/**
 * @route POST /api/data-integrity/update-payment
 * @desc Step 2: Update blockchain with payment slip generation
 * @access Private
 */
router.post('/update-payment', authMiddleware, async (req, res) => {
  try {
    const { 
      survey_number, 
      payment_id, 
      amount, 
      payment_date, 
      utr_number, 
      metadata 
    } = req.body;
    
    if (!survey_number || !payment_id || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Survey number, payment ID, and amount are required'
      });
    }

    // Prepare payment data
    const paymentData = {
      survey_number,
      payment_id,
      amount: parseFloat(amount),
      payment_date: payment_date || new Date().toISOString(),
      utr_number: utr_number || null
    };

    // Update payment on blockchain
    const result = await dataIntegrityService.updatePaymentGenerated(
      survey_number, 
      paymentData, 
      metadata || {}
    );

    res.json({
      success: true,
      data: result,
      message: 'Payment information updated on blockchain successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update payment',
      error: error.message
    });
  }
});

/**
 * @route POST /api/data-integrity/complete-ownership
 * @desc Step 3: Complete workflow with ownership transfer
 * @access Private
 */
router.post('/complete-ownership', authMiddleware, async (req, res) => {
  try {
    const { 
      survey_number, 
      project_name, 
      previous_owner, 
      new_owner, 
      transfer_date, 
      metadata 
    } = req.body;
    
    if (!survey_number || !project_name || !new_owner) {
      return res.status(400).json({
        success: false,
        message: 'Survey number, project name, and new owner are required'
      });
    }

    // Prepare ownership transfer data
    const ownershipData = {
      survey_number,
      project_name,
      previous_owner: previous_owner || 'Landowner',
      new_owner,
      transfer_date: transfer_date || new Date().toISOString()
    };

    // Complete ownership transfer on blockchain
    const result = await dataIntegrityService.completeOwnershipTransfer(
      survey_number, 
      ownershipData, 
      metadata || {}
    );

    res.json({
      success: true,
      data: result,
      message: 'Ownership transfer completed on blockchain successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete ownership transfer',
      error: error.message
    });
  }
});

/**
 * @route GET /api/data-integrity/workflow/:surveyNumber
 * @desc Get complete workflow status for a survey number
 * @access Private
 */
router.get('/workflow/:surveyNumber', authMiddleware, async (req, res) => {
  try {
    const { surveyNumber } = req.params;
    
    // Get workflow status from blockchain
    const result = await dataIntegrityService.getSurveyWorkflow(surveyNumber);

    res.json({
      success: true,
      data: result,
      message: 'Workflow status retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve workflow status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/data-integrity/bulk-workflow
 * @desc Get workflow status for multiple survey numbers
 * @access Private
 */
router.post('/bulk-workflow', authMiddleware, async (req, res) => {
  try {
    const { survey_numbers } = req.body;
    
    if (!Array.isArray(survey_numbers) || survey_numbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Survey numbers array is required'
      });
    }

    // Get workflow status for all survey numbers
    const results = [];
    for (const surveyNumber of survey_numbers) {
      try {
        const result = await dataIntegrityService.getSurveyWorkflow(surveyNumber);
        results.push(result);
      } catch (error) {
        results.push({
          survey_number: surveyNumber,
          error: error.message,
          message: 'Failed to retrieve workflow status'
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Workflow status retrieved for ${survey_numbers.length} survey numbers`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk workflow check',
      error: error.message
    });
  }
});

/**
 * @route GET /api/data-integrity/project/:surveyNumber
 * @desc Get project information for a survey number
 * @access Private
 */
router.get('/project/:surveyNumber', authMiddleware, async (req, res) => {
  try {
    const { surveyNumber } = req.params;
    
    // Get workflow status to extract project info
    const workflow = await dataIntegrityService.getSurveyWorkflow(surveyNumber);
    
    if (workflow.error) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found or error occurred'
      });
    }

    res.json({
      success: true,
      data: {
        survey_number: surveyNumber,
        project_name: workflow.project_name,
        landowner_name: workflow.landowner_name,
        compensation_amount: workflow.compensation_amount,
        current_stage: workflow.current_stage,
        is_completed: workflow.is_completed
      },
      message: 'Project information retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project information',
      error: error.message
    });
  }
});

export default router;
