import express from 'express';
import MongoProject from '../models/mongo/Project.js';
import MongoUser from '../models/mongo/User.js';
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
    const filter = {};
    if (district) filter.district = district;
    if (taluka) filter.taluka = taluka;
    if (type) filter.type = type;
    if (status) filter['status.overall'] = status;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const projects = await MongoProject.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await MongoProject.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: projects.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: projects.map(project => ({
        id: project._id,
        projectName: project.projectName,
        pmisCode: project.pmisCode,
        schemeName: project.schemeName,
        landRequired: project.landRequired,
        landAvailable: project.landAvailable,
        landToBeAcquired: project.landToBeAcquired,
        type: project.type,
        district: project.district,
        taluka: project.taluka,
        villages: project.villages,
        estimatedCost: project.estimatedCost,
        allocatedBudget: project.allocatedBudget,
        currency: project.currency,
        startDate: project.startDate,
        expectedCompletion: project.expectedCompletion,
        status: project.status,
        createdBy: project.createdBy ? {
          id: project.createdBy._id,
          name: project.createdBy.name,
          email: project.createdBy.email
        } : null,
        description: project.description,
        descriptionDetails: project.descriptionDetails,
        videoUrl: project.videoUrl,
        stakeholders: project.stakeholders,
        progress: project.progress,
        isActive: project.isActive,
        assignedOfficers: project.assignedOfficers,
        assignedAgents: project.assignedAgents,
        created_at: project.createdAt,
        updated_at: project.updatedAt
      }))
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
    const project = await MongoProject.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: project._id,
        projectName: project.projectName,
        pmisCode: project.pmisCode,
        schemeName: project.schemeName,
        landRequired: project.landRequired,
        landAvailable: project.landAvailable,
        landToBeAcquired: project.landToBeAcquired,
        type: project.type,
        district: project.district,
        taluka: project.taluka,
        villages: project.villages,
        estimatedCost: project.estimatedCost,
        allocatedBudget: project.allocatedBudget,
        currency: project.currency,
        startDate: project.startDate,
        expectedCompletion: project.expectedCompletion,
        status: project.status,
        createdBy: project.createdBy ? {
          id: project.createdBy._id,
          name: project.createdBy.name,
          email: project.createdBy.email
        } : null,
        description: project.description,
        descriptionDetails: project.descriptionDetails,
        videoUrl: project.videoUrl,
        stakeholders: project.stakeholders,
        isActive: project.isActive,
        assignedOfficers: project.assignedOfficers,
        assignedAgents: project.assignedAgents,
        progress: project.progress,
        created_at: project.createdAt,
        updated_at: project.updatedAt
      }
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
// @access  Private (Officer/Admin)
router.post('/', authorize(['officer', 'admin']), async (req, res) => {
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
      descriptionDetails,
      location,
      budget,
      timeline,
      stakeholders,
      videoUrl,
      status
    } = req.body;
    
    // Check if PMIS code already exists
    const existingProject = await MongoProject.findOne({ pmisCode });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: 'Project with this PMIS code already exists'
      });
    }
    
    // Normalize status (supports both new nested object and legacy root fields)
    const normalizedStatus = {
      overall: status?.overall || 'planning',
      stage3A: status?.stage3A || req.body.stage3A || 'pending',
      stage3D: status?.stage3D || req.body.stage3D || 'pending',
      corrigendum: status?.corrigendum || req.body.corrigendum || 'pending',
      award: status?.award || req.body.award || 'pending'
    };

    // Create project
    const project = await MongoProject.create({
      projectName,
      pmisCode,
      schemeName,
      landRequired,
      landAvailable,
      landToBeAcquired,
      type,
      description,
      descriptionDetails,
      district: location?.district,
      taluka: location?.taluka,
      villages: location?.villages,
      estimatedCost: budget?.estimatedCost,
      allocatedBudget: budget?.allocatedBudget,
      currency: budget?.currency,
      startDate: timeline?.startDate,
      expectedCompletion: timeline?.expectedCompletion,
      status: normalizedStatus,
      stakeholders,
      videoUrl,
      createdBy: req.user.id
    });
    
    const populatedProject = await MongoProject.findById(project._id)
      .populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      data: {
        id: populatedProject._id,
        projectName: populatedProject.projectName,
        pmisCode: populatedProject.pmisCode,
        schemeName: populatedProject.schemeName,
        landRequired: populatedProject.landRequired,
        landAvailable: populatedProject.landAvailable,
        landToBeAcquired: populatedProject.landToBeAcquired,
        type: populatedProject.type,
        district: populatedProject.district,
        taluka: populatedProject.taluka,
        villages: populatedProject.villages,
        estimatedCost: populatedProject.estimatedCost,
        allocatedBudget: populatedProject.allocatedBudget,
        currency: populatedProject.currency,
        startDate: populatedProject.startDate,
        expectedCompletion: populatedProject.expectedCompletion,
        status: populatedProject.status,
        createdBy: populatedProject.createdBy ? {
          id: populatedProject.createdBy._id,
          name: populatedProject.createdBy.name,
          email: populatedProject.createdBy.email
        } : null,
        description: populatedProject.description,
        descriptionDetails: populatedProject.descriptionDetails,
        videoUrl: populatedProject.videoUrl,
        stakeholders: populatedProject.stakeholders,
        progress: populatedProject.progress,
        isActive: populatedProject.isActive,
        assignedOfficers: populatedProject.assignedOfficers,
        assignedAgents: populatedProject.assignedAgents,
        created_at: populatedProject.createdAt,
        updated_at: populatedProject.updatedAt
      }
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
// @access  Private (Officer/Admin)
router.put('/:id', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const project = await MongoProject.findById(req.params.id);
    
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
      'landToBeAcquired', 'type', 'description', 'descriptionDetails', 'stakeholders', 
      'videoUrl', 'isActive', 'pmisCode'
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
    
    // Update status if provided (nested under status.*) and accept legacy root keys
    if (req.body.status) {
      const st = req.body.status;
      if (st.overall) updateData['status.overall'] = st.overall;
      if (st.stage3A) updateData['status.stage3A'] = st.stage3A;
      if (st.stage3D) updateData['status.stage3D'] = st.stage3D;
      if (st.corrigendum) updateData['status.corrigendum'] = st.corrigendum;
      if (st.award) updateData['status.award'] = st.award;
    }
    if (req.body.stage3A) updateData['status.stage3A'] = req.body.stage3A;
    if (req.body.stage3D) updateData['status.stage3D'] = req.body.stage3D;
    if (req.body.corrigendum) updateData['status.corrigendum'] = req.body.corrigendum;
    if (req.body.award) updateData['status.award'] = req.body.award;

    // Use document set/save for reliability with dotted paths
    project.set(updateData);
    await project.save();
    const updatedProject = await MongoProject.findById(project._id).populate('createdBy', 'name email');
    res.status(200).json({
      success: true,
      data: {
        id: updatedProject._id,
        projectName: updatedProject.projectName,
        pmisCode: updatedProject.pmisCode,
        schemeName: updatedProject.schemeName,
        landRequired: updatedProject.landRequired,
        landAvailable: updatedProject.landAvailable,
        landToBeAcquired: updatedProject.landToBeAcquired,
        type: updatedProject.type,
        district: updatedProject.district,
        taluka: updatedProject.taluka,
        villages: updatedProject.villages,
        estimatedCost: updatedProject.estimatedCost,
        allocatedBudget: updatedProject.allocatedBudget,
        currency: updatedProject.currency,
        startDate: updatedProject.startDate,
        expectedCompletion: updatedProject.expectedCompletion,
        status: updatedProject.status,
        createdBy: updatedProject.createdBy ? {
          id: updatedProject.createdBy._id,
          name: updatedProject.createdBy.name,
          email: updatedProject.createdBy.email
        } : null,
        description: updatedProject.description,
        descriptionDetails: updatedProject.descriptionDetails,
        videoUrl: updatedProject.videoUrl,
        stakeholders: updatedProject.stakeholders,
        progress: updatedProject.progress,
        isActive: updatedProject.isActive,
        assignedOfficers: updatedProject.assignedOfficers,
        assignedAgents: updatedProject.assignedAgents,
        created_at: updatedProject.createdAt,
        updated_at: updatedProject.updatedAt
      }
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
// @access  Private (Officer/Admin)
router.delete('/:id', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const project = await MongoProject.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await project.deleteOne();
    
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
    const allProjects = await MongoProject.find({});
    
    // Calculate stats manually
    const stats = [{
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter(p => p.isActive || p?.status?.overall === 'active').length,
      totalLandRequired: allProjects.reduce((sum, p) => sum + (parseFloat(p.landRequired) || 0), 0),
      totalLandAvailable: allProjects.reduce((sum, p) => sum + (parseFloat(p.landAvailable) || 0), 0),
      totalLandToBeAcquired: allProjects.reduce((sum, p) => sum + (parseFloat(p.landToBeAcquired) || 0), 0),
      totalBudget: allProjects.reduce((sum, p) => sum + (parseFloat(p.allocatedBudget) || 0), 0)
    }];
    
    const statusStats = [{
      stage3AApproved: allProjects.filter(p => p?.status?.stage3A === 'approved').length,
      stage3DApproved: allProjects.filter(p => p?.status?.stage3D === 'approved').length,
      corrigendumApproved: allProjects.filter(p => p?.status?.corrigendum === 'approved').length,
      awardApproved: allProjects.filter(p => p?.status?.award === 'approved').length
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
// @access  Private (Officer/Admin)
router.put('/:id/assign-officers', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { officerIds } = req.body;
    
    const project = await MongoProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await project.update({ assignedOfficers: officerIds });
    
    const updatedProject = await MongoProject.findById(project._id);
    
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
// @access  Private (Officer/Admin)
router.put('/:id/assign-agents', authorize(['officer', 'admin']), async (req, res) => {
  try {
    const { agentIds } = req.body;
    
    const project = await MongoProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await project.update({ assignedAgents: agentIds });
    
    const updatedProject = await MongoProject.findById(project._id);
    
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