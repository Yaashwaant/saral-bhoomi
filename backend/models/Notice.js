import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notice = sequelize.define('Notice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  notice_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique notice reference number'
  },
  survey_number: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Survey number of the land parcel'
  },
  landowner_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name of the landowner'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Compensation amount in rupees'
  },
  notice_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date when notice was generated'
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'acknowledged', 'objected', 'expired'),
    defaultValue: 'draft',
    comment: 'Current status of the notice'
  },
  officer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Officer who created the notice'
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Associated project ID'
  },
  village: {
    type: DataTypes.STRING,
    allowNull: false
  },
  taluka: {
    type: DataTypes.STRING,
    allowNull: false
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false
  },
  land_type: {
    type: DataTypes.ENUM('Agricultural', 'Non-Agricultural'),
    allowNull: false
  },
  tribal_classification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  jmr_reference: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Reference to JMR measurement'
  },
  objection_deadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Deadline for filing objections'
  },
  notice_type: {
    type: DataTypes.ENUM('acquisition', 'compensation', 'eviction', 'other'),
    defaultValue: 'acquisition'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed description of the notice'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Associated documents and files'
  },
  document_hash: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Hash of uploaded documents for blockchain verification'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'notices',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['notice_id'] },
    { fields: ['survey_number'] },
    { fields: ['officer_id'] },
    { fields: ['project_id'] },
    { fields: ['status'] },
    { fields: ['notice_date'] },
    { fields: ['village'] },
    { fields: ['taluka'] },
    { fields: ['district'] },
    { fields: ['land_type'] },
    { fields: ['tribal_classification'] }
  ]
});

export default Notice;
