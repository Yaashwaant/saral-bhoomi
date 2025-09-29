import mongoose from 'mongoose';
import User from './models/mongo/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

async function checkAtlasUsers() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Connect directly to MongoDB Atlas with simplified config
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment');
      return;
    }
    
    console.log('🔍 Using MongoDB URI:', mongoUri.substring(0, 50) + '...');
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log('🔍 Checking users in database...');
    
    // Find all users
    const users = await User.find({}).select('name email role password');
    console.log(`📊 Found ${users.length} users in database:`);
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.name}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🎭 Role: ${user.role}`);
      console.log(`🔑 Password hash: ${user.password.substring(0, 20)}...`);
      
      // Check if password looks like bcrypt hash
      const isBcryptHash = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
      console.log(`🔐 Is bcrypt hash: ${isBcryptHash ? '✅ Yes' : '❌ No (plain text!)'}`);
      
      // If it's the officer, test password comparison
      if (user.email === 'officer@saral.gov.in') {
        console.log('🧪 Testing officer password comparison...');
        try {
          const isMatch = await bcrypt.compare('officer123', user.password);
          console.log(`🔍 'officer123' matches: ${isMatch ? '✅ Yes' : '❌ No'}`);
          
          const isMatchOfficer = await bcrypt.compare('officer', user.password);
          console.log(`🔍 'officer' matches: ${isMatchOfficer ? '✅ Yes' : '❌ No'}`);
        } catch (error) {
          console.log(`❌ Password comparison failed: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAtlasUsers();