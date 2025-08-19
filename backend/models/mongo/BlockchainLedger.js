import mongoose from 'mongoose';

const blockchainLedgerSchema = new mongoose.Schema({
  block_id: {
    type: String,
    required: true,
    unique: true
  },
  survey_number: {
    type: String,
    required: true,
    index: true
  },
  event_type: {
    type: String,
    required: true,
    enum: [
      'JMR_MEASUREMENT_UPLOADED',
      'JMR_MEASUREMENT_UPDATED', 
      'JMR_MEASUREMENT_DELETED',
      'LANDOWNER_RECORD_CREATED',
      'LANDOWNER_RECORD_UPDATED',
      'LANDOWNER_RECORD_DELETED',
      'SURVEY_CREATED_ON_BLOCKCHAIN',
      'LAND_RECORD_CREATED',
      'LAND_RECORD_UPDATED',
      'LAND_RECORD_DELETED'
    ]
  },
  officer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  remarks: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  previous_hash: {
    type: String,
    required: true,
    default: '0x0000000000000000000000000000000000000000000000000000000000000000'
  },
  current_hash: {
    type: String,
    required: true
  },
  nonce: {
    type: Number,
    required: true,
    default: 0
  },
  is_valid: {
    type: Boolean,
    default: true
  },
  // Legacy fields for backward compatibility
  transaction_type: {
    type: String,
    required: false,
    enum: ['jmr_creation', 'award_publication', 'notice_issuance', 'payment_processing', 'status_update']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  difficulty: {
    type: Number,
    required: false,
    default: 4
  },
  validation_errors: [String],
  mined_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mined_at: Date,
  block_status: {
    type: String,
    enum: ['pending', 'mined', 'validated', 'invalid'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
blockchainLedgerSchema.index({ block_id: 1 });
blockchainLedgerSchema.index({ survey_number: 1 });
blockchainLedgerSchema.index({ event_type: 1 });
blockchainLedgerSchema.index({ officer_id: 1 });
blockchainLedgerSchema.index({ project_id: 1 });
blockchainLedgerSchema.index({ timestamp: 1 });
blockchainLedgerSchema.index({ current_hash: 1 });

// Method to calculate hash
blockchainLedgerSchema.methods.calculateHash = function() {
  const dataString = JSON.stringify({
    block_id: this.block_id,
    survey_number: this.survey_number,
    event_type: this.event_type,
    officer_id: this.officer_id.toString(),
    project_id: this.project_id ? this.project_id.toString() : '',
    metadata: this.metadata,
    remarks: this.remarks,
    timestamp: this.timestamp,
    previous_hash: this.previous_hash,
    nonce: this.nonce
  });
  
  // Use crypto module for proper hashing
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

export default mongoose.model('BlockchainLedger', blockchainLedgerSchema);
