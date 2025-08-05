import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import csvRoutes from './routes/csv.js';
import noticeRoutes from './routes/notices.js';
import kycRoutes from './routes/kyc.js';
import paymentRoutes from './routes/payments.js';
import villageRoutes from './routes/villages.js';
import agentRoutes from './routes/agents.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create logs directory if it doesn't exist
const logsDir = join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: fs.createWriteStream(join(__dirname, 'logs', 'access.log'), { flags: 'a' })
}));

// Static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Test endpoint without authentication
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoint working! No authentication required.',
    timestamp: new Date().toISOString()
  });
});

// Test token endpoint for development
app.get('/api/test-token', (req, res) => {
  const token = jwt.sign(
    { id: 'test-user-id' }, 
    process.env.JWT_SECRET, 
    { expiresIn: '7d' }
  );
  
  res.status(200).json({
    success: true,
    message: 'Test token generated for development',
    token,
    user: {
      id: 'test-user-id',
      name: 'Test Officer',
      email: 'officer@saral.gov.in',
      role: 'officer'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/csv', authMiddleware, csvRoutes);
app.use('/api/notices', authMiddleware, noticeRoutes);
app.use('/api/kyc', authMiddleware, kycRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/villages', authMiddleware, villageRoutes);
app.use('/api/agents', authMiddleware, agentRoutes);

// Demo bank server endpoint
app.post('/api/bank/rtgs', async (req, res) => {
  try {
    const { transactionId, accountNumber, ifscCode, beneficiaryName, amount, purpose } = req.body;
    
    // Simulate bank processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    // Simulate success/failure scenarios
    const failureChance = Math.random();
    let success = true;
    let message = 'Payment processed successfully';
    let status = 'success';
    
    if (failureChance < 0.1) {
      success = false;
      message = 'Insufficient funds in sender account';
      status = 'failed';
    } else if (failureChance < 0.15) {
      success = false;
      message = 'Invalid IFSC code';
      status = 'failed';
    } else if (failureChance < 0.2) {
      success = false;
      message = 'Account number not found';
      status = 'failed';
    } else if (failureChance < 0.25) {
      success = false;
      message = 'Bank server timeout';
      status = 'failed';
    } else if (failureChance < 0.3) {
      status = 'pending';
      message = 'Payment is being processed';
    }
    
    const response = {
      success,
      transactionId,
      bankReference: `BANK${Date.now()}${Math.floor(Math.random() * 1000)}`,
      status,
      message,
      timestamp: new Date().toISOString(),
      processingTime: Date.now() - req.startTime
    };
    
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bank server error',
      error: error.message
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Starting server without MongoDB (demo mode)');
    // Don't exit, continue without MongoDB for demo purposes
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
  }
};

startServer();