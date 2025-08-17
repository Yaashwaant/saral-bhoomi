import mongoose from 'mongoose';

const landownerRecordSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  survey_number: {
    type: String,
    required: true
  },
  landowner_name: {
    type: String,
    required: true
  },
  area: {
    type: Number,
    required: true
  },
  acquired_area: Number,
  rate: Number,
  structure_trees_wells_amount: Number,
  total_compensation: Number,
  solatium: Number,
  final_amount: Number,
  village: String,
  taluka: String,
  district: String,
  contact_phone: String,
  contact_email: String,
  contact_address: String,
  is_tribal: {
    type: Boolean,
    default: false
  },
  tribal_certificate_no: String,
  tribal_lag: String,
  bank_account_number: String,
  bank_ifsc_code: String,
  bank_name: String,
  bank_branch_name: String,
  bank_account_holder_name: String,
  kyc_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'initiated', 'completed'],
    default: 'pending'
  },
  notice_generated: {
    type: Boolean,
    default: false
  },
  notice_number: String,
  notice_date: Date,
  notice_content: String,
  kyc_completed_at: Date,
  kyc_completed_by: String,
  payment_initiated_at: Date,
  payment_completed_at: Date,
  bank_reference: String,
  assigned_agent: String,
  assigned_at: Date,
  documents: [{
    name: String,
    url: String,
    type: String,
    uploaded_at: Date
  }],
  notes: String,
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
landownerRecordSchema.index({ project_id: 1, survey_number: 1 }, { unique: true });
landownerRecordSchema.index({ village: 1, taluka: 1, district: 1 });
landownerRecordSchema.index({ kyc_status: 1 });
landownerRecordSchema.index({ payment_status: 1 });

export default mongoose.model('LandownerRecord', landownerRecordSchema);
