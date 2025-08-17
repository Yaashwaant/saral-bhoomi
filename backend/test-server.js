import express from 'express';
import cors from 'cors';
import { connectMongoDBAtlas, getMongoAtlasConnectionStatus } from './config/mongodb-atlas.js';
import MongoUser from './models/mongo/User.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// MongoDB test endpoint
app.get('/mongo-test', async (req, res) => {
  try {
    const userCount = await MongoUser.countDocuments();
    const users = await MongoUser.find({}).limit(3).select('name email role');
    
    res.json({
      success: true,
      message: 'MongoDB test successful',
      userCount,
      sampleUsers: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'MongoDB test failed',
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  const status = getMongoAtlasConnectionStatus();
  res.json({
    status: 'OK',
    mongodb: status,
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting test server...');
    
    // Connect to MongoDB
    const connected = await connectMongoDBAtlas();
    if (!connected) {
      console.log('⚠️ MongoDB connection failed, but starting server anyway...');
    }
    
    app.listen(PORT, () => {
      console.log(`✅ Test server running on http://localhost:${PORT}`);
      console.log('🧪 Test endpoints:');
      console.log(`   GET /test - Basic test`);
      console.log(`   GET /mongo-test - MongoDB test`);
      console.log(`   GET /health - Health check`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
  }
};

startServer();
