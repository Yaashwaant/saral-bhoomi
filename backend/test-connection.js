import { connectMongoDBAtlas } from './config/database.js';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const connected = await connectMongoDBAtlas();
    console.log('Connection result:', connected);
    
    if (connected) {
      console.log('✅ MongoDB connected successfully!');
    } else {
      console.log('❌ Failed to connect to MongoDB');
    }
    
    process.exit(connected ? 0 : 1);
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();