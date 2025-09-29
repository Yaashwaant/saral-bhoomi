import { connectMongoDBAtlas } from './config/mongodb-atlas.js';
import bcrypt from 'bcryptjs';
import User from './models/mongo/User.js';

async function fixOfficerPassword() {
  try {
    console.log('🌱 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB Atlas
    const connected = await connectMongoDBAtlas();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB Atlas');
      return;
    }
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log('🔍 Finding officer user...');
    
    // Find the officer user with the typo password
    const officerUser = await User.findOne({ email: 'officer@saral.gov.in' });
    
    if (!officerUser) {
      console.log('❌ Officer user not found');
      return;
    }
    
    console.log('👮 Found officer user:', officerUser.email);
    console.log('🔑 Updating password from "offier" to "officer"...');
    
    // Hash the correct password
    const correctPassword = await bcrypt.hash('officer', 12);
    
    // Update the password
    officerUser.password = correctPassword;
    await officerUser.save();
    
    console.log('✅ Password updated successfully!');
    console.log('\n🔑 Updated Login Credentials:');
    console.log('Officer: officer@saral.gov.in / officer');
    
  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    process.exit(0);
  }
}

fixOfficerPassword();