import express from 'express';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import MongoUser from '../models/mongo/User.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all landowner records
// @route   GET /api/landowners/list
// @access  Public (for now)
router.get('/list', async (req, res) => {
  try {
    const records = await MongoLandownerRecord.find({ is_active: true })
      .populate('created_by', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records: records.map(record => ({
        id: record._id,
        survey_number: record.survey_number,
        landowner_name: record.landowner_name,
        area: record.area,
        acquired_area: record.acquired_area,
        rate: record.rate,
        total_compensation: record.total_compensation,
        solatium: record.solatium,
        final_amount: record.final_amount,
        village: record.village,
        taluka: record.taluka,
        district: record.district,
        contact_phone: record.contact_phone,
        contact_email: record.contact_email,
        contact_address: record.contact_address,
        is_tribal: record.is_tribal,
        tribal_certificate_no: record.tribal_certificate_no,
        tribal_lag: record.tribal_lag,
        bank_account_number: record.bank_account_number,
        bank_ifsc_code: record.bank_ifsc_code,
        bank_name: record.bank_name,
        bank_branch_name: record.bank_branch_name,
        bank_account_holder_name: record.bank_account_holder_name,
        kyc_status: record.kyc_status,
        payment_status: record.payment_status,
        notice_generated: record.notice_generated,
        notice_number: record.notice_number,
        notice_date: record.notice_date,
        notice_content: record.notice_content,
        kyc_completed_at: record.kyc_completed_at,
        kyc_completed_by: record.kyc_completed_by,
        payment_initiated_at: record.payment_initiated_at,
        payment_completed_at: record.payment_completed_at,
        bank_reference: record.bank_reference,
        assigned_agent: record.assigned_agent,
        assigned_at: record.assigned_at,
        documents: record.documents,
        notes: record.notes,
        is_active: record.is_active,
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
    const record = await MongoLandownerRecord.findById(req.params.id)
      .populate('created_by', 'name email');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    res.status(200).json({
      success: true,
      record: {
        id: record._id,
        survey_number: record.survey_number,
        landowner_name: record.landowner_name,
        area: record.area,
        acquired_area: record.acquired_area,
        rate: record.rate,
        total_compensation: record.total_compensation,
        solatium: record.solatium,
        final_amount: record.final_amount,
        village: record.village,
        taluka: record.taluka,
        district: record.district,
        contact_phone: record.contact_phone,
        contact_email: record.contact_email,
        contact_address: record.contact_address,
        is_tribal: record.is_tribal,
        tribal_certificate_no: record.tribal_certificate_no,
        tribal_lag: record.tribal_lag,
        bank_account_number: record.bank_account_number,
        bank_ifsc_code: record.bank_ifsc_code,
        bank_name: record.bank_name,
        bank_branch_name: record.bank_branch_name,
        bank_account_holder_name: record.bank_account_holder_name,
        kyc_status: record.kyc_status,
        payment_status: record.payment_status,
        notice_generated: record.notice_generated,
        notice_number: record.notice_number,
        notice_date: record.notice_date,
        notice_content: record.notice_content,
        kyc_completed_at: record.kyc_completed_at,
        kyc_completed_by: record.kyc_completed_by,
        payment_initiated_at: record.payment_initiated_at,
        payment_completed_at: record.payment_completed_at,
        bank_reference: record.bank_reference,
        assigned_agent: record.assigned_agent,
        assigned_at: record.assigned_at,
        documents: record.documents,
        notes: record.notes,
        is_active: record.is_active,
        created_by: record.created_by ? {
          id: record.created_by._id,
          name: record.created_by.name,
          email: record.created_by.email
        } : null,
        created_at: record.createdAt,
        updated_at: record.updatedAt
      }
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
  // Correct mapping: is_tribal <- 'आदिवासी'; tribal_certificate_no <- 'आदिवासी_प्रमाणपत्र_क्रमांक'; tribal_lag <- 'आदिवासी_लाग' | 'लागू'
  b.is_tribal = b.is_tribal ?? b['आदिवासी'] ?? b['tribal'];
  b.tribal_certificate_no = b.tribal_certificate_no || b['आदिवासी_प्रमाणपत्र_क्रमांक'] || b['tribalCertNo'];
  b.tribal_lag = b.tribal_lag || b['आदिवासी_लाग'] || b['लागू'] || b['tribalLag'];
  b.contact_phone = b.contact_phone || b['मोबाईल'] || b['फोन'];
  b.contact_email = b.contact_email || b['ईमेल'];
  b.contact_address = b.contact_address || b['पत्ता'];
  b.bank_account_number = b.bank_account_number || b['खाते_क्रमांक'];
  b.bank_ifsc_code = b.bank_ifsc_code || b['IFSC'] || b['आयएफएससी'];
  b.bank_name = b.bank_name || b['बँक_नाव'];
  b.bank_branch_name = b.bank_branch_name || b['शाखा'];
  b.bank_account_holder_name = b.bank_account_holder_name || b['खातेधारक_नाव'] || b['खातेदाराचे_नांव'];
  return b;
};

// @desc    Update landowner record (partial)
// @route   PUT /api/landowners/:id
// @access  Public (temporarily)
router.put('/:id', async (req, res) => {
  try {
    const record = await MongoLandownerRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Landowner record not found' });
    }

    const updatable = [
      'kyc_status', 'payment_status', 'assigned_agent', 'assigned_at', 'contact_phone', 'contact_email',
      'contact_address', 'bank_account_number', 'bank_ifsc_code', 'bank_name', 'bank_branch_name',
      'bank_account_holder_name', 'documents', 'notes', 'is_active',
      'is_tribal', 'tribal_certificate_no', 'tribal_lag'
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