import express from 'express';
import LandownerRecord from '../models/LandownerRecord.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all landowner records
// @route   GET /api/landowners/list
// @access  Public (for now)
router.get('/list', async (req, res) => {
  try {
    const records = await LandownerRecord.findAll({
      where: { isActive: true },
      include: [
        { model: Project, attributes: ['projectName', 'pmisCode'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: records.length,
      records: records
    });
  } catch (error) {
    console.error('Error fetching landowner records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner records'
    });
  }
});

// @desc    Get landowner record by ID
// @route   GET /api/landowners/:id
// @access  Public (for now)
router.get('/:id', async (req, res) => {
  try {
    const record = await LandownerRecord.findByPk(req.params.id, {
      include: [
        { model: Project, attributes: ['projectName', 'pmisCode'] },
        { model: User, as: 'assignedAgentUser', attributes: ['name', 'email', 'phone'] }
      ]
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }

    res.status(200).json({
      success: true,
      record: record
    });
  } catch (error) {
    console.error('Error fetching landowner record:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching landowner record'
    });
  }
});

export default router; 