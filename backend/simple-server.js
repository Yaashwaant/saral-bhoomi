import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
import User from './models/User.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: 'OK',
      database: 'Connected to PostgreSQL (Neon Tech)',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'Failed to connect to PostgreSQL',
      error: error.message
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoint working! PostgreSQL migration successful.',
    timestamp: new Date().toISOString()
  });
});

// Test user creation
app.post('/api/test-user', async (req, res) => {
  try {
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'officer',
      department: 'Test Department',
      phone: '1234567890',
      language: 'english'
    });
    
    res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test user',
      error: error.message
    });
  }
});

// Test user retrieval
app.get('/api/test-users', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  }
});

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully!');
    
    app.listen(PORT, () => {
      console.log(`🚀 Simple server running on http://localhost:${PORT}`);
      console.log('📊 Health check: http://localhost:3001/health');
      console.log('🧪 Test endpoint: http://localhost:3001/api/test');
      console.log('👤 Test user creation: POST http://localhost:3001/api/test-user');
      console.log('👥 Test user retrieval: GET http://localhost:3001/api/test-users');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
  }
};

startServer();
