import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const JMRRecord = sequelize.define('JMRRecord', {
  id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  survey_number: { 
    type: DataTypes.STRING, 
    allowNull: false,
    comment: 'Primary identifier for land parcel'
  },
  project_id: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  landowner_id: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  officer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Field Officer who performed the measurement'
  },
  measured_area: { 
    type: DataTypes.DECIMAL(12, 4), 
    allowNull: false, 
    defaultValue: 0 
  },
  land_type: {
    type: DataTypes.ENUM('Agricultural', 'Non-Agricultural'),
    allowNull: false,
    defaultValue: 'Agricultural'
  },
  tribal_classification: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether the land belongs to tribal community'
  },
  category: { 
    type: DataTypes.STRING 
  },
  date_of_measurement: { 
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
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
  attachments: { 
    type: DataTypes.JSON 
  },
  notes: { 
    type: DataTypes.TEXT 
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'jmr_records',
  timestamps: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['survey_number'] },
    { fields: ['landowner_id'] },
    { fields: ['officer_id'] },
    { fields: ['village'] },
    { fields: ['taluka'] },
    { fields: ['district'] },
    { fields: ['land_type'] },
    { fields: ['tribal_classification'] }
  ]
});

export default JMRRecord;


