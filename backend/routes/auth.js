import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    console.log(`\t DEBUG: ${email} ${password}`);

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Create demo users (for development)
// @route   POST /api/auth/seed
// @access  Public
router.post('/seed', async (req, res) => {
  try {
    // Check if demo users already exist
    const existingUsers = await User.find({
      email: { $in: [
        'admin@saral.gov.in', 
        'officer@saral.gov.in', 
        'agent@saral.gov.in',
        'rajesh.patil@saral.gov.in',
        'sunil.kambale@saral.gov.in',
        'mahesh.deshmukh@saral.gov.in',
        'vithal.jadhav@saral.gov.in',
        'ramrao.pawar@saral.gov.in'
      ]}
    });

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Demo users already exist'
      });
    }

    // Create demo users
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@saral.gov.in',
        password: 'admin',
        role: 'admin',
        department: 'Administration',
        phone: '9876543210',
        language: 'marathi'
      },
      {
        name: 'Land Officer',
        email: 'officer@saral.gov.in',
        password: 'officer',
        role: 'officer',
        department: 'Land Acquisition',
        phone: '9876543211',
        language: 'marathi'
      },
      {
        name: 'Field Agent',
        email: 'agent@saral.gov.in',
        password: 'agent',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543212',
        language: 'marathi'
      },
      // Additional field agents for testing
      {
        name: 'राजेश पाटील',
        email: 'rajesh.patil@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543210',
        language: 'marathi'
      },
      {
        name: 'सुनील कांबळे',
        email: 'sunil.kambale@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543211',
        language: 'marathi'
      },
      {
        name: 'महेश देशमुख',
        email: 'mahesh.deshmukh@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543212',
        language: 'marathi'
      },
      {
        name: 'विठ्ठल जाधव',
        email: 'vithal.jadhav@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543213',
        language: 'marathi'
      },
      {
        name: 'रामराव पवार',
        email: 'ramrao.pawar@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543214',
        language: 'marathi'
      }
    ];

    const createdUsers = await User.insertMany(demoUsers);

    res.status(201).json({
      success: true,
      message: 'Demo users created successfully',
      count: createdUsers.length
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router; 