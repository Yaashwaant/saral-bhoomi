import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';
import './models/index.js';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
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

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully!');
    
    app.listen(PORT, () => {
      console.log(`🚀 Test server running on http://localhost:${PORT}`);
      console.log('📊 Health check: http://localhost:5000/health');
      console.log('🧪 Test endpoint: http://localhost:5000/api/test');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
  }
};

startServer();
