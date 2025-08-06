import express from 'express';
import LandownerRecord from '../models/LandownerRecord.js';
import Project from '../models/Project.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get records eligible for payment
// @route   GET /api/payments/eligible
// @access  Public (temporarily)
router.get('/eligible', async (req, res) => {
  try {
    const { page = 1, limit = 10, projectId } = req.query;
    const filter = { 
      kycStatus: 'approved',
      paymentStatus: 'pending',
      isActive: true
    };
    if (projectId) filter.projectId = projectId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const records = await LandownerRecord.find(filter)
      .populate('projectId', 'projectName pmisCode')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LandownerRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment-eligible records'
    });
  }
});

// @desc    Initiate payment for record
// @route   POST /api/payments/initiate/:recordId
// @access  Public (temporarily)
router.post('/initiate/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { paymentNotes = '' } = req.body;

    const record = await LandownerRecord.findById(recordId);
    if (!record || record.kycStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Record not found or KYC not approved'
      });
    }

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    record.paymentStatus = 'initiated';
    record.paymentInitiatedAt = new Date();
    record.transactionId = transactionId;
    if (paymentNotes) {
      record.notes = (record.notes || '') + `\n[Payment] ${paymentNotes}`;
    }

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        transactionId,
        amount: record.अंतिम_रक्कम,
        status: 'initiated'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while initiating payment'
    });
  }
});

// @desc    Update payment status
// @route   PUT /api/payments/update-status/:transactionId
// @access  Public (temporarily)
router.put('/update-status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, utrNumber, failureReason, paymentDate } = req.body;

    const record = await LandownerRecord.findOne({ transactionId });
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    record.paymentStatus = status;
    
    if (status === 'success') {
      record.paymentCompletedAt = paymentDate ? new Date(paymentDate) : new Date();
      if (utrNumber) record.utrNumber = utrNumber;
      record.notes = (record.notes || '') + `\n[Payment Success] UTR: ${utrNumber || 'N/A'}`;
    } else if (status === 'failed') {
      record.notes = (record.notes || '') + `\n[Payment Failed] ${failureReason || 'Unknown error'}`;
    }

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        transactionId,
        status: record.paymentStatus,
        landownerName: record.खातेदाराचे_नांव
      }
    });
  } catch (error) {
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

    const stats = await LandownerRecord.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          paymentsPending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } },
          paymentsInitiated: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'initiated'] }, 1, 0] } },
          paymentsSuccess: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'success'] }, 1, 0] } },
          paymentsFailed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] } },
          totalCompensation: { $sum: { $toDouble: '$अंतिम_रक्कम' } },
          totalPaid: { 
            $sum: { 
              $cond: [
                { $eq: ['$paymentStatus', 'success'] }, 
                { $toDouble: '$अंतिम_रक्कम' }, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
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

export default router; 