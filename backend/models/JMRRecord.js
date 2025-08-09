import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const JMRRecord = sequelize.define('JMRRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  project_id: { type: DataTypes.INTEGER, allowNull: false },
  landowner_id: { type: DataTypes.STRING, allowNull: false },
  survey_number: { type: DataTypes.STRING, allowNull: false },
  measured_area: { type: DataTypes.DECIMAL(12, 4), allowNull: false, defaultValue: 0 },
  category: { type: DataTypes.STRING },
  date_of_measurement: { type: DataTypes.DATE },
  attachments: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT }
}, {
  tableName: 'jmr_records',
  timestamps: true,
  indexes: [
    { fields: ['project_id'] },
    { fields: ['survey_number'] },
    { fields: ['landowner_id'] }
  ]
});

export default JMRRecord;


