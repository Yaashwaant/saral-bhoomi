import mongoose from 'mongoose';

const blockchainLedgerSchema = new mongoose.Schema({
  block_id: {
    type: String,
    required: true,
    unique: true
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
  transaction_type: {
    type: String,
    required: true,
    enum: ['jmr_creation', 'award_publication', 'notice_issuance', 'payment_processing', 'status_update']
  },
  survey_number: {
    type: String,
    required: false,
    index: true
  },
  previous_hash: {
    type: String,
    required: false
  },
  current_hash: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    required: false,
    default: Date.now
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  nonce: {
    type: Number,
    required: false
  },
  difficulty: {
    type: Number,
    required: true,
    default: 4
  },
  is_valid: {
    type: Boolean,
    default: true
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
blockchainLedgerSchema.index({ project_id: 1 });
blockchainLedgerSchema.index({ officer_id: 1 });
blockchainLedgerSchema.index({ survey_number: 1 });
blockchainLedgerSchema.index({ timestamp: 1 });
blockchainLedgerSchema.index({ transaction_type: 1 });
blockchainLedgerSchema.index({ block_status: 1 });

// Method to calculate hash
blockchainLedgerSchema.methods.calculateHash = function() {
  const dataString = JSON.stringify({
    block_id: this.block_id,
    project_id: this.project_id.toString(),
    officer_id: this.officer_id.toString(),
    transaction_type: this.transaction_type,
    survey_number: this.survey_number,
    previous_hash: this.previous_hash,
    timestamp: this.timestamp,
    data: this.data,
    nonce: this.nonce
  });
  
  // Simple hash function (in production, use crypto-js or similar)
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
};

export default mongoose.model('BlockchainLedger', blockchainLedgerSchema);
