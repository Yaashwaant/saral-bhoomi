import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'suspended'],
    default: 'planning'
  },
  start_date: {
    type: Date
  },
  estimated_end_date: {
    type: Date
  },
  actual_end_date: {
    type: Date
  },
  budget: {
    type: Number,
    default: 0
  },
  total_land_area: {
    type: Number,
    default: 0
  },
  total_compensation: {
    type: Number,
    default: 0
  },
  total_landowners: {
    type: Number,
    default: 0
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assigned_officers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  documents: [{
    type: String
  }],
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
projectSchema.index({ name: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ is_active: 1 });

export default mongoose.model('Project', projectSchema);