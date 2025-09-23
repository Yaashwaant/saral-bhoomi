import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Award = sequelize.define('Award', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  award_id: { type: DataTypes.STRING, unique: true, allowNull: false },
  survey_number: { type: DataTypes.STRING, allowNull: false },
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  landowner_id: { type: DataTypes.STRING, allowNull: false },
  landowner_name: { type: DataTypes.STRING, allowNull: false },
  award_number: { type: DataTypes.STRING, allowNull: false },
  award_date: { type: DataTypes.DATE, allowNull: false },
  base_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  solatium: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  additional_amounts: { type: DataTypes.JSON },
  total_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  status: { 
    type: DataTypes.ENUM('Draft', 'Pending', 'Approved', 'Rejected', 'Completed'),
    defaultValue: 'Draft'
  },
  officer_id: { type: DataTypes.INTEGER, allowNull: false },
  village: { type: DataTypes.STRING, allowNull: false },
  taluka: { type: DataTypes.STRING, allowNull: false },
  district: { type: DataTypes.STRING, allowNull: false },
  land_type: { 
    type: DataTypes.ENUM('Agricultural', 'Non-Agricultural'),
    defaultValue: 'Agricultural'
  },
  tribal_classification: { type: DataTypes.BOOLEAN, defaultValue: false },
  category: { type: DataTypes.STRING },
  measured_area: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  unit: { type: DataTypes.STRING, defaultValue: 'acres' },
  jmr_reference: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'awards',
  timestamps: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['landowner_id'] },
    { fields: ['survey_number'] },
    { fields: ['award_id'] },
    { fields: ['officer_id'] },
    { fields: ['status'] }
  ]
});

export default Award;


