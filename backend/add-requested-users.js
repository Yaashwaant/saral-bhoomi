import { connectMongoDBAtlas } from './config/mongodb-atlas.js';
import bcrypt from 'bcryptjs';
import User from './models/mongo/User.js';

async function addRequestedUsers() {
  try {
    console.log('🌱 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB Atlas
    const connected = await connectMongoDBAtlas();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB Atlas');
      return;
    }
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log('🔍 Checking existing users...');
    
    // Check if users already exist
    const existingOfficer = await User.findOne({ email: 'officer@saral.go.in' });
    const existingFieldOfficer = await User.findOne({ email: 'fieldofficer@saral.gov.in' });
    
    if (existingOfficer) {
      console.log('✅ Officer user already exists:', existingOfficer.email);
    } else {
      console.log('👮 Creating requested officer user...');
      const officerPassword = await bcrypt.hash('offier', 12);
      const officerUser = new User({
        name: 'Test Officer - Land Acquisition',
        email: 'officer@saral.go.in',
        password: officerPassword,
        role: 'officer',
        department: 'Land Acquisition Department',
        phone: '+91-9876543201',
        isActive: true
      });
      await officerUser.save();
      console.log('✅ Officer user created:', officerUser.email);
    }
    
    if (existingFieldOfficer) {
      console.log('✅ Field officer user already exists:', existingFieldOfficer.email);
    } else {
      console.log('👷 Creating requested field officer user...');
      const fieldOfficerPassword = await bcrypt.hash('fofficer', 12);
      const fieldOfficerUser = new User({
        name: 'Test Field Officer - Field Operations',
        email: 'fieldofficer@saral.gov.in',
        password: fieldOfficerPassword,
        role: 'field_officer',
        department: 'Field Operations Department',
        phone: '+91-9876543202',
        isActive: true
      });
      await fieldOfficerUser.save();
      console.log('✅ Field officer user created:', fieldOfficerUser.email);
    }
    
    console.log('\n🎉 Requested users added successfully!');
    console.log('\n🔑 New Login Credentials:');
    console.log('Officer: officer@saral.go.in / offier');
    console.log('Field Officer: fieldofficer@saral.gov.in / fofficer');
    
  } catch (error) {
    console.error('❌ Error adding users:', error);
  } finally {
    // Don't close connection as it might be used by other parts of the app
    process.exit(0);
  }
}

addRequestedUsers();