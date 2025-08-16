import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const BlockchainLedger = sequelize.define('BlockchainLedger', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  block_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique blockchain block identifier'
  },
  survey_number: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Survey number of the land parcel'
  },
  event_type: {
    type: DataTypes.ENUM(
      'JMR_Measurement_Uploaded',
      'Notice_Generated',
      'Payment_Slip_Created',
      'Payment_Released',
      'Payment_Pending',
      'Payment_Failed',
      'Ownership_Updated',
      'Award_Declared',
      'Compensated'
    ),
    allowNull: false,
    comment: 'Type of event captured'
  },
  officer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Field Officer who performed the action'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When the event occurred'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional event-specific data'
  },
  previous_hash: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Hash of the previous block'
  },
  current_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Hash of the current block'
  },
  nonce: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Proof of work nonce'
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Associated project ID'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional remarks or reason for the event'
  },
  is_valid: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the block is valid and untampered'
  }
}, {
  tableName: 'blockchain_ledger',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['block_id'] },
    { fields: ['survey_number'] },
    { fields: ['event_type'] },
    { fields: ['officer_id'] },
    { fields: ['timestamp'] },
    { fields: ['project_id'] },
    { fields: ['current_hash'] },
    { fields: ['is_valid'] }
  ]
});

// Instance methods
BlockchainLedger.prototype.calculateHash = function() {
  const data = `${this.survey_number}${this.event_type}${this.officer_id}${this.timestamp}${this.previous_hash}${this.nonce}`;
  // In a real implementation, this would use a proper hashing algorithm
  return Buffer.from(data).toString('base64');
};

BlockchainLedger.prototype.isValid = function() {
  return this.current_hash === this.calculateHash();
};

// Static methods
BlockchainLedger.getLatestBlock = function() {
  return this.findOne({
    order: [['timestamp', 'DESC']]
  });
};

BlockchainLedger.getSurveyHistory = function(surveyNumber) {
  return this.findAll({
    where: { survey_number: surveyNumber },
    order: [['timestamp', 'ASC']]
  });
};

BlockchainLedger.getProjectHistory = function(projectId) {
  return this.findAll({
    where: { project_id: projectId },
    order: [['timestamp', 'ASC']]
  });
};

export default BlockchainLedger;
