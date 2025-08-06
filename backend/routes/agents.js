import express from 'express';
import LandownerRecord from '../models/LandownerRecord.js';
import User from '../models/User.js';

const router = express.Router();

// @desc    Get all agents
// @route   GET /api/agents/list
// @access  Public
router.get('/list', async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent', isActive: true })
      .select('name email phone department')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: agents.length,
      agents: agents
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents'
    });
  }
});

// @desc    Assign agent to landowner record
// @route   PUT /api/agents/assign
// @access  Public
router.put('/assign', async (req, res) => {
  try {
    const { landownerId, agentId } = req.body;
    
    console.log('Assigning agent:', { landownerId, agentId });
    
    // Validate inputs
    if (!landownerId || !agentId) {
      return res.status(400).json({
        success: false,
        message: 'Landowner ID and Agent ID are required'
      });
    }
    
    // Find the landowner record
    const landownerRecord = await LandownerRecord.findById(landownerId);
    if (!landownerRecord) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }
    
    // Find the agent
    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'agent') {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Update the landowner record
    landownerRecord.assignedAgent = agentId;
    landownerRecord.assignedAt = new Date();
    landownerRecord.kycStatus = 'pending';
    
    await landownerRecord.save();
    
    // Add to agent's assigned records
    if (!agent.assignedRecords) {
      agent.assignedRecords = [];
    }
    agent.assignedRecords.push(landownerId);
    await agent.save();
    
    console.log('Agent assigned successfully');
    
    res.status(200).json({
      success: true,
      message: 'Agent assigned successfully',
      data: {
        landownerId: landownerRecord._id,
        agentId: agent._id,
        assignedAt: landownerRecord.assignedAt
      }
    });
    
  } catch (error) {
    console.error('Error assigning agent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign agent'
    });
  }
});

// @desc    Get agent's assigned records
// @route   GET /api/agents/assigned
// @access  Public
router.get('/assigned', async (req, res) => {
  try {
    // For demo, use a default agent ID
    const agentId = req.user?.id || '4'; // Default agent ID
    
    console.log('Fetching assigned records for agent:', agentId);
    
    // Find agent
    const agent = await User.findById(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Get assigned records
    const records = await LandownerRecord.find({
      assignedAgent: agentId,
      isActive: true
    })
    .populate('projectId', 'projectName pmisCode')
    .sort({ assignedAt: -1 });
    
    console.log(`Found ${records.length} assigned records`);
    
    res.status(200).json({
      success: true,
      count: records.length,
      records: records
    });
    
  } catch (error) {
    console.error('Error fetching assigned records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned records'
    });
  }
});

// @desc    Update KYC status
// @route   PUT /api/agents/kyc-status
// @access  Public
router.put('/kyc-status', async (req, res) => {
  try {
    const { landownerId, kycStatus, notes } = req.body;
    
    console.log('Updating KYC status:', { landownerId, kycStatus });
    
    // Find and update the landowner record
    const record = await LandownerRecord.findById(landownerId);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Landowner record not found'
      });
    }
    
    record.kycStatus = kycStatus;
    if (notes) {
      record.kycNotes = notes;
    }
    record.kycUpdatedAt = new Date();
    
    await record.save();
    
    res.status(200).json({
      success: true,
      message: 'KYC status updated successfully',
      data: {
        landownerId: record._id,
        kycStatus: record.kycStatus,
        updatedAt: record.kycUpdatedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating KYC status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update KYC status'
    });
  }
});

export default router; 