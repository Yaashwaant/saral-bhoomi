import mongoose from 'mongoose';

// LandownerRecord2 schema for landrecords2 collection
const landownerRecord2Schema = new mongoose.Schema({
  // BASIC IDENTIFICATION (matching database fields exactly)
  अ_क्र: {
    type: String,
    required: true,
    trim: true
  },
  खातेदाराचे_नांव: {
    type: String,
    required: true,
    trim: true
  },
  जुना_स_नं: {
    type: String,
    required: false,
    trim: true
  },
  नविन_स_नं: {
    type: String,
    required: false,
    trim: true
  },
  गट_नंबर: {
    type: String,
    required: false,
    trim: true
  },
  सी_टी_एस_नंबर: {
    type: String,
    required: false,
    trim: true
  },
  
  // LOCATION DETAILS
  Village: {
    type: String,
    required: true,
    trim: true
  },
  Taluka: {
    type: String,
    required: true,
    trim: true
  },
  District: {
    type: String,
    required: true,
    trim: true
  },
  
  // AREA INFORMATION
  गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर: {
    type: Number,
    required: false,
    default: 0
  },
  संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर: {
    type: Number,
    required: false,
    default: 0
  },
  
  // LAND CLASSIFICATION
  जमिनीचा_प्रकार: {
    type: String,
    required: false,
    trim: true
  },
  जमिनीचा_प्रकार_शेती_बिनशेती_धारणाधिकार: {
    type: String,
    required: false,
    trim: true
  },
  
  // COMPENSATION DETAILS
  मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये: {
    type: Number,
    required: false,
    default: 0
  },
  संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू: {
    type: Number,
    required: false,
    default: 0
  },
  कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8: {
    type: Number,
    required: false,
    default: 1
  },
  कलम_26_नुसार_जमिनीचा_मोबदला_9X10: {
    type: Number,
    required: false,
    default: 0
  },
  
  // STRUCTURES AND TREES
  बांधकामे: {
    type: Number,
    required: false,
    default: 0
  },
  वनझाडे: {
    type: Number,
    required: false,
    default: 0
  },
  फळझाडे: {
    type: Number,
    required: false,
    default: 0
  },
  विहिरी_बोअरवेल: {
    type: Number,
    required: false,
    default: 0
  },
  
  // TOTAL CALCULATIONS
  एकुण_रक्कम_रुपये_16_18_20_22: {
    type: Number,
    required: false,
    default: 0
  },
  एकुण_रक्कम_14_23: {
    type: Number,
    required: false,
    default: 0
  },
  सोलेशियम_दिलासा_रक्कम: {
    type: Number,
    required: false,
    default: 0
  },
  निर्धारित_मोबदला_26: {
    type: Number,
    required: false,
    default: 0
  },
  एकूण_रक्कमेवर_25_वाढीव_मोबदला: {
    type: Number,
    required: false,
    default: 0
  },
  एकुण_मोबदला_26_27: {
    type: Number,
    required: false,
    default: 0
  },
  वजावट_रक्कम_रुपये: {
    type: Number,
    required: false,
    default: 0
  },
  हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये: {
    type: Number,
    required: false,
    default: 0
  },
  
  // TRIBAL INFORMATION
  is_tribal: {
    type: Boolean,
    default: false
  },
  tribal_certificate_no: {
    type: String,
    required: false,
    trim: true
  },
  tribal_lag: {
    type: String,
    required: false,
    trim: true
  },
  
  // CONTACT INFORMATION
  contact_phone: {
    type: String,
    required: false,
    trim: true
  },
  contact_email: {
    type: String,
    required: false,
    trim: true
  },
  contact_address: {
    type: String,
    required: false,
    trim: true
  },
  
  // BANK DETAILS
  bank_account_number: {
    type: String,
    required: false,
    trim: true
  },
  bank_ifsc_code: {
    type: String,
    required: false,
    trim: true
  },
  bank_name: {
    type: String,
    required: false,
    trim: true
  },
  bank_branch_name: {
    type: String,
    required: false,
    trim: true
  },
  bank_account_holder_name: {
    type: String,
    required: false,
    trim: true
  },
  
  // ADDITIONAL FIELDS FROM DATABASE
  शेरा: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  मोबदला_वाटप_तपशिल: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  
  // PROJECT REFERENCE (default to ROB project)
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    default: new mongoose.Types.ObjectId('68da6edf579af093415f639e')
  },
  notice_generated: {
    type: Boolean,
    default: false
  },
  notice_sent: {
    type: Boolean,
    default: false
  },
  
  // AGENT ASSIGNMENT
  assigned_agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assigned_at: {
    type: Date
  },
  
  // REFERENCE NUMBERS
  reference_number: {
    type: String,
    required: false,
    trim: true
  },
  file_number: {
    type: String,
    required: false,
    trim: true
  },
  khata_number: {
    type: String,
    required: false,
    trim: true
  },
  khasra_number: {
    type: String,
    required: false,
    trim: true
  },
  mutation_number: {
    type: String,
    required: false,
    trim: true
  },
  land_record_number: {
    type: String,
    required: false,
    trim: true
  },
  
  // PROJECT REFERENCE (Default to ROB project) - REMOVED DUPLICATE
  
  // DOCUMENTS
  documents: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploaded_at: { type: Date, default: Date.now },
    upload_source: { type: String, required: false, default: 'unknown' }
  }],
  
  // ADDITIONAL FIELDS
  notes: String,
  remarks: String,
  
  // FLEXIBLE EXTRA FIELDS
  extra_fields: { type: Map, of: mongoose.Schema.Types.Mixed },
  notes_json: { type: mongoose.Schema.Types.Mixed },
  
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
    default: 'parishisht_k'
  },
  source_file_name: String,
  import_batch_id: String
}, {
  timestamps: true,
  collection: 'landownerrecords2' // Fixed: Use correct collection name from database
});

// Indexes for better query performance
landownerRecord2Schema.index({ 
  project_id: 1, 
  serial_number: 1
}, { unique: true });

landownerRecord2Schema.index({ project_id: 1, survey_number: 1 });
landownerRecord2Schema.index({ project_id: 1, new_survey_number: 1 });
landownerRecord2Schema.index({ village: 1, taluka: 1, district: 1 });
landownerRecord2Schema.index({ kyc_status: 1 });
landownerRecord2Schema.index({ payment_status: 1 });
landownerRecord2Schema.index({ assigned_agent: 1 });

export default mongoose.model('LandownerRecord2', landownerRecord2Schema);