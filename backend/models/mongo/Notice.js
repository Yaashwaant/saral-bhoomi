import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
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
  notice_type: {
    type: String,
    required: false,
    enum: ['acquisition', 'possession', 'eviction', 'other']
  },
  notice_date: {
    type: Date,
    required: false
  },
  notice_number: {
    type: String,
    required: false,
    unique: false
  },
  amount: {
    type: Number,
    required: false
  },
  land_type: {
    type: String,
    required: false,
    enum: ['agricultural', 'residential', 'commercial', 'industrial', 'forest', 'other']
  },
  notice_content: {
    type: String,
    required: false
  },
  delivery_method: {
    type: String,
    enum: ['hand_delivery', 'registered_post', 'public_notice', 'other'],
    default: 'hand_delivery'
  },
  delivery_date: Date,
  delivery_status: {
    type: String,
    enum: ['pending', 'delivered', 'refused', 'returned'],
    default: 'pending'
  },
  delivery_proof: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  response_received: {
    type: Boolean,
    default: false
  },
  response_date: Date,
  response_content: String,
  notice_status: {
    type: String,
    enum: ['draft', 'issued', 'delivered', 'responded', 'expired'],
    default: 'draft'
  },
  expiry_date: Date,
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
noticeSchema.index({ survey_number: 1 });
noticeSchema.index({ project_id: 1 });
noticeSchema.index({ officer_id: 1 });
noticeSchema.index({ notice_date: 1 });
noticeSchema.index({ notice_status: 1 });
noticeSchema.index({ delivery_status: 1 });

export default mongoose.model('Notice', noticeSchema);
