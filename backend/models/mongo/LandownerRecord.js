import mongoose from 'mongoose';

const landownerRecordSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // BASIC IDENTIFICATION FIELDS
  serial_number: String, // अ.क्र
  survey_number: {
    type: String,
    required: true
  },
  landowner_name: {
    type: String,
    required: true
  },
  
  // NEW FORMAT IDENTIFICATION FIELDS
  old_survey_number: String, // जुना स.नं.
  new_survey_number: String, // नविन स.नं.
  group_number: String, // गट नंबर
  cts_number: String, // सी.टी.एस. नंबर
  
  // AREA FIELDS
  area: {
    type: Number,
    required: true
  },
  acquired_area: Number,
  total_area_village_record: Number, // गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)
  acquired_area_sqm_hectare: Number, // संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)
  
  // LAND CLASSIFICATION FIELDS
  land_category: String, // जमिनीचा प्रकार
  land_type_classification: String, // जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार
  agricultural_type: String, // शेती
  agricultural_classification: String, // शेती/वर्ग -1
  
  // RATE AND MARKET VALUE FIELDS
  rate: Number,
  approved_rate_per_hectare: Number, // मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये
  market_value_acquired_area: Number, // संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू
  
  // SECTION 26 CALCULATION FIELDS
  section_26_2_factor: Number, // कलम 26 (2) नुसार गावास लागु असलेले गणक Factor
  section_26_compensation: Number, // कलम 26 नुसार जमिनीचा मोबदला
  
  // STRUCTURE COMPENSATION FIELDS
  structure_trees_wells_amount: Number, // Legacy field
  
  // Buildings - बांधकामे
  buildings_count: Number, // बांधकामे संख्या
  buildings_amount: Number, // बांधकामे रक्कम रुपये
  
  // Forest Trees - वनझाडे
  forest_trees_count: Number, // वनझाडे झाडांची संख्या
  forest_trees_amount: Number, // वनझाडे झाडांची रक्कम रु.
  
  // Fruit Trees - फळझाडे
  fruit_trees_count: Number, // फळझाडे झाडांची संख्या
  fruit_trees_amount: Number, // फळझाडे झाडांची रक्कम रु.
  
  // Wells/Borewells - विहिरी/बोअरवेल
  wells_borewells_count: Number, // विहिरी/बोअरवेल संख्या
  wells_borewells_amount: Number, // विहिरी/बोअरवेल रक्कम रुपये
  
  // Total Structures Amount - एकुण रक्कम रुपये (16+18+ 20+22)
  total_structures_amount: Number,
  
  // COMPENSATION CALCULATION FIELDS
  total_compensation: Number,
  total_compensation_amount: Number, // एकुण रक्कम (14+23)
  solatium: Number,
  solatium_100_percent: Number, // 100 % सोलेशियम (दिलासा रक्कम)
  determined_compensation: Number, // निर्धारित मोबदला 26 = (24+25)
  additional_25_percent_compensation: Number, // एकूण रक्कमेवर 25% वाढीव मोबदला
  total_final_compensation: Number, // एकुण मोबदला (26+ 27)
  deduction_amount: Number, // वजावट रक्कम रुपये
  final_amount: Number,
  final_payable_amount: Number, // हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये
  
  // LOCATION FIELDS
  village: String,
  taluka: String,
  district: String,
  
  // CONTACT FIELDS
  contact_phone: String,
  contact_email: String,
  contact_address: String,
  
  // TRIBAL FIELDS
  is_tribal: {
    type: Boolean,
    default: false
  },
  tribal_certificate_no: String,
  tribal_lag: String,
  
  // BANKING FIELDS
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
  
  // ADDITIONAL FIELDS
  notes: String,
  remarks: String, // शेरा - remarks from new format
  
  // METADATA FIELDS
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // FORMAT TRACKING
  data_format: {
    type: String,
    enum: ['legacy', 'parishisht_k', 'mixed'],
    default: 'legacy'
  },
  source_file_name: String,
  import_batch_id: String
}, {
  timestamps: true
});

// Indexes for better query performance
// New unique constraint: serial_number must be unique within a project-village scope
landownerRecordSchema.index({ 
  project_id: 1, 
  village: 1,
  serial_number: 1
}, { unique: true });

// Additional indexes for performance
landownerRecordSchema.index({ project_id: 1, survey_number: 1 }); // Non-unique for queries
landownerRecordSchema.index({ village: 1, taluka: 1, district: 1 });
landownerRecordSchema.index({ kyc_status: 1 });
landownerRecordSchema.index({ payment_status: 1 });

export default mongoose.model('LandownerRecord', landownerRecordSchema);
