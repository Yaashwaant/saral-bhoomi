import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectNumber: {
    type: String,
    unique: true,
    required: true
  },
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
  // Status subdocument to reflect multi-stage lifecycle
  status: {
    overall: { type: String, enum: ['planning', 'active', 'completed', 'on-hold', 'cancelled'], default: 'planning' },
    stage3A: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    stage3D: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    corrigendum: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    award: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  description: String,
  descriptionDetails: {
    // Keeping billPassedDate optional for backward compatibility
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

// Create indexes
projectSchema.index({ projectName: 1 });
projectSchema.index({ district: 1, taluka: 1 });
projectSchema.index({ 'status.overall': 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ projectNumber: 1 }, { unique: true });

// Pre-save hook to generate projectNumber
projectSchema.pre('validate', async function(next) {
  if (this.isNew && !this.projectNumber) {
    try {
      // Find the highest existing project number
      const lastProject = await this.constructor.findOne(
        { projectNumber: { $regex: /^PRJ-\d+$/ } },
        { projectNumber: 1 }
      ).sort({ projectNumber: -1 });

      let nextNumber = 1;
      if (lastProject && lastProject.projectNumber) {
        const match = lastProject.projectNumber.match(/^PRJ-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      this.projectNumber = `PRJ-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model('Project', projectSchema);
