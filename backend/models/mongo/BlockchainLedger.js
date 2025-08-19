import mongoose from 'mongoose';
import crypto from 'crypto';

const blockchainLedgerSchema = new mongoose.Schema({
  block_id: {
    type: String,
    required: true,
    unique: true
  },
  survey_number: {
    type: String,
    required: true
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
  },
  
  // NEW: Complete survey data structure
  survey_data: {
    jmr: {
      data: mongoose.Schema.Types.Mixed,
      hash: String,
      last_updated: Date,
      status: {
        type: String,
        enum: ['not_created', 'created', 'updated', 'deleted'],
        default: 'not_created'
      }
    },
    landowner: {
      data: mongoose.Schema.Types.Mixed,
      hash: String,
      last_updated: Date,
      status: {
        type: String,
        enum: ['not_created', 'created', 'updated', 'deleted'],
        default: 'not_created'
      }
    },
    notice: {
      data: mongoose.Schema.Types.Mixed,
      hash: String,
      last_updated: Date,
      status: {
        type: String,
        enum: ['not_created', 'created', 'updated', 'deleted'],
        default: 'not_created'
      }
    },
    payment: {
      data: mongoose.Schema.Types.Mixed,
      hash: String,
      last_updated: Date,
      status: {
        type: String,
        enum: ['not_created', 'created', 'updated', 'deleted'],
        default: 'not_created'
      }
    },
    award: {
      data: mongoose.Schema.Types.Mixed,
      hash: String,
      last_updated: Date,
      status: {
        type: String,
        enum: ['not_created', 'created', 'updated', 'deleted'],
        default: 'not_created'
      }
    }
  },
  
  // NEW: Timeline history for audit trail
  timeline_history: [{
    action: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    officer_id: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    data_hash: {
      type: String,
      required: true
    },
    previous_hash: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    remarks: {
      type: String,
      required: false
    }
  }]
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
  try {
    const dataString = JSON.stringify({
      block_id: this.block_id,
      survey_number: this.survey_number,
      event_type: this.event_type,
      officer_id: this.officer_id,
      project_id: this.project_id,
      survey_data: this.survey_data,
      timeline_history: this.timeline_history,
      metadata: this.metadata,
      remarks: this.remarks,
      timestamp: this.timestamp,
      previous_hash: this.previous_hash,
      nonce: this.nonce
    });
    
    // Use crypto module for proper hashing
    return crypto.createHash('sha256').update(dataString).digest('hex');
  } catch (error) {
    console.error('❌ Error in calculateHash:', error);
    console.error('❌ Data that failed to serialize:', {
      block_id: this.block_id,
      survey_number: this.survey_number,
      event_type: this.event_type,
      officer_id: this.officer_id,
      project_id: this.project_id,
      survey_data: this.survey_data,
      timeline_history: this.timeline_history,
      metadata: this.metadata,
      remarks: this.remarks,
      timestamp: this.timestamp,
      previous_hash: this.previous_hash,
      nonce: this.nonce
    });
    throw new Error(`Failed to calculate hash: ${error.message}`);
  }
};

// NEW: Method to generate hash for a specific data section
blockchainLedgerSchema.methods.generateDataSectionHash = function(sectionName) {
  if (!this.survey_data || !this.survey_data[sectionName]) {
    return null;
  }
  
  const sectionData = this.survey_data[sectionName].data;
  if (!sectionData) return null;
  
  return crypto.createHash('sha256').update(JSON.stringify(sectionData)).digest('hex');
};

// NEW: Method to add timeline entry
blockchainLedgerSchema.methods.addTimelineEntry = function(action, officerId, dataHash, previousHash, metadata = {}, remarks = '') {
  if (!this.timeline_history) {
    this.timeline_history = [];
  }
  
  this.timeline_history.push({
    action,
    timestamp: new Date(),
    officer_id: officerId,
    data_hash: dataHash,
    previous_hash: previousHash,
    metadata,
    remarks
  });
};

// NEW: Method to update survey data section
blockchainLedgerSchema.methods.updateSurveyDataSection = function(sectionName, data, status) {
  if (!this.survey_data) {
    this.survey_data = {};
  }
  
  if (!this.survey_data[sectionName]) {
    this.survey_data[sectionName] = {
      data: null,
      hash: null,
      last_updated: null,
      status: 'not_created'
    };
  }
  
  this.survey_data[sectionName].data = data;
  this.survey_data[sectionName].status = status;
  this.survey_data[sectionName].last_updated = new Date();
  
  // Generate hash for the section data
  if (data) {
    this.survey_data[sectionName].hash = this.generateDataSectionHash(sectionName);
  }
};

// Pre-save middleware to generate hash if not provided
blockchainLedgerSchema.pre('save', function(next) {
  try {
    console.log('🔧 Pre-save middleware running for:', this.survey_number);
    console.log('🔧 Current hash before middleware:', this.current_hash);
    
    if (!this.current_hash) {
      console.log('🔧 Generating hash via middleware...');
      this.current_hash = this.calculateHash();
      console.log('🔧 Hash generated via middleware:', this.current_hash);
    } else {
      console.log('🔧 Hash already exists, skipping generation');
    }
    
    next();
  } catch (error) {
    console.error('❌ Pre-save middleware error:', error);
    next(error);
  }
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

// NEW: Static method to get survey timeline
blockchainLedgerSchema.statics.getSurveyTimeline = function(surveyNumber) {
  return this.findOne({ survey_number: surveyNumber })
    .then(block => {
      if (!block || !block.timeline_history) {
        return [];
      }
      return block.timeline_history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    });
};

export default mongoose.model('BlockchainLedger', blockchainLedgerSchema);
