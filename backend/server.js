// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { connectMongoDBAtlas, getMongoAtlasConnectionStatus } from './config/mongodb-atlas.js';
import { initializeCloudinary } from './services/cloudinaryService.js';

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
import landownerRoutes from './routes/landowners.js';
import awardRoutes from './routes/awards.js';
import blockchainRoutes from './routes/blockchain.js';
import dataIntegrityRoutes from './routes/dataIntegrity.js';
import workflowRoutes from './routes/workflow.js';
import documentRoutes from './routes/documents.js';
import insightsRoutes from './routes/insights.js';
import aiRoutes from './routes/ai.js';
import filtersRoutes from './routes/filters.js';
import jmrRoutes from './routes/jmr.js';
import districtsRoutes from './routes/districts.js';
import talukasRoutes from './routes/talukas.js';
import landRecordsRoutes from './routes/landRecords.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

// Import MongoDB models
import MongoUser from './models/mongo/User.js';
// Optional: Firebase Admin (Firestore/Storage)
import admin from 'firebase-admin';

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
// Initialize Firebase if env present
try {
  const serviceJsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceJsonB64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const configuredBucket = process.env.FIREBASE_STORAGE_BUCKET;

  const storageBucket = configuredBucket || (projectId ? `${projectId}.appspot.com` : undefined);

  let creds = null;
  if (serviceJsonB64) {
    try {
      const decoded = Buffer.from(serviceJsonB64, 'base64').toString('utf8');
      creds = JSON.parse(decoded);
    } catch (e) {
      console.warn('⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_B64:', e && (e.message || e));
    }
  }

  if (!creds && serviceJsonRaw) {
    let jsonStr = serviceJsonRaw.trim();
    // Strip wrapping quotes if present
    if ((jsonStr.startsWith("'") && jsonStr.endsWith("'")) || (jsonStr.startsWith('"') && jsonStr.endsWith('"'))) {
      jsonStr = jsonStr.slice(1, -1);
    }
    creds = JSON.parse(jsonStr);
    // Normalize escaped newlines in private key if present
    if (creds.private_key) {
      creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }
    if (!admin.apps.length) admin.initializeApp({ 
      credential: admin.credential.cert(creds),
      storageBucket
    });
    console.log('🔥 Firebase initialized from JSON env', storageBucket ? `with bucket ${storageBucket}` : '(no bucket)');
  } else if (projectId && clientEmail && privateKey) {
    if (!admin.apps.length) admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      storageBucket
    });
    console.log('🔥 Firebase initialized from discrete env', storageBucket ? `with bucket ${storageBucket}` : '(no bucket)');
  } else {
    console.log('ℹ️ Firebase not configured; continuing without it');
  }
} catch (e) {
  console.warn('⚠️ Firebase init failed; continuing without Firebase', e && (e.stack || e.message || e));
}

// Initialize Cloudinary and log connectivity
initializeCloudinary();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration (use env when available)
const corsOrigins = (process.env.CORS_ORIGIN || process.env.DEV_CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:3003,http://127.0.0.1:3003,http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-role']
}));

// Rate limiting - More generous for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased to 1000 requests per windowMs for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and test endpoints
    return req.path === '/health' || req.path === '/api/test' || req.path === '/api/test-token';
  }
});
app.use('/api/', limiter);

// Special rate limiter for blockchain endpoints (more generous)
const blockchainLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Very generous for blockchain operations
  message: 'Blockchain API rate limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/blockchain', blockchainLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: fs.createWriteStream(join(__dirname, 'logs', 'access.log'), { flags: 'a' })
}));

// Static files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Serve the HTML login page
app.get('/login.html', (req, res) => {
  res.sendFile(join(__dirname, '../public/login.html'));
});

// Serve the login page at the root route
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../public/login.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Database status endpoint
app.get('/api/db/status', (req, res) => {
  try {
    const status = getMongoAtlasConnectionStatus();
    res.status(200).json({
      success: true,
      environment: {
        node_env: process.env.NODE_ENV,
        has_mongodb_uri: Boolean(process.env.MONGODB_URI),
        cors_origin: process.env.CORS_ORIGIN || process.env.DEV_CORS_ORIGIN || null
      },
      mongo: status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error && (error.message || error) });
  }
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

// Temporary middleware to provide default user context when auth is disabled
app.use('/api', async (req, res, next) => {
  try {
    if (!req.user) {
      // For agent routes, dynamically pick the first active agent from DB so
      // portal fetches and assignments refer to the same agent id.
      if (
        req.path.includes('/agents/assigned') ||
        req.path.includes('/agents/kyc-status') ||
        req.path.includes('/agents/upload-document')
      ) {
        let defaultAgentId = 'demo-agent-id';
        try {
          const firstAgent = await MongoUser.findOne({
            role: { $in: ['field_officer', 'agent'] },
            is_active: true
          }).sort({ createdAt: 1 }).select('_id name email');
          
          if (firstAgent) {
            defaultAgentId = firstAgent._id.toString();
          }
        } catch (e) {
          // fallback to hardcoded id if query fails
          defaultAgentId = 'demo-agent-id';
        }

        req.user = {
          id: defaultAgentId,
          name: 'Demo Field Officer',
          email: 'agent@saral.gov.in',
          role: 'field_officer'
        };
      } else {
        // Use demo officer id by default
        req.user = {
          id: 'demo-officer-id',
          name: 'Demo Officer',
          email: 'officer@saral.gov.in',
          role: 'officer'
        };
      }
    }
    next();
  } catch (err) {
    next();
  }
});

// Special endpoint to check available agents in the database
app.get('/api/agents/list-all', async (req, res) => {
  try {
    const agents = await MongoUser.find({
      role: { $in: ['field_officer', 'agent'] },
      is_active: true
    }).select('_id name email phone department').sort({ name: 1 });
    
    res.status(200).json({ 
      success: true, 
      count: agents.length, 
      data: agents.map(agent => ({
        id: agent._id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        department: agent.department
      }))
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch agents' });
  }
});

// API routes (temporarily removing auth middleware)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/villages', villageRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/landowners', landownerRoutes);
app.use('/api/awards', awardRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/data-integrity', dataIntegrityRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/filters', filtersRoutes);
app.use('/api/jmr', jmrRoutes);
app.use('/api/districts', districtsRoutes);
app.use('/api/talukas', talukasRoutes);
app.use('/api/landRecords', landRecordsRoutes);

// Debug: Log all registered routes
console.log('🚀 Registered routes:');
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log(`  ${Object.keys(r.route.methods).join(', ').toUpperCase()} ${r.route.path}`)
  }
});

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

// MongoDB connection with Mongoose
const connectDB = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB Atlas...');
    
    // Test database connection
    const isConnected = await connectMongoDBAtlas();
    
    if (isConnected) {
      console.log('✅ MongoDB Atlas connected successfully!');
      
      // Get connection status
      const status = getMongoAtlasConnectionStatus();
      console.log('📊 Database Status:', status);
      
      return true;
    } else {
      console.log('⚠️  MongoDB connection failed. Starting server in demo mode with in-memory data.');
      return false;
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Starting server in demo mode with in-memory data.');
    return false;
  }
};

// Import blockchain service for cleanup
import EnhancedBlockchainService from './services/enhancedBlockchainService.js';

// Global blockchain service instance
let blockchainService = null;

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    // Initialize blockchain service
    blockchainService = new EnhancedBlockchainService();
    await blockchainService.initialize();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
  
  try {
    // Cleanup blockchain service
    if (blockchainService) {
      console.log('🧹 Cleaning up blockchain service...');
      await blockchainService.cleanup();
    }
    
    // Close MongoDB connection
    console.log('🧹 Closing database connections...');
    // Add MongoDB cleanup if needed
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error.message);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

startServer();