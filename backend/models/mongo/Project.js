import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  pmisCode: {
    type: String,
    required: false,
    trim: true
  },
  schemeName: {
    type: String,
    required: true
  },
  landRequired: {
    type: Number,
    required: true
  },
  landAvailable: {
    type: Number,
    required: true
  },
  landToBeAcquired: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['road', 'railway', 'irrigation', 'industrial', 'residential', 'other', 'greenfield', 'brownfield']
  },
  district: {
    type: String,
    required: false
  },
  taluka: {
    type: String,
    required: false
  },
  villages: [{
    type: String,
    required: false
  }],
  estimatedCost: {
    type: Number,
    required: false
  },
  allocatedBudget: {
    type: Number,
    required: false
  },
  currency: {
    type: String,
    required: false
  },
  startDate: {
    type: Date,
    required: false
  },
  expectedCompletion: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'on-hold', 'cancelled'],
    default: 'planning'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  description: String,
  descriptionDetails: {
    billPassedDate: { type: Date },
    ministry: { type: String, trim: true },
    applicableLaws: [{ type: String, trim: true }],
    projectAim: { type: String }
  },
  videoUrl: { type: String, trim: true },
  stakeholders: [{ type: String, trim: true }],
  isActive: { type: Boolean, default: true },
  assignedOfficers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedAgents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  documents: [{
    name: String,
    url: String,
    type: String,
    uploaded_at: Date
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ projectName: 1 });
projectSchema.index({ pmisCode: 1 });
projectSchema.index({ district: 1, taluka: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdBy: 1 });

export default mongoose.model('Project', projectSchema);
