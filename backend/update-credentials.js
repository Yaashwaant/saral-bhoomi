import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi';

// User schema (minimal for this script)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  phone: { type: String, required: true },
  is_active: { type: Boolean, default: true },
  last_login: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function updateCredentials() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define the credential updates
    const credentialUpdates = [
      {
        email: 'admin@saral.gov.in',
        password: 'admin',
        name: 'Admin User',
        role: 'admin',
        department: 'IT Department',
        phone: '+91-9876543210'
      },
      {
        email: 'officer@saral.gov.in',
        password: 'officer',
        name: 'Officer User',
        role: 'officer',
        department: 'Land Acquisition Department',
        phone: '+91-9876543211'
      },
      {
        email: 'agent@saral.gov.in',
        password: 'field123',
        name: 'Field Officer User',
        role: 'field_officer',
        department: 'Field Operations Department',
        phone: '+91-9876543212'
      }
    ];

    console.log('🔄 Updating user credentials...');

    for (const userData of credentialUpdates) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Update or create user
      const updatedUser = await User.findOneAndUpdate(
        { email: userData.email },
        {
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          department: userData.department,
          phone: userData.phone,
          is_active: true
        },
        { upsert: true, new: true }
      );

      console.log(`✅ Updated/created user: ${updatedUser.email} (${updatedUser.role})`);
    }

    console.log('🎉 All credentials updated successfully!');
    
    // List all users to verify
    console.log('\n📋 Current users in database:');
    const users = await User.find({}, 'email name role department is_active');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ${user.name}`);
    });

  } catch (error) {
    console.error('❌ Error updating credentials:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateCredentials();