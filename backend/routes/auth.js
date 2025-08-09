import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authMiddleware, authorize, refreshTokenMiddleware } from '../middleware/auth.js';

const router = express.Router();

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password',
        code: 'MISSING_CREDENTIALS'
      });
    }

    console.log(`\t DEBUG: Login attempt for ${email}`);

    // Check for user
    const user = await User.findOne({ 
      where: { email },
      attributes: { include: ['password', 'loginAttempts', 'lockUntil'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts',
        code: 'ACCOUNT_LOCKED',
        lockUntil: user.lockUntil
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        remainingAttempts: Math.max(0, 5 - (user.loginAttempts + 1))
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const accessToken = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    // Set token expiration based on remember me
    const tokenExpiry = rememberMe ? '7d' : '1d';

    // Create response
    const response = {
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      expiresIn: tokenExpiry,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        language: user.language,
        lastLogin: user.lastLogin
      }
    };

    // Set httpOnly cookie in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
      });
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', refreshTokenMiddleware, async (req, res) => {
  try {
    const { accessToken, refreshToken } = req.newTokens;
    const { user } = req;

    const response = {
      success: true,
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        language: user.language
      }
    };

    // Set httpOnly cookie in production
    if (process.env.NODE_ENV === 'production') {
      res.cookie('token', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Invalidate refresh token
    await req.user.invalidateRefreshToken();

    // Clear cookie in production
    if (process.env.NODE_ENV === 'production') {
      res.clearCookie('token');
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
router.post('/logout-all', authMiddleware, async (req, res) => {
  try {
    // Invalidate all refresh tokens for this user
    await req.user.invalidateRefreshToken();

    // Clear cookie in production
    if (process.env.NODE_ENV === 'production') {
      res.clearCookie('token');
    }

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
        code: 'MISSING_EMAIL'
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiry
    const resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Save to database
    await user.update({
      resetPasswordToken: resetPasswordToken,
      resetPasswordExpire: new Date(resetPasswordExpire)
    });

    // TODO: Send email with reset token
    // For now, return the token (in production, send via email)
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
router.put('/reset-password/:resetToken', async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password',
        code: 'MISSING_PASSWORD'
      });
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpire: { [sequelize.Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Set new password
    await user.update({
      password: password,
      resetPasswordToken: null,
      resetPasswordExpire: null
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
        code: 'MISSING_PASSWORDS'
      });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { include: ['password'] }
    });

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Update password
    await user.update({ password: newPassword });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// @desc    Create demo users (for development)
// @route   POST /api/auth/seed
// @access  Public
router.post('/seed', async (req, res) => {
  try {
    // Check if demo users already exist
    const existingUsers = await User.findAll({
      where: {
        email: [
          'admin@saral.gov.in', 
          'officer@saral.gov.in', 
          'agent@saral.gov.in',
          'rajesh.patil@saral.gov.in',
          'sunil.kambale@saral.gov.in',
          'mahesh.deshmukh@saral.gov.in',
          'vithal.jadhav@saral.gov.in',
          'ramrao.pawar@saral.gov.in'
        ]
      }
    });

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Demo users already exist',
        code: 'USERS_EXIST'
      });
    }

    // Create demo users
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@saral.gov.in',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        phone: '9876543210',
        language: 'marathi'
      },
      {
        name: 'Land Officer',
        email: 'officer@saral.gov.in',
        password: 'officer123',
        role: 'officer',
        department: 'Land Acquisition',
        phone: '9876543211',
        language: 'marathi'
      },
      {
        name: 'Field Agent',
        email: 'agent@saral.gov.in',
        password: 'agent123',
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

    const createdUsers = await User.bulkCreate(demoUsers);

    res.status(201).json({
      success: true,
      message: 'Demo users created successfully',
      count: createdUsers.length,
      users: createdUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }))
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

// @desc    Validate token
// @route   GET /api/auth/validate
// @access  Public
router.get('/validate', authMiddleware, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      code: 'SERVER_ERROR'
    });
  }
});

export default router; 