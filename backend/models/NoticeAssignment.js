import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const NoticeAssignment = sequelize.define('NoticeAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  landowner_id: {
    type: DataTypes.STRING, // Use String for frontend IDs
    allowNull: false
  },
  survey_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notice_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notice_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  notice_content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  notice_pdf_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  assigned_agent: {
    type: DataTypes.STRING, // Use String for frontend IDs
    allowNull: false
  },
  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  kyc_status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  documents_uploaded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    }
  },
  landowner_name: {
    type: DataTypes.STRING,
    allowNull: false
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
  area: {
    type: DataTypes.STRING,
    allowNull: false
  },
  compensation_amount: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'notice_assignments',
  timestamps: true,
  indexes: [
    {
      fields: ['assigned_agent', 'kyc_status']
    },
    {
      fields: ['landowner_id']
    }
  ]
});

export default NoticeAssignment; 