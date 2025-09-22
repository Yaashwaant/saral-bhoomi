import mongoose from 'mongoose';

// MongoDB Atlas connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bhiseyashwant8:bhoomi123@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority';

let isConnected = false;

export const connectMongoDBAtlas = async () => {
  try {
    if (isConnected) {
      console.log('✅ Already connected to MongoDB Atlas');
      return true;
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log('☁️ Connecting to MongoDB Atlas...');
    console.log(' Cluster: saral-bhoomi-cluster');
    console.log('👤 User: bhiseyashwant8');
    console.log('📊 Database: saral_bhoomi');

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    await mongoose.connect(MONGODB_URI, options);
    
    isConnected = true;
    
    console.log('✅ MongoDB Atlas connected successfully');
    console.log('📊 Database: saral_bhoomi');
    console.log('🌐 Host: ac-lsklhso-shard-00-02.ytoaysp.mongodb.net');
    console.log('🔗 Connection State: Connected');
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    isConnected = false;
    return false;
  }
};

export const getMongoAtlasConnectionStatus = () => {
  return {
    state: isConnected ? 'Connected' : 'Disconnected',
    readyState: mongoose.connection.readyState,
    database: 'saral_bhoomi',
    host: 'ac-lsklhso-shard-00-02.ytoaysp.mongodb.net',
    port: 27017
  };
};

export const disconnectMongoDBAtlas = async () => {
  try {
    if (isConnected) {
      await mongoose.disconnect();
      isConnected = false;
      console.log('🔌 Disconnected from MongoDB Atlas');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB Atlas:', error.message);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB Atlas');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB Atlas');
  isConnected = false;
});

export default {
  connectMongoDBAtlas,
  getMongoAtlasConnectionStatus,
  disconnectMongoDBAtlas
};