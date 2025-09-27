import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

// MongoDB connection configuration
const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: parseInt(process.env.DB_POOL_MAX) || 10,
  minPoolSize: parseInt(process.env.DB_POOL_MIN) || 2,
  maxIdleTimeMS: parseInt(process.env.DB_POOL_IDLE) || 10000,
  serverSelectionTimeoutMS: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false,
};

// MongoDB connection
let isConnected = false;

export const connectMongoDBAtlas = async () => {
  try {
    if (isConnected) {
      console.log('✅ Already connected to MongoDB Atlas');
      return true;
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoUri, mongoConfig);
    
    isConnected = true;
    console.log('✅ MongoDB Atlas connection established successfully');
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      isConnected = true;
    });

    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    isConnected = false;
    return false;
  }
};

// Test MongoDB connection
export const testConnection = async () => {
  try {
    if (!isConnected) {
      await connectMongoDBAtlas();
    }
    
    // Test the connection by running a simple operation
    await mongoose.connection.db.admin().ping();
    console.log('✅ MongoDB connection test successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error.message);
    return false;
  }
};

// Get connection status
export const getMongoAtlasConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    collections: Object.keys(mongoose.connection.collections)
  };
};

// Graceful shutdown
export const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    isConnected = false;
    console.log('✅ MongoDB connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

// Export mongoose for direct use
export default mongoose;
