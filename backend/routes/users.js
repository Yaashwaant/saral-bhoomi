import express from 'express';
import bcrypt from 'bcryptjs';
import MongoUser from '../models/mongo/User.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all users
// @route   GET /api/users
// @access  Public (temporarily)
router.get('/', async (req, res) => {
  try {
    const users = await MongoUser.find({}).select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        is_active: user.is_active,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public (temporarily)
router.get('/:id', async (req, res) => {
  try {
    const user = await MongoUser.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        is_active: user.is_active,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create user
// @route   POST /api/users
// @access  Public (temporarily)
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, department, phone, language } = req.body;
    
    // Check if user already exists
    const existingUser = await MongoUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new MongoUser({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      phone,
      language
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        language: user.language
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public (temporarily)
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, department, phone, language, isActive } = req.body;
    
    const user = await MongoUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    await user.update({
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      department: department || user.department,
      phone: phone || user.phone,
      language: language || user.language,
      isActive: typeof isActive === 'boolean' ? isActive : user.isActive
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        language: user.language,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public (temporarily)
router.delete('/:id', async (req, res) => {
  try {
    const user = await MongoUser.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.destroy();
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Public (temporarily)
router.get('/role/:role', async (req, res) => {
  try {
    const users = await MongoUser.find({ 
      role: req.params.role,
      isActive: true 
    }).select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        is_active: user.is_active,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update user password
// @route   PUT /api/users/:id/password
// @access  Public (temporarily)
router.put('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    const user = await MongoUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    await user.update({ password: hashedPassword });
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router; 