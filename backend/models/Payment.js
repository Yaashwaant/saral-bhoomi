import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  payment_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique payment reference number'
  },
  survey_number: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Survey number of the land parcel'
  },
  notice_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'notices',
      key: 'notice_id'
    },
    comment: 'Reference to the notice'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Payment amount in rupees'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Success', 'Failed'),
    defaultValue: 'Pending',
    allowNull: false,
    comment: 'Payment status'
  },
  reason_if_pending: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason if payment is pending'
  },
  officer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Officer who created the payment slip'
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Associated project ID'
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when payment was processed'
  },
  payment_method: {
    type: DataTypes.ENUM('RTGS', 'NEFT', 'IMPS', 'Cash', 'Cheque'),
    defaultValue: 'RTGS'
  },
  bank_details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Bank account details for payment'
  },
  utr_number: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Unique Transaction Reference from bank'
  },
  receipt_path: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path to generated payment receipt'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the payment'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['payment_id'] },
    { fields: ['survey_number'] },
    { fields: ['notice_id'] },
    { fields: ['officer_id'] },
    { fields: ['project_id'] },
    { fields: ['status'] },
    { fields: ['payment_date'] }
  ]
});

export default Payment;
