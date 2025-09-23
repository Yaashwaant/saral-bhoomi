import { connectMongoDBAtlas, getMongoAtlasConnectionStatus } from './config/mongodb-atlas.js';
import MongoUser from './models/mongo/User.js';

async function testMongoConnection() {
  try {
    console.log('🧪 Testing MongoDB Connection...\n');
    
    // Test connection
    const connected = await connectMongoDBAtlas();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB Atlas');
      return;
    }
    
    console.log('✅ MongoDB Atlas connection successful!');
    
    // Test basic operations
    console.log('\n🧪 Testing basic operations...');
    
    // Test User model
    const userCount = await MongoUser.countDocuments();
    console.log(`📊 Users in database: ${userCount}`);
    
    // Test finding a user
    const users = await MongoUser.find({}).limit(1);
    if (users.length > 0) {
      console.log(`👤 Sample user: ${users[0].name} (${users[0].email})`);
    } else {
      console.log('ℹ️ No users found in database');
    }
    
    // Get connection status
    const status = getMongoAtlasConnectionStatus();
    console.log('\n📊 Connection Status:', status);
    
    console.log('\n🎉 MongoDB connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testMongoConnection();
