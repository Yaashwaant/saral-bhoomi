import mongoose from 'mongoose';

const englishLandownerSchema = new mongoose.Schema({
  serial_number: { type: mongoose.Schema.Types.Mixed, required: false },
  owner_name: { type: String, required: false },
  old_survey_number: { type: mongoose.Schema.Types.Mixed, required: false },
  new_survey_number: { type: mongoose.Schema.Types.Mixed, required: false },
  group_number: { type: String, required: false },
  cts_number: { type: mongoose.Schema.Types.Mixed, required: false },
  village: { type: String, required: false },
  taluka: { type: String, required: false },
  district: { type: String, required: false },
  land_area_as_per_7_12: { type: mongoose.Schema.Types.Mixed, required: false },
  acquired_land_area: { type: mongoose.Schema.Types.Mixed, required: false },
  land_type: { type: String, required: false },
  land_classification: { type: String, required: false },
  approved_rate_per_hectare: { type: mongoose.Schema.Types.Mixed, required: false },
  market_value_as_per_acquired_area: { type: mongoose.Schema.Types.Mixed, required: false },
  factor_as_per_section_26_2: { type: mongoose.Schema.Types.Mixed, required: false },
  land_compensation_as_per_section_26: { type: mongoose.Schema.Types.Mixed, required: false },
  structures: { type: mongoose.Schema.Types.Mixed, required: false },
  forest_trees: { type: mongoose.Schema.Types.Mixed, required: false },
  fruit_trees: { type: mongoose.Schema.Types.Mixed, required: false },
  wells_borewells: { type: mongoose.Schema.Types.Mixed, required: false },
  total_structures_amount: { type: mongoose.Schema.Types.Mixed, required: false },
  total_amount_14_23: { type: mongoose.Schema.Types.Mixed, required: false },
  solatium_amount: { type: mongoose.Schema.Types.Mixed, required: false },
  determined_compensation_26: { type: mongoose.Schema.Types.Mixed, required: false },
  enhanced_compensation_25_percent: { type: mongoose.Schema.Types.Mixed, required: false },
  total_compensation_26_27: { type: mongoose.Schema.Types.Mixed, required: false },
  deduction_amount: { type: mongoose.Schema.Types.Mixed, required: false },
  final_payable_compensation: { type: mongoose.Schema.Types.Mixed, required: false },
  remarks: { type: String, required: false },
  compensation_distribution_status: { type: String, required: false },
  project_id: { type: mongoose.Schema.Types.ObjectId, required: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, required: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
}, {
  collection: 'landownerrecords_english'
});

// Add indexes for better performance
englishLandownerSchema.index({ project_id: 1 });
englishLandownerSchema.index({ serial_number: 1 });
englishLandownerSchema.index({ owner_name: 1 });
englishLandownerSchema.index({ village: 1 });
englishLandownerSchema.index({ is_active: 1 });

const EnglishLandownerRecord = mongoose.model('EnglishLandownerRecord', englishLandownerSchema);

export default EnglishLandownerRecord;