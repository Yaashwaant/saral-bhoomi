import express from 'express';
import LandownerRecord from '../models/LandownerRecord.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all landowner records
// @route   GET /api/landowners/list
// @access  Public (for now)
router.get('/list', async (req, res) => {
  try {
    const records = await LandownerRecord.findAll({
      where: { isActive: true },
      include: [
        { model: Project, attributes: ['projectName', 'pmisCode'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: records.length,
      records: records
    });
  } catch (error) {
    console.error('Error fetching landowner records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records'
    });
  }
});

// @desc    Get landowner record by ID
// @route   GET /api/landowners/:id
// @access  Public (for now)
router.get('/:id', async (req, res) => {
  try {
    const record = await LandownerRecord.findByPk(req.params.id, {
      include: [
        { model: Project, attributes: ['projectName', 'pmisCode'] },
        { model: User, as: 'assignedAgentUser', attributes: ['name', 'email', 'phone'] }
      ]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    res.status(200).json({
      success: true,
      record: record
    });
  } catch (error) {
    console.error('Error fetching landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner record'
    });
  }
});

// Normalize Marathi/English keys to model fields
const normalizeUpdate = (body = {}) => {
  const b = { ...body };
  // Tribal and Contact/bank fields accept Marathi aliases
  b.isTribal = b.isTribal ?? b['आदिवासी'] ?? b['tribal'];
  b.tribalCertificateNo = b.tribalCertificateNo || b['आदिवासी_प्रमाणपत्र_क्रमांक'] || b['tribalCertNo'];
  b.tribalLag = b.tribalLag || b['আदिवासी_लॅग'] || b['आदिवासी_लाग'] || b['tribalLag'];
  b.contactPhone = b.contactPhone || b['मोबाईल'] || b['फोन'];
  b.contactEmail = b.contactEmail || b['ईमेल'];
  b.contactAddress = b.contactAddress || b['पत्ता'];
  b.bankAccountNumber = b.bankAccountNumber || b['खाते_क्रमांक'];
  b.bankIfscCode = b.bankIfscCode || b['IFSC'] || b['आयएफएससी'];
  b.bankName = b.bankName || b['बँक_नाव'];
  b.bankBranchName = b.bankBranchName || b['शाखा'];
  b.bankAccountHolderName = b.bankAccountHolderName || b['खातेधारक_नाव'] || b['खातेदाराचे_नांव'];
  return b;
};

// @desc    Update landowner record (partial)
// @route   PUT /api/landowners/:id
// @access  Public (temporarily)
router.put('/:id', async (req, res) => {
  try {
    const record = await LandownerRecord.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Landowner record not found' });
    }

    const updatable = [
      'kycStatus', 'paymentStatus', 'assignedAgent', 'assignedAt', 'contactPhone', 'contactEmail',
      'contactAddress', 'bankAccountNumber', 'bankIfscCode', 'bankName', 'bankBranchName',
      'bankAccountHolderName', 'documents', 'notes', 'isActive',
      'isTribal', 'tribalCertificateNo', 'tribalLag'
    ];
    const body = normalizeUpdate(req.body);
    const updates = {};
    updatable.forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });

    await record.update(updates);
    res.status(200).json({ success: true, record });
  } catch (error) {
    console.error('Update landowner error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router; 