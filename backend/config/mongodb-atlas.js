import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

// MongoDB Atlas connection options
const mongoOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
  // Atlas specific options
  ssl: true,
  authSource: 'admin',
  retryReads: true
};

// MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Connect to MongoDB Atlas
export const connectMongoDBAtlas = async () => {
  try {
    console.log('☁️ Connecting to MongoDB Atlas...');
    console.log(` Cluster: saral-bhoomi-cluster`);
    console.log(`👤 User: bhiseyashwant8`);
    console.log(`📊 Database: saral_bhoomi`);
    
    await mongoose.connect(MONGODB_URI, mongoOptions);
    
    console.log('✅ MongoDB Atlas connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`🔗 Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose connected to MongoDB Atlas');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('🔴 Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🟡 Mongoose disconnected from MongoDB Atlas');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔄 MongoDB Atlas connection closed through app termination');
      process.exit(0);
    });
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection failed:', error.message);
    console.error(' Check your MONGODB_URI and network access settings');
    return false;
  }
};

// Test MongoDB Atlas connection
export const testMongoAtlasConnection = async () => {
  try {
    const connected = await connectMongoDBAtlas();
    if (connected) {
      console.log('✅ MongoDB Atlas connection test successful!');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection test failed:', error);
    return false;
  }
};

// Get MongoDB Atlas connection status
export const getMongoAtlasConnectionStatus = () => {
  if (!mongoose.connection) {
    return 'Not initialized';
  }
  
  const states = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };
  
  return {
    state: states[mongoose.connection.readyState] || 'Unknown',
    readyState: mongoose.connection.readyState,
    database: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port
  };
};

export default mongoose;
