import mongoose from 'mongoose';

const jmrRecordSchema = new mongoose.Schema({
  survey_number: {
    type: String,
    required: true
  },
  owner_id: {
    type: String,
    required: false
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  officer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  measurement_date: {
    type: Date,
    required: false
  },
  measured_area: {
    type: Number,
    required: false
  },
  land_type: {
    type: String,
    required: false,
    enum: ['agricultural', 'residential', 'commercial', 'industrial', 'forest', 'other']
  },
  tribal_classification: {
    type: String,
    required: false,
    enum: ['tribal', 'non-tribal']
  },
  village: {
    type: String,
    required: false
  },
  taluka: {
    type: String,
    required: false
  },
  district: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: false,
    enum: ['general', 'sc', 'st', 'obc', 'other']
  },
  structure_details: [{
    type: String,
    description: String,
    area: Number,
    value: Number
  }],
  tree_details: [{
    type: String,
    count: Number,
    age: Number,
    value: Number
  }],
  well_details: [{
    depth: Number,
    diameter: Number,
    construction_type: String,
    value: Number
  }],
  total_structure_value: Number,
  total_tree_value: Number,
  total_well_value: Number,
  remarks: String,
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: Date,
  rejection_reason: String,
  documents: [{
    name: String,
    url: String,
    type: String,
    uploaded_at: Date
  }],
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
jmrRecordSchema.index({ survey_number: 1 });
jmrRecordSchema.index({ project_id: 1 });
jmrRecordSchema.index({ officer_id: 1 });
jmrRecordSchema.index({ measurement_date: 1 });
jmrRecordSchema.index({ status: 1 });
jmrRecordSchema.index({ village: 1 });
jmrRecordSchema.index({ taluka: 1 });
jmrRecordSchema.index({ district: 1 });

export default mongoose.model('JMRRecord', jmrRecordSchema);
