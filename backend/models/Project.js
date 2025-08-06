import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true,
    maxlength: [200, 'Project name cannot be more than 200 characters']
  },
  pmisCode: {
    type: String,
    required: [true, 'Please add a PMIS code'],
    trim: true
  },
  schemeName: {
    type: String,
    required: [true, 'Please add a scheme name'],
    trim: true
  },
  landRequired: {
    type: Number,
    required: [true, 'Please add land required in hectares'],
    min: [0, 'Land required cannot be negative']
  },
  landAvailable: {
    type: Number,
    required: [true, 'Please add land available in hectares'],
    min: [0, 'Land available cannot be negative']
  },
  landToBeAcquired: {
    type: Number,
    required: [true, 'Please add land to be acquired in hectares'],
    min: [0, 'Land to be acquired cannot be negative']
  },
  type: {
    type: String,
    enum: ['greenfield', 'brownfield'],
    required: [true, 'Please specify project type']
  },
  indexMap: {
    type: String, // File path
    required: false
  },
  videoUrl: {
    type: String,
    required: false
  },
  status: {
    stage3A: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    stage3D: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    corrigendum: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    award: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  location: {
    district: {
      type: String,
      required: [true, 'Please add district']
    },
    taluka: {
      type: String,
      required: [true, 'Please add taluka']
    },
    villages: [{
      type: String,
      required: [true, 'Please add at least one village']
    }]
  },
  budget: {
    estimatedCost: {
      type: Number,
      required: [true, 'Please add estimated cost']
    },
    allocatedBudget: {
      type: Number,
      required: [true, 'Please add allocated budget']
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  timeline: {
    startDate: {
      type: Date,
      required: [true, 'Please add start date']
    },
    expectedCompletion: {
      type: Date,
      required: [true, 'Please add expected completion date']
    },
    actualCompletion: {
      type: Date
    }
  },
  stakeholders: [{
    name: String,
    role: String,
    contact: String,
    email: String
  }],
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who created this project']
  },
  assignedOfficers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedAgents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Index for better query performance
projectSchema.index({ pmisCode: 1 }, { unique: true });
projectSchema.index({ 'location.district': 1 });
projectSchema.index({ 'location.taluka': 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ isActive: 1 });

// Virtual for progress calculation
projectSchema.virtual('progress').get(function() {
  const totalStages = 4; // stage3A, stage3D, corrigendum, award
  const completedStages = Object.values(this.status).filter(stage => stage === 'approved').length;
  return Math.round((completedStages / totalStages) * 100);
});

// Virtual for land acquisition progress
projectSchema.virtual('acquisitionProgress').get(function() {
  if (this.landRequired === 0) return 0;
  return Math.round(((this.landAvailable / this.landRequired) * 100));
});

// Ensure virtual fields are serialized
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

export default mongoose.model('Project', projectSchema); 