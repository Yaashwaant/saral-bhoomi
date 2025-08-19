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
      // JMR Events
      'JMR_MEASUREMENT_UPLOADED',
      'JMR_MEASUREMENT_UPDATED', 
      'JMR_MEASUREMENT_DELETED',
      
      // Landowner Events
      'LANDOWNER_RECORD_CREATED',
      'LANDOWNER_RECORD_UPDATED',
      'LANDOWNER_RECORD_DELETED',
      
      // Survey Events
      'SURVEY_CREATED_ON_BLOCKCHAIN',
      'LAND_RECORD_CREATED',
      'LAND_RECORD_UPDATED',
      'LAND_RECORD_DELETED',
      
      // Notice Events
      'NOTICE_GENERATED',
      'NOTICE_UPDATED',
      'NOTICE_DELETED',
      'NOTICE_ISSUED',
      
      // Payment Events
      'PAYMENT_PROCESSED',
      'PAYMENT_VERIFIED',
      'PAYMENT_FAILED',
      
      // Award Events
      'AWARD_PUBLISHED',
      'AWARD_UPDATED',
      'AWARD_DELETED',
      
      // Status Events
      'STATUS_CHANGED',
      'STATUS_UPDATED',
      
      // Document Events
      'DOCUMENT_UPLOADED',
      'DOCUMENT_VERIFIED',
      'DOCUMENT_REJECTED',
      
      // Integrity Events
      'INTEGRITY_CHECKED',
      'INTEGRITY_VERIFIED',
      'INTEGRITY_COMPROMISED',
      
      // Sync Events
      'SYNC_COMPLETED',
      'SYNC_FAILED',
      'SYNC_STARTED',
      
      // General Events
      'RECORD_CREATED',
      'RECORD_UPDATED',
      'RECORD_DELETED',
      'RECORD_VERIFIED'
    ]
  },
  officer_id: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
    required: true,
    validate: {
      validator: function(v) {
        // Allow ObjectId, valid ObjectId string, or demo strings
        if (mongoose.Types.ObjectId.isValid(v)) return true;
        if (typeof v === 'string' && v.startsWith('demo-')) return true;
        if (typeof v === 'string' && v.length === 24) return true;
        return false;
      },
      message: 'Officer ID must be a valid ObjectId or demo identifier'
    }
  },
  project_id: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
    required: false,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        if (mongoose.Types.ObjectId.isValid(v)) return true;
        if (typeof v === 'string' && v.startsWith('demo-')) return true;
        if (typeof v === 'string' && v.length === 24) return true;
        return false;
      },
      message: 'Project ID must be a valid ObjectId or demo identifier'
    }
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
    type: mongoose.Schema.Types.Mixed,
    ref: 'User',
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        if (mongoose.Types.ObjectId.isValid(v)) return true;
        if (typeof v === 'string' && v.startsWith('demo-')) return true;
        return false;
      },
      message: 'Mined by must be a valid ObjectId or demo identifier'
    }
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
    officer_id: this.officer_id,
    project_id: this.project_id,
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

// Pre-save middleware to generate hash if not provided
blockchainLedgerSchema.pre('save', function(next) {
  if (!this.current_hash) {
    this.current_hash = this.calculateHash();
  }
  next();
});

// Static method to find by survey number
blockchainLedgerSchema.statics.findBySurveyNumber = function(surveyNumber) {
  return this.find({ survey_number: surveyNumber }).sort({ timestamp: -1 });
};

// Static method to find by event type
blockchainLedgerSchema.statics.findByEventType = function(eventType) {
  return this.find({ event_type: eventType }).sort({ timestamp: -1 });
};

// Static method to find by officer
blockchainLedgerSchema.statics.findByOfficer = function(officerId) {
  return this.find({ officer_id: officerId }).sort({ timestamp: -1 });
};

// Static method to get latest block for a survey
blockchainLedgerSchema.statics.getLatestBlock = function(surveyNumber) {
  return this.findOne({ survey_number: surveyNumber }).sort({ timestamp: -1 });
};

// Static method to verify chain integrity
blockchainLedgerSchema.statics.verifyChainIntegrity = function(surveyNumber) {
  return this.find({ survey_number: surveyNumber }).sort({ timestamp: 1 }).then(blocks => {
    if (blocks.length === 0) return { isValid: false, reason: 'No blocks found' };
    
    for (let i = 1; i < blocks.length; i++) {
      if (blocks[i].previous_hash !== blocks[i-1].current_hash) {
        return { isValid: false, reason: 'Hash mismatch', blockIndex: i };
      }
    }
    
    return { isValid: true, reason: 'Chain integrity verified' };
  });
};

export default mongoose.model('BlockchainLedger', blockchainLedgerSchema);
