import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PaymentRecord = sequelize.define('PaymentRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  landownerRecordId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'landowner_records',
      key: 'id'
    }
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique transaction ID for payment tracking'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'Payment amount in rupees'
  },
  bankAccountNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Beneficiary bank account number'
  },
  ifscCode: {
    type: DataTypes.STRING(11),
    allowNull: false,
    comment: 'Bank IFSC code'
  },
  accountHolderName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Bank account holder name'
  },
  utrNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Unique Transaction Reference number from bank'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'initiated', 'processing', 'success', 'failed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Current payment status'
  },
  rtgsRequestData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'RTGS API request data sent to bank'
  },
  rtgsResponseData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'RTGS API response data from bank'
  },
  paymentInitiatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When payment was initiated'
  },
  paymentProcessedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When payment was processed by bank'
  },
  paymentCompletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When payment was completed successfully'
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for payment failure if any'
  },
  receiptPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Path to generated receipt PDF'
  },
  receiptSentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When receipt was sent to beneficiary'
  },
  receiptSentVia: {
    type: DataTypes.ENUM('email', 'sms', 'both'),
    allowNull: true,
    comment: 'How receipt was delivered'
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of retry attempts for failed payments'
  },
  lastRetryAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last retry attempt timestamp'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the payment'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'User who initiated the payment'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether the payment record is active'
  }
}, {
  tableName: 'payment_records',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['transaction_id']
    },
    {
      fields: ['landowner_record_id']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['utr_number']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Instance methods
PaymentRecord.prototype.isEligibleForRetry = function() {
  return this.paymentStatus === 'failed' && this.retryCount < 3;
};

PaymentRecord.prototype.canBeCancelled = function() {
  return ['pending', 'initiated'].includes(this.paymentStatus);
};

PaymentRecord.prototype.getPaymentDuration = function() {
  if (!this.paymentInitiatedAt) return null;
  const endTime = this.paymentCompletedAt || new Date();
  return endTime - this.paymentInitiatedAt;
};

PaymentRecord.prototype.markAsProcessing = async function() {
  await this.update({
    paymentStatus: 'processing',
    paymentProcessedAt: new Date()
  });
};

PaymentRecord.prototype.markAsSuccess = async function(utrNumber) {
  await this.update({
    paymentStatus: 'success',
    utrNumber: utrNumber,
    paymentCompletedAt: new Date()
  });
};

PaymentRecord.prototype.markAsFailed = async function(reason) {
  await this.update({
    paymentStatus: 'failed',
    failureReason: reason,
    retryCount: this.retryCount + 1,
    lastRetryAt: new Date()
  });
};

// Static methods
PaymentRecord.findByTransactionId = function(transactionId) {
  return this.findOne({ where: { transactionId } });
};

PaymentRecord.findByUtrNumber = function(utrNumber) {
  return this.findOne({ where: { utrNumber } });
};

PaymentRecord.getPendingPayments = function() {
  return this.findAll({
    where: {
      paymentStatus: ['pending', 'initiated', 'processing'],
      isActive: true
    }
  });
};

PaymentRecord.getFailedPaymentsForRetry = function() {
  return this.findAll({
    where: {
      paymentStatus: 'failed',
      retryCount: { [sequelize.Op.lt]: 3 },
      isActive: true
    }
  });
};

export default PaymentRecord;

