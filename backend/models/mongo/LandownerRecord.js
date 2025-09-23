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
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'approved', 'rejected'],
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
  assignment_notes: String,
  kyc_notes: String,
  documents: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    cloudinary_id: { type: String, required: false },
    type: { type: String, required: true },
    category: { type: String, required: false, default: 'general' },
    uploaded_at: { type: Date, required: false, default: Date.now },
    notes: { type: String, required: false, default: '' },
    uploaded_by: { type: String, required: false },
    file_size: { type: Number, required: false },
    mime_type: { type: String, required: false },
    upload_source: { type: String, required: false, default: 'unknown' }
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
  timestamps: true,
  strict: false, // Allow fields not in schema
  strictQuery: false, // Allow queries on fields not in schema
  validateBeforeSave: false // Skip validation on save to prevent casting errors
});

// Indexes for better query performance
landownerRecordSchema.index({ project_id: 1, survey_number: 1 }, { unique: true });
landownerRecordSchema.index({ village: 1, taluka: 1, district: 1 });
landownerRecordSchema.index({ kyc_status: 1 });
landownerRecordSchema.index({ payment_status: 1 });

export default mongoose.model('LandownerRecord', landownerRecordSchema);
