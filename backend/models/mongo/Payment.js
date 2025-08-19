import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  survey_number: {
    type: String,
    required: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  officer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  payment_type: {
    type: String,
    required: false,
    enum: ['compensation', 'solatium', 'interest', 'other']
  },
  payment_date: {
    type: Date,
    required: false
  },
  payment_number: {
    type: String,
    required: false,
    unique: false
  },
  amount: {
    type: Number,
    required: false
  },
  land_type: {
    type: String,
    required: false,
    enum: ['agricultural', 'residential', 'commercial', 'industrial', 'forest', 'other']
  },
  payment_method: {
    type: String,
    enum: ['rtgs', 'neft', 'cheque', 'cash', 'other'],
    default: 'rtgs'
  },
  bank_details: {
    bank_name: String,
    branch_name: String,
    account_number: String,
    ifsc_code: String,
    account_holder_name: String
  },
  transaction_reference: String,
  payment_status: {
    type: String,
    enum: ['pending', 'initiated', 'completed', 'failed', 'reversed'],
    default: 'pending'
  },
  failure_reason: String,
  reversal_reason: String,
  documents: [{
    name: String,
    url: String,
    type: String,
    uploaded_at: Date
  }],
  remarks: String,
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ survey_number: 1 });
paymentSchema.index({ project_id: 1 });
paymentSchema.index({ officer_id: 1 });
paymentSchema.index({ payment_date: 1 });
paymentSchema.index({ payment_status: 1 });
paymentSchema.index({ payment_type: 1 });

export default mongoose.model('Payment', paymentSchema);
