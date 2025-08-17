import express from 'express';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import MongoPayment from '../models/mongo/Payment.js';
import { authorize } from '../middleware/auth.js';
import rtgsService from '../services/rtgsService.js';
import receiptService from '../services/receiptService.js';
import paymentValidationService from '../services/paymentValidation.js';

const router = express.Router();

// @desc    Get payments by project
// @route   GET /api/payments/:projectId
// @access  Private (Officer, Admin)
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

    // Get all payments for the project
    const payments = await MongoPayment.find({ project_id: projectId })
      .populate('landowner_id', 'survey_number landowner_name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments.map(payment => ({
        id: payment._id,
        survey_number: payment.survey_number,
        landowner_name: payment.landowner_name,
        amount: payment.amount,
        status: payment.status,
        reason_if_pending: payment.reason_if_pending,
        officer_id: payment.officer_id,
        created_at: payment.createdAt,
        updated_at: payment.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching payments by project:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments'
    });
  }
});

// @desc    Get records eligible for payment
// @route   GET /api/payments/eligible
// @access  Private (Officer, Admin)
router.get('/eligible', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, projectId, status = 'pending' } = req.query;
    const filter = { 
      kyc_status: 'approved',
      is_active: true
    };
    
    if (projectId) filter.project_id = projectId;
    if (status) filter.payment_status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const records = await MongoLandownerRecord.find(filter)
      .populate('project_id', 'projectName status')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await MongoLandownerRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      data: records.map(record => ({
        id: record._id,
        survey_number: record.survey_number,
        landowner_name: record.landowner_name,
        area: record.area,
        acquired_area: record.acquired_area,
        total_compensation: record.total_compensation,
        solatium: record.solatium,
        final_amount: record.final_amount,
        village: record.village,
        taluka: record.taluka,
        district: record.district,
        kyc_status: record.kyc_status,
        payment_status: record.payment_status,
        bank_account_number: record.bank_account_number,
        bank_ifsc_code: record.bank_ifsc_code,
        bank_name: record.bank_name,
        bank_branch_name: record.bank_branch_name,
        bank_account_holder_name: record.bank_account_holder_name,
        project: record.project_id ? {
          id: record.project_id._id,
          projectName: record.project_id.projectName,
          status: record.project_id.status
        } : null,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching eligible records:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment-eligible records'
    });
  }
});

// @desc    Initiate payment for record
// @route   POST /api/payments/initiate/:recordId
// @access  Private (Officer, Admin)
router.post('/initiate/:recordId', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { recordId } = req.params;
    const { 
      bankAccountNumber, 
      ifscCode, 
      accountHolderName, 
      paymentNotes = '',
      sendReceipt = true,
      emailData = null,
      smsData = null
    } = req.body;

    // Get landowner record with project details
    const record = await MongoLandownerRecord.findById(recordId)
      .populate('project_id', 'projectName');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    // Prepare payment data
    const paymentData = {
      landownerRecordId: recordId,
      amount: record.final_amount,
      bankAccountNumber,
      ifscCode,
      accountHolderName,
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdBy: req.user.id
    };

    // Validate payment data
    const validation = await paymentValidationService.validatePaymentData(paymentData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment validation failed',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Create payment record
    const paymentRecord = await MongoPayment.create({
      ...paymentData,
      paymentStatus: 'pending',
      notes: paymentNotes
    });

    // Initiate RTGS payment
    const rtgsResult = await rtgsService.initiatePayment({
      transactionId: paymentRecord.transactionId,
      amount: paymentRecord.amount,
      bankAccountNumber: paymentRecord.bankAccountNumber,
      ifscCode: paymentRecord.ifscCode,
      accountHolderName: paymentRecord.accountHolderName
    });

    if (rtgsResult.success) {
      // Update payment record with RTGS response
      await paymentRecord.updateOne({
        paymentStatus: 'initiated',
        paymentInitiatedAt: new Date(),
        rtgsRequestData: rtgsResult.requestData,
        rtgsResponseData: rtgsResult.responseData
      });

      // Update landowner record
      await record.updateOne({
        paymentStatus: 'initiated',
        paymentInitiatedAt: new Date(),
        notes: paymentNotes ? (record.notes || '') + `\n[Payment Initiated] ${paymentNotes}` : record.notes
      });

      // Generate and send receipt if requested
      let receiptResult = null;
      if (sendReceipt) {
        const receiptData = {
          transactionId: paymentRecord.transactionId,
          amount: paymentRecord.amount,
          accountHolderName: paymentRecord.accountHolderName,
          bankAccountNumber: paymentRecord.bankAccountNumber,
          ifscCode: paymentRecord.ifscCode,
          paymentDate: new Date(),
          projectName: record.project_id?.projectName || 'Unknown Project',
          landownerName: record.landowner_name,
          surveyNumber: record.survey_number
        };

        receiptResult = await receiptService.generateAndSendReceipt(receiptData, {
          sendEmail: !!emailData,
          emailData,
          sendSMS: !!smsData,
          smsData
        });

        // Update payment record with receipt info
        if (receiptResult.success) {
          await paymentRecord.updateOne({
            receiptPath: receiptResult.data.receiptGenerated.filePath,
            receiptSentAt: new Date(),
            receiptSentVia: emailData && smsData ? 'both' : (emailData ? 'email' : 'sms')
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          paymentId: paymentRecord._id,
          transactionId: paymentRecord.transactionId,
          amount: paymentRecord.amount,
          status: paymentRecord.paymentStatus,
          rtgsReferenceId: rtgsResult.data.rtgsReferenceId,
          receiptGenerated: receiptResult?.success || false
        },
        warnings: validation.warnings
      });

    } else {
      // RTGS initiation failed
      await paymentRecord.updateOne({
        paymentStatus: 'failed',
        failureReason: rtgsResult.error.message,
        rtgsRequestData: rtgsResult.requestData,
        rtgsResponseData: rtgsResult.responseData
      });

      res.status(400).json({
        success: false,
        message: 'Payment initiation failed',
        error: rtgsResult.error
      });
    }

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while initiating payment'
    });
  }
});

// @desc    Update payment status
// @route   PUT /api/payments/update-status/:transactionId
// @access  Private (Officer, Admin)
router.put('/update-status/:transactionId', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, utrNumber, failureReason, paymentDate } = req.body;

    const paymentRecord = await MongoPayment.findOne({ transactionId });
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Update payment record
    const updateData = { paymentStatus: status };
    
    if (status === 'success') {
      updateData.paymentCompletedAt = paymentDate ? new Date(paymentDate) : new Date();
      if (utrNumber) updateData.utrNumber = utrNumber;
      updateData.notes = (paymentRecord.notes || '') + `\n[Payment Success] UTR: ${utrNumber || 'N/A'}`;
      
      // Mark payment as success
      await paymentRecord.markAsSuccess(utrNumber);
    } else if (status === 'failed') {
      updateData.notes = (paymentRecord.notes || '') + `\n[Payment Failed] ${failureReason || 'Unknown error'}`;
      
      // Mark payment as failed
      await paymentRecord.markAsFailed(failureReason || 'Unknown error');
    } else if (status === 'processing') {
      await paymentRecord.markAsProcessing();
    }

    // Update landowner record
    const landownerRecord = await MongoLandownerRecord.findById(paymentRecord.landownerRecordId);
    if (landownerRecord) {
      await landownerRecord.updateOne({
        paymentStatus: status,
        ...(status === 'success' && { paymentCompletedAt: new Date() }),
        ...(status === 'success' && utrNumber && { utrNumber }),
        notes: (landownerRecord.notes || '') + `\n[Payment Status Update] ${status.toUpperCase()}: ${utrNumber || failureReason || 'N/A'}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        paymentId: paymentRecord._id,
        transactionId: paymentRecord.transactionId,
        status: paymentRecord.paymentStatus,
        landownerName: landownerRecord?.landowner_name,
        amount: paymentRecord.amount
      }
    });
  } catch (error) {
    console.error('Payment status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating payment status'
    });
  }
});

// @desc    Get payment statistics
// @route   GET /api/payments/stats/:projectId
// @access  Public (temporarily)
router.get('/stats/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const records = await MongoLandownerRecord.find({ project_id: projectId });

    const stats = {
      totalRecords: records.length,
      paymentsPending: records.filter(r => r.payment_status === 'pending').length,
      paymentsInitiated: records.filter(r => r.payment_status === 'initiated').length,
      paymentsSuccess: records.filter(r => r.payment_status === 'success').length,
      paymentsFailed: records.filter(r => r.payment_status === 'failed').length,
      totalCompensation: records.reduce((sum, r) => sum + (parseFloat(r.final_amount) || 0), 0),
      totalPaid: records
        .filter(r => r.payment_status === 'success')
        .reduce((sum, r) => sum + (parseFloat(r.final_amount) || 0), 0)
    };

    res.status(200).json({
      success: true,
      data: stats || {
        totalRecords: 0,
        paymentsPending: 0,
        paymentsInitiated: 0,
        paymentsSuccess: 0,
        paymentsFailed: 0,
        totalCompensation: 0,
        totalPaid: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment statistics'
    });
  }
});

// @desc    Get payment details by ID
// @route   GET /api/payments/:paymentId
// @access  Private (Officer, Admin)
router.get('/:paymentId', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { paymentId } = req.params;

    const paymentRecord = await MongoPayment.findById(paymentId)
      .populate('landownerRecordId', 'landowner_name survey_number')
      .populate('createdBy', 'name email role');

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentRecord
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment details'
    });
  }
});

// @desc    Retry failed payment
// @route   POST /api/payments/:paymentId/retry
// @access  Private (Officer, Admin)
router.post('/:paymentId/retry', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Validate payment for retry
    const validation = await paymentValidationService.validatePaymentForRetry(paymentId);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment not eligible for retry',
        errors: validation.errors
      });
    }

    const paymentRecord = validation.paymentRecord;

    // Retry RTGS payment
    const rtgsResult = await rtgsService.initiatePayment({
      transactionId: paymentRecord.transactionId,
      amount: paymentRecord.amount,
      bankAccountNumber: paymentRecord.bankAccountNumber,
      ifscCode: paymentRecord.ifscCode,
      accountHolderName: paymentRecord.accountHolderName
    });

    if (rtgsResult.success) {
      // Update payment record
      await paymentRecord.updateOne({
        paymentStatus: 'initiated',
        paymentInitiatedAt: new Date(),
        rtgsRequestData: rtgsResult.requestData,
        rtgsResponseData: rtgsResult.responseData
      });

      res.status(200).json({
        success: true,
        message: 'Payment retry initiated successfully',
        data: {
          paymentId: paymentRecord._id,
          transactionId: paymentRecord.transactionId,
          status: paymentRecord.paymentStatus,
          rtgsReferenceId: rtgsResult.data.rtgsReferenceId
        }
      });
    } else {
      // Retry failed
      await paymentRecord.markAsFailed(rtgsResult.error.message);

      res.status(400).json({
        success: false,
        message: 'Payment retry failed',
        error: rtgsResult.error
      });
    }

  } catch (error) {
    console.error('Payment retry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrying payment'
    });
  }
});

// @desc    Cancel payment
// @route   POST /api/payments/:paymentId/cancel
// @access  Private (Officer, Admin)
router.post('/:paymentId/cancel', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason = 'Cancelled by officer' } = req.body;

    const paymentRecord = await MongoPayment.findById(paymentId);
    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    if (!paymentRecord.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Payment cannot be cancelled in current status'
      });
    }

    // Try to cancel with RTGS if possible
    let rtgsResult = null;
    if (paymentRecord.rtgsResponseData?.rtgsReferenceId) {
      rtgsResult = await rtgsService.cancelPayment(paymentRecord.rtgsResponseData.rtgsReferenceId);
    }

    // Update payment record
    await paymentRecord.updateOne({
      paymentStatus: 'cancelled',
      notes: (paymentRecord.notes || '') + `\n[Payment Cancelled] ${reason}`,
      rtgsResponseData: rtgsResult ? { ...paymentRecord.rtgsResponseData, cancelResponse: rtgsResult } : paymentRecord.rtgsResponseData
    });

    // Update landowner record
    const landownerRecord = await MongoLandownerRecord.findById(paymentRecord.landownerRecordId);
    if (landownerRecord) {
      await landownerRecord.updateOne({
        paymentStatus: 'cancelled',
        notes: (landownerRecord.notes || '') + `\n[Payment Cancelled] ${reason}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment cancelled successfully',
      data: {
        paymentId: paymentRecord._id,
        transactionId: paymentRecord.transactionId,
        status: paymentRecord.paymentStatus,
        rtgsCancelled: rtgsResult?.success || false
      }
    });

  } catch (error) {
    console.error('Payment cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling payment'
    });
  }
});

// @desc    Get payment receipt
// @route   GET /api/payments/:paymentId/receipt
// @access  Private (Officer, Admin)
router.get('/:paymentId/receipt', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { paymentId } = req.params;

    const paymentRecord = await MongoPayment.findById(paymentId)
      .populate('landownerRecordId', 'landowner_name survey_number');

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    if (!paymentRecord.receiptPath) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found for this payment'
      });
    }

    // Get receipt file
    const receiptResult = await receiptService.getReceiptFile(paymentRecord.receiptPath.split('/').pop());
    
    if (!receiptResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Receipt file not found'
      });
    }

    // Send file
    res.download(receiptResult.filePath, receiptResult.fileName);

  } catch (error) {
    console.error('Receipt download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while downloading receipt'
    });
  }
});

// @desc    Bulk payment initiation
// @route   POST /api/payments/bulk
// @access  Private (Officer, Admin)
router.post('/bulk', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { payments, sendReceipt = true } = req.body;

    if (!Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payments array is required and cannot be empty'
      });
    }

    // Validate bulk payments
    const bulkValidation = await paymentValidationService.validateBulkPayments(payments);
    if (!bulkValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Bulk payment validation failed',
        errors: bulkValidation.bulkErrors,
        results: bulkValidation.results
      });
    }

    const results = [];
    const successful = [];
    const failed = [];

    // Process each payment
    for (const paymentData of payments) {
      try {
        // Create payment record
        const paymentRecord = await MongoPayment.create({
          ...paymentData,
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          paymentStatus: 'pending',
          createdBy: req.user.id
        });

        // Initiate RTGS payment
        const rtgsResult = await rtgsService.initiatePayment({
          transactionId: paymentRecord.transactionId,
          amount: paymentRecord.amount,
          bankAccountNumber: paymentRecord.bankAccountNumber,
          ifscCode: paymentRecord.ifscCode,
          accountHolderName: paymentRecord.accountHolderName
        });

        if (rtgsResult.success) {
          await paymentRecord.updateOne({
            paymentStatus: 'initiated',
            paymentInitiatedAt: new Date(),
            rtgsRequestData: rtgsResult.requestData,
            rtgsResponseData: rtgsResult.responseData
          });

          successful.push({
            paymentId: paymentRecord._id,
            transactionId: paymentRecord.transactionId,
            status: 'initiated'
          });
        } else {
          await paymentRecord.markAsFailed(rtgsResult.error.message);
          failed.push({
            paymentId: paymentRecord._id,
            transactionId: paymentRecord.transactionId,
            error: rtgsResult.error.message
          });
        }

        results.push({
          paymentData,
          success: rtgsResult.success,
          paymentId: paymentRecord._id,
          transactionId: paymentRecord.transactionId
        });

      } catch (error) {
        console.error('Bulk payment error:', error);
        failed.push({
          paymentData,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk payment processing completed',
      data: {
        total: payments.length,
        successful: successful.length,
        failed: failed.length,
        successfulPayments: successful,
        failedPayments: failed,
        results
      }
    });

  } catch (error) {
    console.error('Bulk payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing bulk payments'
    });
  }
});

export default router; 