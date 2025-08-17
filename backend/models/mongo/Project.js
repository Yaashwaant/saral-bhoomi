import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
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
    enum: ['road', 'railway', 'irrigation', 'industrial', 'residential', 'other']
  },
  district: {
    type: String,
    required: true
  },
  taluka: {
    type: String,
    required: true
  },
  villages: [{
    type: String,
    required: true
  }],
  estimatedCost: {
    type: Number,
    required: true
  },
  allocatedBudget: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  expectedCompletion: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'on-hold', 'cancelled'],
    default: 'planning'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: String,
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
projectSchema.index({ district: 1, taluka: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdBy: 1 });

export default mongoose.model('Project', projectSchema);
