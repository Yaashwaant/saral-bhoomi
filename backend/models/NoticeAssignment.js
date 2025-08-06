import mongoose from 'mongoose';

const noticeAssignmentSchema = new mongoose.Schema({
  landownerId: {
    type: String, // Use String for frontend IDs
    required: true
  },
  surveyNumber: {
    type: String,
    required: true
  },
  noticeNumber: {
    type: String,
    required: true
  },
  noticeDate: {
    type: Date,
    required: true
  },
  noticeContent: {
    type: String,
    required: true
  },
  noticePdfUrl: {
    type: String,
    required: true
  },
  assignedAgent: {
    type: String, // Use String for frontend IDs
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'approved', 'rejected'],
    default: 'pending'
  },
  documentsUploaded: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  landownerName: {
    type: String,
    required: true
  },
  village: {
    type: String,
    required: true
  },
  taluka: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },
  compensationAmount: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
noticeAssignmentSchema.index({ assignedAgent: 1, kycStatus: 1 });
noticeAssignmentSchema.index({ landownerId: 1 });

export default mongoose.model('NoticeAssignment', noticeAssignmentSchema); 