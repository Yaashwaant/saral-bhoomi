import express from 'express';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public (temporarily)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      district, 
      taluka, 
      type, 
      status,
      isActive 
    } = req.query;
    
    // Build filter object
    const where = {};
    if (district) where.district = district;
    if (taluka) where.taluka = taluka;
    if (type) where.type = type;
    if (status) where[status] = 'approved';
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const projects = await Project.findAll({
      where,
      include: [
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    const total = await Project.count({ where });
    
    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public (temporarily)
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ]
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Create project
// @route   POST /api/projects
// @access  Public (temporarily)
router.post('/', async (req, res) => {
  try {
    const {
      projectName,
      pmisCode,
      schemeName,
      landRequired,
      landAvailable,
      landToBeAcquired,
      type,
      description,
      location,
      budget,
      timeline,
      stakeholders,
      videoUrl
    } = req.body;
    
    // Check if PMIS code already exists
    const existingProject = await Project.findOne({ where: { pmisCode } });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: 'Project with this PMIS code already exists'
      });
    }
    
    // Create project
    const project = await Project.create({
      projectName,
      pmisCode,
      schemeName,
      landRequired,
      landAvailable,
      landToBeAcquired,
      type,
      description,
      district: location?.district,
      taluka: location?.taluka,
      villages: location?.villages,
      estimatedCost: budget?.estimatedCost,
      allocatedBudget: budget?.allocatedBudget,
      currency: budget?.currency,
      startDate: timeline?.startDate,
      expectedCompletion: timeline?.expectedCompletion,
      stakeholders,
      videoUrl,
      createdBy: req.user.id
    });
    
    const populatedProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: populatedProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Public (temporarily)
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Update fields
    const updateData = {};
    const updateFields = [
      'projectName', 'schemeName', 'landRequired', 'landAvailable', 
      'landToBeAcquired', 'type', 'description', 'stakeholders', 
      'videoUrl', 'isActive'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    // Handle location fields
    if (req.body.location) {
      if (req.body.location.district) updateData.district = req.body.location.district;
      if (req.body.location.taluka) updateData.taluka = req.body.location.taluka;
      if (req.body.location.villages) updateData.villages = req.body.location.villages;
    }
    
    // Handle budget fields
    if (req.body.budget) {
      if (req.body.budget.estimatedCost) updateData.estimatedCost = req.body.budget.estimatedCost;
      if (req.body.budget.allocatedBudget) updateData.allocatedBudget = req.body.budget.allocatedBudget;
      if (req.body.budget.currency) updateData.currency = req.body.budget.currency;
    }
    
    // Handle timeline fields
    if (req.body.timeline) {
      if (req.body.timeline.startDate) updateData.startDate = req.body.timeline.startDate;
      if (req.body.timeline.expectedCompletion) updateData.expectedCompletion = req.body.timeline.expectedCompletion;
    }
    
    // Update status if provided
    if (req.body.status) {
      Object.keys(req.body.status).forEach(key => {
        if (['stage3A', 'stage3D', 'corrigendum', 'award'].includes(key)) {
          updateData[key] = req.body.status[key];
        }
      });
    }
    
    await project.update(updateData);
    
        const updatedProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Public (temporarily)
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await project.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get project statistics
// @route   GET /api/projects/stats/overview
// @access  Public (temporarily)
router.get('/stats/overview', async (req, res) => {
  try {
    // Get all projects for manual aggregation
    const allProjects = await Project.findAll();
    
    // Calculate stats manually
    const stats = [{
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter(p => p.isActive).length,
      totalLandRequired: allProjects.reduce((sum, p) => sum + (parseFloat(p.landRequired) || 0), 0),
      totalLandAvailable: allProjects.reduce((sum, p) => sum + (parseFloat(p.landAvailable) || 0), 0),
      totalLandToBeAcquired: allProjects.reduce((sum, p) => sum + (parseFloat(p.landToBeAcquired) || 0), 0),
      totalBudget: allProjects.reduce((sum, p) => sum + (parseFloat(p.allocatedBudget) || 0), 0)
    }];
    
    const statusStats = [{
      stage3AApproved: allProjects.filter(p => p.stage3AStatus === 'approved').length,
      stage3DApproved: allProjects.filter(p => p.stage3DStatus === 'approved').length,
      corrigendumApproved: allProjects.filter(p => p.corrigendumStatus === 'approved').length,
      awardApproved: allProjects.filter(p => p.awardStatus === 'approved').length
    }];
    
    // Group by type
    const typeMap = {};
    allProjects.forEach(project => {
      const type = project.type || 'unknown';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    
    const typeStats = Object.entries(typeMap).map(([type, count]) => ({
      _id: type,
      count: count
    }));
    
    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalProjects: 0,
          activeProjects: 0,
          totalLandRequired: 0,
          totalLandAvailable: 0,
          totalLandToBeAcquired: 0,
          totalBudget: 0
        },
        status: statusStats[0] || {
          stage3AApproved: 0,
          stage3DApproved: 0,
          corrigendumApproved: 0,
          awardApproved: 0
        },
        byType: typeStats
      }
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Assign officers to project
// @route   PUT /api/projects/:id/assign-officers
// @access  Public (temporarily)
router.put('/:id/assign-officers', async (req, res) => {
  try {
    const { officerIds } = req.body;
    
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await project.update({ assignedOfficers: officerIds });
    
    const updatedProject = await Project.findByPk(project.id);
    
    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error('Assign officers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Assign agents to project
// @route   PUT /api/projects/:id/assign-agents
// @access  Public (temporarily)
router.put('/:id/assign-agents', async (req, res) => {
  try {
    const { agentIds } = req.body;
    
    const project = await Project.findByPk(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await project.update({ assignedAgents: agentIds });
    
    const updatedProject = await Project.findByPk(project.id);
    
    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    console.error('Assign agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router; 