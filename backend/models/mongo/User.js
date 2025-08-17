import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'officer', 'agent', 'viewer'],
    default: 'officer'
  },
  department: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: Date,
  profile_picture: String,
  permissions: [{
    resource: String,
    actions: [String]
  }]
}, {
  timestamps: true
});

// Indexes (email index is automatically created by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

export default mongoose.model('User', userSchema);
