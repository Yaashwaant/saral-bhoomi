import mongoose from 'mongoose';

const enhancedJMRRecordSchema = new mongoose.Schema({
  // PARISHISHT-K FORMAT - EXACT 31 FIELDS FROM PDF
  
  // 1. Serial Number
  serial_number: {
    type: String,
    trim: true // अ.क्र
  },
  
  // 2. Landowner Name
  landowner_name: {
    type: String,
    required: true,
    trim: true // खातेदाराचे नांव
  },
  
  // 3-6. Survey Number Details
  old_survey_number: {
    type: String,
    trim: true // जुना स.नं.
  },
  new_survey_number: {
    type: String,
    required: true,
    trim: true // नविन स.नं.
  },
  group_number: {
    type: String,
    trim: true // गट नंबर
  },
  cts_number: {
    type: String,
    trim: true // सी.टी.एस. नंबर
  },
  
  // 7-8. Area Fields
  total_area_village_record: {
    type: Number,
    required: true // गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)
  },
  acquired_area_sqm_hectare: {
    type: Number,
    required: true // संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)
  },
  
  // 9-10. Land Classification
  land_category: {
    type: String,
    trim: true // जमिनीचा प्रकार
  },
  land_type_classification: {
    type: String,
    trim: true // जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार
  },
  
  // Header Information (extracted from Excel row 7)
  village: {
    type: String,
    required: true,
    trim: true // गाव (from header)
  },
  taluka: {
    type: String,
    required: true,
    trim: true // तालुका (from header)
  },
  district: {
    type: String,
    required: true,
    trim: true // जिल्हा (from header)
  },
  
  // Project Reference
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  officer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Landowner Details
  landowner_name: {
    type: String,
    required: true,
    trim: true // खातेदाराचे नाव
  },
  father_husband_name: {
    type: String,
    trim: true // वडिलांचे/पतीचे नाव
  },
  
  // Area Details
  total_area_village_record: {
    type: Number,
    required: true // गावनमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)
  },
  acquired_area: {
    type: Number,
    required: true // संपादित जमिनीचे क्षेत्र
  },
  area_hectares: {
    type: Number // Parikshit 16 format: क्षेत्र (हेक्टर)
  },
  area_unit: {
    type: String,
    enum: ['hectare', 'acre', 'sqm'],
    default: 'hectare'
  },
  
  // Land Classification
  land_category: {
    type: String,
    trim: true // जमिनीचा प्रकार
  },
  land_type_classification: {
    type: String,
    enum: ['agricultural', 'non_agricultural', 'dharanadhikar'],
    default: 'agricultural' // शेती/बिनशेती/धारणाधिकार
  },
  agricultural_type: {
    type: String,
    trim: true // शेती प्रकार
  },
  agricultural_classification: {
    type: String,
    trim: true // शेती वर्ग-1
  },
  
  // 11-14. Rate and Market Value Calculations
  approved_rate_per_hectare: {
    type: Number,
    required: true // मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये
  },
  market_value_acquired_area: {
    type: Number,
    required: true // संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू
  },
  section_26_2_factor: {
    type: Number,
    default: 1 // कलम 26 (2) नुसार गावास लागु असलेले गणक Factor
  },
  section_26_compensation: {
    type: Number,
    required: true // कलम 26 नुसार जमिनीचा मोबदला
  },
  
  // 15-23. Structure Compensation (Buildings, Trees, Wells)
  buildings_count: {
    type: Number,
    default: 0 // बांधकामे संख्या
  },
  buildings_amount: {
    type: Number,
    default: 0 // बांधकामे रक्कम रुपये
  },
  forest_trees_count: {
    type: Number,
    default: 0 // वनझाडे झाडांची संख्या
  },
  forest_trees_amount: {
    type: Number,
    default: 0 // वनझाडे झाडांची रक्कम रु.
  },
  fruit_trees_count: {
    type: Number,
    default: 0 // फळझाडे झाडांची संख्या
  },
  fruit_trees_amount: {
    type: Number,
    default: 0 // फळझाडे झाडांची रक्कम रु.
  },
  wells_borewells_count: {
    type: Number,
    default: 0 // विहिरी/बोअरवेल संख्या
  },
  wells_borewells_amount: {
    type: Number,
    default: 0 // विहिरी/बोअरवेल रक्कम रुपये
  },
  total_structures_amount: {
    type: Number,
    default: 0 // एकुण रक्कम रुपये (16+18+20+22)
  },
  
  // Structure Compensation Details
  structures: [{
    type: {
      type: String,
      enum: ['building', 'shed', 'compound_wall', 'other'],
      required: true
    },
    count: {
      type: Number,
      required: true
    },
    area: {
      type: Number // sq ft or sq m
    },
    construction_type: {
      type: String,
      enum: ['pucca', 'semi_pucca', 'kutcha']
    },
    condition: {
      type: String,
      enum: ['good', 'average', 'poor']
    },
    value: {
      type: Number,
      required: true
    }
  }],
  total_structures_amount: {
    type: Number,
    default: 0
  },
  
  // Parikshit 16 Structure Fields (direct amounts)
  buildings_amount: {
    type: Number,
    default: 0 // बांधकामे रक्कम
  },
  trees_amount: {
    type: Number,
    default: 0 // झाडे रक्कम
  },
  wells_amount: {
    type: Number,
    default: 0 // विहिरी रक्कम
  },
  
  // Tree Compensation Details
  trees: [{
    type: {
      type: String,
      enum: ['forest_tree', 'fruit_tree', 'timber_tree', 'other'],
      required: true
    },
    species: {
      type: String,
      trim: true
    },
    count: {
      type: Number,
      required: true
    },
    age_years: {
      type: Number
    },
    girth_inches: {
      type: Number
    },
    height_feet: {
      type: Number
    },
    value_per_tree: {
      type: Number,
      required: true
    },
    total_value: {
      type: Number,
      required: true
    }
  }],
  total_trees_amount: {
    type: Number,
    default: 0
  },
  
  // Well Compensation Details
  wells: [{
    type: {
      type: String,
      enum: ['bore_well', 'open_well', 'tube_well'],
      required: true
    },
    depth_feet: {
      type: Number,
      required: true
    },
    diameter_feet: {
      type: Number
    },
    construction_type: {
      type: String,
      enum: ['concrete', 'stone', 'brick', 'other']
    },
    water_availability: {
      type: String,
      enum: ['perennial', 'seasonal', 'dry']
    },
    pump_details: {
      type: String,
      trim: true
    },
    value: {
      type: Number,
      required: true
    }
  }],
  total_wells_amount: {
    type: Number,
    default: 0
  },
  
  // 24-30. Final Compensation Calculations (EXACT PDF FORMAT)
  total_compensation_amount: {
    type: Number,
    required: true // एकुण रक्कम (14+23)
  },
  solatium_100_percent: {
    type: Number,
    required: true // 100% सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1) RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5
  },
  determined_compensation: {
    type: Number,
    required: true // निर्धारित मोबदला 26 = (24+25)
  },
  additional_25_percent_compensation: {
    type: Number,
    default: 0 // एकूण रक्कमेवर 25% वाढीव मोबदला
  },
  total_final_compensation: {
    type: Number,
    required: true // एकुण मोबदला (26+ 27)
  },
  deduction_amount: {
    type: Number,
    default: 0 // वजावट रक्कम रुपये
  },
  final_payable_amount: {
    type: Number,
    required: true // हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)
  },
  
  // 31. Remarks
  remarks: {
    type: String,
    trim: true // शेरा
  },
  
  // Contact Information
  contact_details: {
    phone: String,
    email: String,
    address: String
  },
  
  // Banking Information
  bank_details: {
    account_number: String,
    ifsc_code: String,
    bank_name: String,
    branch_name: String,
    account_holder_name: String
  },
  
  // Parikshit 16 Banking Fields (direct mapping)
  bank_account_number: {
    type: String,
    trim: true // बँक खाते क्रमांक
  },
  bank_ifsc_code: {
    type: String,
    trim: true // IFSC कोड
  },
  
  // Tribal Information
  is_tribal: {
    type: Boolean,
    default: false
  },
  tribal_certificate_no: {
    type: String,
    trim: true
  },
  tribal_lag: {
    type: String,
    trim: true
  },
  
  // Measurement Details
  measurement_date: {
    type: Date,
    required: true
  },
  measured_by: {
    type: String,
    trim: true
  },
  measurement_method: {
    type: String,
    enum: ['gps', 'chain_survey', 'total_station', 'other'],
    default: 'gps'
  },
  
  // JMR Status
  status: {
    type: String,
    enum: ['draft', 'under_review', 'approved', 'rejected', 'revision_required'],
    default: 'draft'
  },
  
  // Approval Workflow
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewed_at: Date,
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: Date,
  rejection_reason: String,
  revision_notes: String,
  
  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['measurement_sketch', 'photo', 'survey_settlement', 'other']
    },
    url: String,
    uploaded_at: Date,
    uploaded_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Excel Import Metadata
  excel_import_metadata: {
    source_file_name: String,
    import_date: Date,
    row_number: Number,
    header_extracted_from_row: {
      type: Number,
      default: 7 // Row 7 contains header info
    },
    data_format: {
      type: String,
      enum: ['parishisht-k', 'parikshit-16', 'legacy'],
      default: 'parishisht-k'
    },
    validation_errors: [String]
  },
  
  // Additional Notes
  remarks: {
    type: String,
    trim: true
  },
  special_conditions: {
    type: String,
    trim: true
  },
  
  // Blockchain Integration
  blockchain_verified: {
    type: Boolean,
    default: false
  },
  blockchain_hash: String,
  blockchain_timestamp: Date,
  
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
enhancedJMRRecordSchema.index({ survey_number: 1 });
enhancedJMRRecordSchema.index({ project_id: 1 });
enhancedJMRRecordSchema.index({ officer_id: 1 });
enhancedJMRRecordSchema.index({ village_name: 1, taluka_name: 1, district_name: 1 });
enhancedJMRRecordSchema.index({ landowner_name: 1 });
enhancedJMRRecordSchema.index({ status: 1 });
enhancedJMRRecordSchema.index({ measurement_date: 1 });
enhancedJMRRecordSchema.index({ is_tribal: 1 });

// Virtual for total compensation calculation
enhancedJMRRecordSchema.virtual('calculated_total_compensation').get(function() {
  return this.section_26_compensation + this.total_structures_amount + this.total_trees_amount + this.total_wells_amount;
});

// Pre-save middleware to calculate totals
enhancedJMRRecordSchema.pre('save', function(next) {
  // Handle Parikshit 16 format calculations
  if (this.data_format === 'parikshit-16') {
    // For Parikshit 16 format, use the direct fields
    this.total_structures_amount = (this.buildings_amount || 0) + (this.trees_amount || 0) + (this.wells_amount || 0);
    
    // Map banking details
    if (this.bank_account_number && this.bank_ifsc_code) {
      this.bank_details = {
        account_number: this.bank_account_number,
        ifsc_code: this.bank_ifsc_code,
        bank_name: this.bank_details?.bank_name || '',
        branch_name: this.bank_details?.branch_name || '',
        account_holder_name: this.bank_details?.account_holder_name || this.landowner_name
      };
    }
  } else {
    // For Parishisht-K format, use the detailed structure calculations
    // Calculate structure totals
    this.total_structures_amount = this.structures.reduce((sum, structure) => sum + structure.value, 0);
    
    // Calculate tree totals
    this.total_trees_amount = this.trees.reduce((sum, tree) => sum + tree.total_value, 0);
    
    // Calculate well totals
    this.total_wells_amount = this.wells.reduce((sum, well) => sum + well.value, 0);
  }
  
  // Calculate total compensation
  this.total_compensation_amount = this.section_26_compensation + this.total_structures_amount + this.total_trees_amount + this.total_wells_amount;
  
  // Calculate final amounts
  this.determined_compensation = this.total_compensation_amount + this.solatium_100_percent;
  this.total_final_compensation = this.determined_compensation + this.additional_25_percent_compensation;
  this.final_payable_amount = this.total_final_compensation - this.deduction_amount;
  
  next();
});

export default mongoose.model('EnhancedJMRRecord', enhancedJMRRecordSchema);
