import mongoose from 'mongoose';

const completeEnglishLandownerSchema = new mongoose.Schema({
  // Core identification fields
  serial_number: { type: mongoose.Schema.Types.Mixed },
  owner_name: { type: String },
  old_survey_number: { type: mongoose.Schema.Types.Mixed },
  new_survey_number: { type: mongoose.Schema.Types.Mixed },
  group_number: { type: String },
  cts_number: { type: mongoose.Schema.Types.Mixed },
  
  // Location fields
  village: { type: String },
  taluka: { type: String },
  district: { type: String },
  
  // Land area fields
  land_area_as_per_7_12: { type: mongoose.Schema.Types.Mixed },
  acquired_land_area: { type: mongoose.Schema.Types.Mixed },
  
  // Land type and classification
  land_type: { type: String },
  land_classification: { type: String },
  
  // Compensation calculation fields
  approved_rate_per_hectare: { type: mongoose.Schema.Types.Mixed },
  market_value_as_per_acquired_area: { type: mongoose.Schema.Types.Mixed },
  factor_as_per_section_26_2: { type: mongoose.Schema.Types.Mixed },
  land_compensation_as_per_section_26: { type: mongoose.Schema.Types.Mixed },
  
  // Structure and asset fields
  structures: { type: mongoose.Schema.Types.Mixed },
  forest_trees: { type: mongoose.Schema.Types.Mixed },
  fruit_trees: { type: mongoose.Schema.Types.Mixed },
  wells_borewells: { type: mongoose.Schema.Types.Mixed },
  
  // Amount calculations
  total_structures_amount: { type: mongoose.Schema.Types.Mixed },
  total_amount_14_23: { type: mongoose.Schema.Types.Mixed },
  solatium_amount: { type: mongoose.Schema.Types.Mixed },
  determined_compensation_26: { type: mongoose.Schema.Types.Mixed },
  enhanced_compensation_25_percent: { type: mongoose.Schema.Types.Mixed },
  total_compensation_26_27: { type: mongoose.Schema.Types.Mixed },
  deduction_amount: { type: mongoose.Schema.Types.Mixed },
  final_payable_compensation: { type: mongoose.Schema.Types.Mixed },
  
  // Additional fields
  remarks: { type: String },
  compensation_distribution_status: { type: String },
  
  // System fields
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
}, {
  collection: 'landownerrecords_english_complete'
});

// Indexes for performance
completeEnglishLandownerSchema.index({ project_id: 1 });
completeEnglishLandownerSchema.index({ owner_name: 1 });
completeEnglishLandownerSchema.index({ village: 1 });
completeEnglishLandownerSchema.index({ taluka: 1 });
completeEnglishLandownerSchema.index({ district: 1 });
completeEnglishLandownerSchema.index({ is_active: 1 });
completeEnglishLandownerSchema.index({ created_at: -1 });

const CompleteEnglishLandownerRecord = mongoose.model('CompleteEnglishLandownerRecord', completeEnglishLandownerSchema);

export default CompleteEnglishLandownerRecord;