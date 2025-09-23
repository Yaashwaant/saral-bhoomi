import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Officer = sequelize.define('Officer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  officer_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique officer identifier'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Full name of the officer'
  },
  designation: {
    type: DataTypes.ENUM(
      'Field_Officer',
      'Tehsildar',
      'Deputy_Collector',
      'Collector',
      'Additional_Collector',
      'Superintendent',
      'Other'
    ),
    allowNull: false,
    defaultValue: 'Field_Officer'
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'District where officer is posted'
  },
  taluka: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Taluka where officer is posted'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Contact phone number'
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Land_Acquisition',
    comment: 'Department the officer belongs to'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the officer is currently active'
  },
  joining_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when officer joined the department'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Specific permissions for the officer'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the officer'
  }
}, {
  tableName: 'officers',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['officer_id'] },
    { fields: ['email'] },
    { fields: ['district'] },
    { fields: ['taluka'] },
    { fields: ['designation'] },
    { fields: ['department'] },
    { fields: ['is_active'] }
  ]
});

export default Officer;
