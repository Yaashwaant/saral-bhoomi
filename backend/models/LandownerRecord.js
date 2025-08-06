import mongoose from 'mongoose';

const landownerRecordSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Please specify the project']
  },
  // Parishisht-K fields (in Marathi)
  खातेदाराचे_नांव: {
    type: String,
    required: [true, 'Please add landowner name'],
    trim: true
  },
  सर्वे_नं: {
    type: String,
    required: [true, 'Please add survey number'],
    trim: true
  },
  क्षेत्र: {
    type: String,
    required: [true, 'Please add area'],
    trim: true
  },
  संपादित_क्षेत्र: {
    type: String,
    required: [true, 'Please add acquired area'],
    trim: true
  },
  दर: {
    type: String,
    required: [true, 'Please add rate'],
    trim: true
  },
  संरचना_झाडे_विहिरी_रक्कम: {
    type: String,
    default: '0',
    trim: true
  },
  एकूण_मोबदला: {
    type: String,
    required: [true, 'Please add total compensation'],
    trim: true
  },
  सोलेशियम_100: {
    type: String,
    required: [true, 'Please add solatium amount'],
    trim: true
  },
  अंतिम_रक्कम: {
    type: String,
    required: [true, 'Please add final amount'],
    trim: true
  },
  // Location fields
  village: {
    type: String,
    required: [true, 'Please add village name'],
    trim: true
  },
  taluka: {
    type: String,
    required: [true, 'Please add taluka name'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'Please add district name'],
    trim: true
  },
  // Additional fields for tracking
  noticeGenerated: {
    type: Boolean,
    default: false
  },
  noticeNumber: {
    type: String,
    trim: true
  },
  noticeDate: {
    type: Date
  },
  noticeContent: {
    type: String,
    trim: true
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'approved', 'rejected'],
    default: 'pending'
  },
  kycCompletedAt: {
    type: Date
  },
  kycCompletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'initiated', 'success', 'failed'],
    default: 'pending'
  },
  paymentInitiatedAt: {
    type: Date
  },
  paymentCompletedAt: {
    type: Date
  },
  bankReference: {
    type: String,
    trim: true
  },
  assignedAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  // Contact information
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  // Bank details for payment
  bankDetails: {
    accountNumber: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    branchName: {
      type: String,
      trim: true
    },
    accountHolderName: {
      type: String,
      trim: true
    }
  },
  // Documents uploaded
  documents: [{
    type: {
      type: String,
      enum: ['aadhaar', 'pan', 'voter_id', '7_12_extract', 'power_of_attorney', 'bank_passbook', 'photo', 'other'],
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  // Notes and remarks
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  // Status tracking
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who created this record']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
landownerRecordSchema.index({ projectId: 1 });
landownerRecordSchema.index({ सर्वे_नं: 1 });
landownerRecordSchema.index({ village: 1 });
landownerRecordSchema.index({ taluka: 1 });
landownerRecordSchema.index({ district: 1 });
landownerRecordSchema.index({ kycStatus: 1 });
landownerRecordSchema.index({ paymentStatus: 1 });
landownerRecordSchema.index({ assignedAgent: 1 });
landownerRecordSchema.index({ noticeGenerated: 1 });

// Virtual for compensation amount as number
landownerRecordSchema.virtual('compensationAmount').get(function() {
  return parseFloat(this.अंतिम_रक्कम) || 0;
});

// Virtual for area as number
landownerRecordSchema.virtual('areaInHectares').get(function() {
  return parseFloat(this.क्षेत्र) || 0;
});

// Virtual for acquired area as number
landownerRecordSchema.virtual('acquiredAreaInHectares').get(function() {
  return parseFloat(this.संपादित_क्षेत्र) || 0;
});

// Ensure virtual fields are serialized
landownerRecordSchema.set('toJSON', { virtuals: true });
landownerRecordSchema.set('toObject', { virtuals: true });

export default mongoose.model('LandownerRecord', landownerRecordSchema); 