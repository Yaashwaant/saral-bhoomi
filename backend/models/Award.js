import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Award = sequelize.define('Award', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  landowner_id: { type: DataTypes.STRING, allowNull: false },
  award_number: { type: DataTypes.STRING },
  award_date: { type: DataTypes.DATE },
  base_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  solatium: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  additional_amounts: { type: DataTypes.JSON },
  total_amount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
  notes: { type: DataTypes.TEXT }
}, {
  tableName: 'awards',
  timestamps: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['landowner_id'] }
  ]
});

export default Award;


