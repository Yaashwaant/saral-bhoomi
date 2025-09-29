import { connectMongoDBAtlas } from './config/mongodb-atlas.js';
import bcrypt from 'bcryptjs';
import User from './models/mongo/User.js';

async function createOfficerUser() {
  try {
    console.log('🌱 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB Atlas
    const connected = await connectMongoDBAtlas();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB Atlas');
      return;
    }
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log('🔍 Checking for existing officer user...');
    
    // Check if officer user already exists
    const existingOfficer = await User.findOne({ email: 'officer@saral.gov.in' });
    
    if (existingOfficer) {
      console.log('👮 Officer user already exists:', existingOfficer.email);
      console.log('🔑 Updating password to "officer"...');
      
      // Update the password
      const correctPassword = await bcrypt.hash('officer', 12);
      existingOfficer.password = correctPassword;
      await existingOfficer.save();
      
      console.log('✅ Password updated successfully!');
    } else {
      console.log('👮 Creating new officer user...');
      
      // Hash the correct password
      const hashedPassword = await bcrypt.hash('officer', 12);
      
      // Create the officer user
      const newOfficer = new User({
        name: 'Officer',
        email: 'officer@saral.gov.in',
        password: hashedPassword,
        role: 'officer',
        department: 'Revenue Department',
        phone: '1234567890',
        isActive: true
      });
      
      await newOfficer.save();
      console.log('✅ Officer user created successfully!');
    }
    
    console.log('\n🔑 Updated Login Credentials:');
    console.log('Officer: officer@saral.gov.in / officer');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

createOfficerUser();