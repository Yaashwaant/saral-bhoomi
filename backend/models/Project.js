import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectNumber: {
    type: String,
    unique: true,
    required: true
  },
  projectName: {
    type: String,
    required: [true, 'Please add a project name'],
    maxlength: [200, 'Project name cannot be more than 200 characters'],
    trim: true
  },
  schemeName: {
    type: String,
    required: [true, 'Please add a scheme name'],
    trim: true
  },
  landRequired: {
    type: Number,
    required: true,
    min: [0, 'Land required cannot be negative']
  },
  landAvailable: {
    type: Number,
    required: true,
    min: [0, 'Land available cannot be negative']
  },
  landToBeAcquired: {
    type: Number,
    required: true,
    min: [0, 'Land to be acquired cannot be negative']
  },
  type: {
    type: String,
    enum: {
      values: ['greenfield', 'brownfield'],
      message: 'Project type must be either greenfield or brownfield'
    },
    required: [true, 'Please specify project type']
  },
  indexMap: {
    type: String // File path
  },
  videoUrl: {
    type: String
  },
  // Status fields
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
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  // Location fields
  district: {
    type: String,
    required: [true, 'Please add district'],
    trim: true
  },
  taluka: {
    type: String,
    required: [true, 'Please add taluka'],
    trim: true
  },
  villages: {
    type: [String],
    required: [true, 'Please add at least one village'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Please add at least one village'
    }
  },
  // Budget fields
  estimatedCost: {
    type: Number,
    required: true,
    min: [0, 'Estimated cost cannot be negative']
  },
  allocatedBudget: {
    type: Number,
    required: true,
    min: [0, 'Allocated budget cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  // Timeline fields
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
  },
  stakeholders: {
    type: [mongoose.Schema.Types.Mixed] // Array of objects
  },
  documents: {
    type: [mongoose.Schema.Types.Mixed] // Array of objects
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedOfficers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User'
  },
  assignedAgents: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create indexes
projectSchema.index({ district: 1 });
projectSchema.index({ taluka: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ isActive: 1 });
projectSchema.index({ projectNumber: 1 }, { unique: true });

// Pre-save hook to generate projectNumber
projectSchema.pre('save', async function(next) {
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

// Instance methods
projectSchema.methods.getProgress = function() {
  const totalStages = 4; // stage3A, stage3D, corrigendum, award
  const completedStages = [this.stage3A, this.stage3D, this.corrigendum, this.award]
    .filter(stage => stage === 'approved').length;
  return Math.round((completedStages / totalStages) * 100);
};

projectSchema.methods.getAcquisitionProgress = function() {
  if (this.landRequired === 0) return 0;
  return Math.round(((this.landAvailable / this.landRequired) * 100));
};

const Project = mongoose.model('Project', projectSchema);

export default Project;