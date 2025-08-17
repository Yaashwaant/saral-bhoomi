import mongoose from 'mongoose';

const awardSchema = new mongoose.Schema({
  survey_number: {
    type: String,
    required: true,
    index: true
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
  award_date: {
    type: Date,
    required: false
  },
  award_number: {
    type: String,
    required: false,
    unique: false
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
  category: {
    type: String,
    required: false,
    enum: ['general', 'sc', 'st', 'obc', 'other']
  },
  base_amount: {
    type: Number,
    required: false
  },
  solatium_amount: {
    type: Number,
    required: false
  },
  interest_amount: Number,
  total_amount: {
    type: Number,
    required: false
  },
  award_status: {
    type: String,
    enum: ['draft', 'published', 'challenged', 'final'],
    default: 'draft'
  },
  challenge_details: {
    filed_by: String,
    filed_date: Date,
    reason: String,
    status: String
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploaded_at: Date
  }],
  remarks: String,
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
awardSchema.index({ survey_number: 1 });
awardSchema.index({ project_id: 1 });
awardSchema.index({ officer_id: 1 });
awardSchema.index({ award_date: 1 });
awardSchema.index({ award_status: 1 });

export default mongoose.model('Award', awardSchema);
