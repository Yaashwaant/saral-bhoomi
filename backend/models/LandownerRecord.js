import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LandownerRecord = sequelize.define('LandownerRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  // Parishisht-K fields (in Marathi)
  खातेदाराचे_नांव: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add landowner name' }
    }
  },
  सर्वे_नं: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add survey number' }
    }
  },
  क्षेत्र: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add area' }
    }
  },
  संपादित_क्षेत्र: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add acquired area' }
    }
  },
  दर: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add rate' }
    }
  },
  संरचना_झाडे_विहिरी_रक्कम: {
    type: DataTypes.STRING,
    defaultValue: '0'
  },
  एकूण_मोबदला: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add total compensation' }
    }
  },
  सोलेशियम_100: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add solatium amount' }
    }
  },
  अंतिम_रक्कम: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add final amount' }
    }
  },
  // Location fields
  village: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add village name' }
    }
  },
  taluka: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add taluka name' }
    }
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please add district name' }
    }
  },
  // Additional fields for tracking
  noticeGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  noticeNumber: {
    type: DataTypes.STRING
  },
  noticeDate: {
    type: DataTypes.DATE
  },
  noticeContent: {
    type: DataTypes.TEXT
  },
  kycStatus: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  kycCompletedAt: {
    type: DataTypes.DATE
  },
  kycCompletedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'initiated', 'success', 'failed'),
    defaultValue: 'pending'
  },
  paymentInitiatedAt: {
    type: DataTypes.DATE
  },
  paymentCompletedAt: {
    type: DataTypes.DATE
  },
  bankReference: {
    type: DataTypes.STRING
  },
  assignedAgent: {
    type: DataTypes.INTEGER,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedAt: {
    type: DataTypes.DATE
  },
  // Contact information
  contactPhone: {
    type: DataTypes.STRING
  },
  contactEmail: {
    type: DataTypes.STRING
  },
  contactAddress: {
    type: DataTypes.TEXT
  },
  // Bank details for payment
  bankAccountNumber: {
    type: DataTypes.STRING
  },
  bankIfscCode: {
    type: DataTypes.STRING
  },
  bankName: {
    type: DataTypes.STRING
  },
  bankBranchName: {
    type: DataTypes.STRING
  },
  bankAccountHolderName: {
    type: DataTypes.STRING
  },
  // Documents uploaded
  documents: {
    type: DataTypes.JSON // Store as JSON array of objects
  },
  // Notes and remarks
  notes: {
    type: DataTypes.TEXT,
    validate: {
      len: { args: [0, 1000], msg: 'Notes cannot be more than 1000 characters' }
    }
  },
  // Status tracking
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'landowner_records',
  timestamps: true,
  indexes: [
    {
      fields: ['project_id']
    },
    {
      fields: ['सर्वे_नं']
    },
    {
      fields: ['village']
    },
    {
      fields: ['taluka']
    },
    {
      fields: ['district']
    },
    {
      fields: ['kyc_status']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['assigned_agent']
    },
    {
      fields: ['notice_generated']
    }
  ]
});

// Instance methods
LandownerRecord.prototype.getCompensationAmount = function() {
  return parseFloat(this.अंतिम_रक्कम) || 0;
};

LandownerRecord.prototype.getAreaInHectares = function() {
  return parseFloat(this.क्षेत्र) || 0;
};

LandownerRecord.prototype.getAcquiredAreaInHectares = function() {
  return parseFloat(this.संपादित_क्षेत्र) || 0;
};

export default LandownerRecord; 

// Enhance JSON output with English aliases for easier processing
LandownerRecord.prototype.toJSON = function() {
  const raw = { ...this.get() };
  return {
    ...raw,
    projectId: raw.project_id,
    ownerName: raw['खातेदाराचे_नांव'],
    surveyNumber: raw['सर्वे_नं'],
    area: raw['क्षेत्र'],
    acquiredArea: raw['संपादित_क्षेत्र'],
    rate: raw['दर'],
    structuresAmount: raw['संरचना_झाडे_विहिरी_रक्कम'],
    totalCompensation: raw['एकूण_मोबदला'],
    solatium: raw['सोलेशियम_100'],
    finalCompensation: raw['अंतिम_रक्कम']
  };
};