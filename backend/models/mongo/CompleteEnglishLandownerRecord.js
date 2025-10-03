import mongoose from 'mongoose';

const completeEnglishLandownerSchema = new mongoose.Schema({
  // Core identification fields
  serial_number: { type: mongoose.Schema.Types.Mixed, required: true },
  owner_name: { type: String, required: true },
  old_survey_number: { type: mongoose.Schema.Types.Mixed },
  new_survey_number: { type: mongoose.Schema.Types.Mixed },
  group_number: { type: String },
  cts_number: { type: mongoose.Schema.Types.Mixed },
  
  // Location fields
  village: { type: String, required: true },
  taluka: { type: String, required: true },
  district: { type: String, required: true },
  
  // Land area fields
  land_area_as_per_7_12: { type: mongoose.Schema.Types.Mixed, default: 0 },
  acquired_land_area: { type: mongoose.Schema.Types.Mixed, default: 0 },
  
  // Land type and classification
  land_type: { type: String },
  land_classification: { type: String },
  
  // Compensation calculation fields
  approved_rate_per_hectare: { type: mongoose.Schema.Types.Mixed, default: 0 },
  market_value_as_per_acquired_area: { type: mongoose.Schema.Types.Mixed, default: 0 },
  factor_as_per_section_26_2: { type: mongoose.Schema.Types.Mixed, default: 1 },
  land_compensation_as_per_section_26: { type: mongoose.Schema.Types.Mixed, default: 0 },
  
  // Structure and asset fields
  structures: { type: mongoose.Schema.Types.Mixed, default: 0 },
  forest_trees: { type: mongoose.Schema.Types.Mixed, default: 0 },
  fruit_trees: { type: mongoose.Schema.Types.Mixed, default: 0 },
  wells_borewells: { type: mongoose.Schema.Types.Mixed, default: 0 },
  
  // Amount calculations
  total_structures_amount: { type: mongoose.Schema.Types.Mixed, default: 0 },
  total_amount_14_23: { type: mongoose.Schema.Types.Mixed, default: 0 },
  solatium_amount: { type: mongoose.Schema.Types.Mixed, default: 0 },
  determined_compensation_26: { type: mongoose.Schema.Types.Mixed, default: 0 },
  enhanced_compensation_25_percent: { type: mongoose.Schema.Types.Mixed, default: 0 },
  total_compensation_26_27: { type: mongoose.Schema.Types.Mixed, default: 0 },
  deduction_amount: { type: mongoose.Schema.Types.Mixed, default: 0 },
  final_payable_compensation: { type: mongoose.Schema.Types.Mixed, default: 0 },
  
  // Additional fields
  remarks: { type: String, default: '' },
  compensation_distribution_status: { type: String, default: 'PENDING', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
  
  // Notice generation fields
  notice_generated: { type: Boolean, default: false },
  notice_number: { type: String },
  notice_date: { type: Date },
  notice_content: { type: String },
  
  // KYC and verification fields
  kyc_status: { type: String, default: 'PENDING', enum: ['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED'] },
  kyc_verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  kyc_verified_at: { type: Date },
  kyc_documents: [{
    document_type: String,
    document_url: String,
    uploaded_at: { type: Date, default: Date.now }
  }],
  
  // Payment fields
  payment_status: { type: String, default: 'PENDING', enum: ['PENDING', 'INITIATED', 'COMPLETED', 'FAILED'] },
  payment_amount: { type: mongoose.Schema.Types.Mixed, default: 0 },
  payment_date: { type: Date },
  payment_reference: { type: String },
  bank_details: {
    account_number: String,
    ifsc_code: String,
    bank_name: String,
    branch_name: String
  },
  
  // Agent assignment fields
  assigned_agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assigned_at: { type: Date },
  agent_notes: { type: String },
  
  // Blockchain fields
  blockchain_hash: { type: String },
  blockchain_block_id: { type: String },
  blockchain_status: { type: String, default: 'NOT_SYNCED', enum: ['NOT_SYNCED', 'PENDING', 'SYNCED', 'FAILED'] },
  blockchain_last_updated: { type: Date },
  exists_on_blockchain: { type: Boolean, default: false },
  
  // System fields
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true },
  
  // Additional metadata
  data_source: { type: String, default: 'MANUAL' }, // MANUAL, CSV_UPLOAD, API_IMPORT
  last_modified_section: { type: String }, // Track which section was last modified
  version: { type: Number, default: 1 } // For version control
}, {
  collection: 'landownerrecords_english_complete',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
completeEnglishLandownerSchema.index({ project_id: 1 });
completeEnglishLandownerSchema.index({ owner_name: 1 });
completeEnglishLandownerSchema.index({ village: 1 });
completeEnglishLandownerSchema.index({ taluka: 1 });
completeEnglishLandownerSchema.index({ district: 1 });
completeEnglishLandownerSchema.index({ is_active: 1 });
completeEnglishLandownerSchema.index({ created_at: -1 });
completeEnglishLandownerSchema.index({ serial_number: 1, project_id: 1 }, { unique: true });
completeEnglishLandownerSchema.index({ new_survey_number: 1 });
completeEnglishLandownerSchema.index({ old_survey_number: 1 });
completeEnglishLandownerSchema.index({ cts_number: 1 });
completeEnglishLandownerSchema.index({ kyc_status: 1 });
completeEnglishLandownerSchema.index({ payment_status: 1 });
completeEnglishLandownerSchema.index({ compensation_distribution_status: 1 });
completeEnglishLandownerSchema.index({ assigned_agent: 1 });
completeEnglishLandownerSchema.index({ blockchain_status: 1 });

// Virtual fields for computed values
completeEnglishLandownerSchema.virtual('landowner_name').get(function() {
  return this.owner_name;
});

completeEnglishLandownerSchema.virtual('row_key').get(function() {
  return this._id.toString();
});

// Pre-save middleware
completeEnglishLandownerSchema.pre('save', function(next) {
  this.updated_at = new Date();
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Methods
completeEnglishLandownerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  obj.landowner_name = this.owner_name;
  obj.row_key = this._id.toString();
  return obj;
};

const CompleteEnglishLandownerRecord = mongoose.model('CompleteEnglishLandownerRecord', completeEnglishLandownerSchema);

export default CompleteEnglishLandownerRecord;