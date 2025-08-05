import express from 'express';
import Project from '../models/Project.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private (Admin, Officer)
router.get('/', authorize('admin', 'officer'), async (req, res) => {
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
    if (district) filter['location.district'] = district;
    if (taluka) filter['location.taluka'] = taluka;
    if (type) filter.type = type;
    if (status) filter[`status.${status}`] = 'approved';
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const projects = await Project.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedOfficers', 'name email')
      .populate('assignedAgents', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Project.countDocuments(filter);
    
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
// @access  Private (Admin, Officer)
router.get('/:id', authorize('admin', 'officer'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedOfficers', 'name email')
      .populate('assignedAgents', 'name email');
    
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
// @access  Private (Admin, Officer)
router.post('/', authorize('admin', 'officer'), async (req, res) => {
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
    const existingProject = await Project.findOne({ pmisCode });
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
      location,
      budget,
      timeline,
      stakeholders,
      videoUrl,
      createdBy: req.user.id
    });
    
    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email');
    
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
// @access  Private (Admin, Officer)
router.put('/:id', authorize('admin', 'officer'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Update fields
    const updateFields = [
      'projectName', 'schemeName', 'landRequired', 'landAvailable', 
      'landToBeAcquired', 'type', 'description', 'location', 'budget', 
      'timeline', 'stakeholders', 'videoUrl', 'isActive'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });
    
    // Update status if provided
    if (req.body.status) {
      Object.keys(req.body.status).forEach(key => {
        if (project.status[key] !== undefined) {
          project.status[key] = req.body.status[key];
        }
      });
    }
    
    await project.save();
    
    const updatedProject = await Project.findById(project._id)
      .populate('createdBy', 'name email')
      .populate('assignedOfficers', 'name email')
      .populate('assignedAgents', 'name email');
    
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
// @access  Private (Admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
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
// @access  Private (Admin, Officer)
router.get('/stats/overview', authorize('admin', 'officer'), async (req, res) => {
  try {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: null,
          totalProjects: { $sum: 1 },
          activeProjects: { 
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalLandRequired: { $sum: '$landRequired' },
          totalLandAvailable: { $sum: '$landAvailable' },
          totalLandToBeAcquired: { $sum: '$landToBeAcquired' },
          totalBudget: { $sum: '$budget.allocatedBudget' }
        }
      }
    ]);
    
    const statusStats = await Project.aggregate([
      {
        $group: {
          _id: null,
          stage3AApproved: { 
            $sum: { $cond: [{ $eq: ['$status.stage3A', 'approved'] }, 1, 0] }
          },
          stage3DApproved: { 
            $sum: { $cond: [{ $eq: ['$status.stage3D', 'approved'] }, 1, 0] }
          },
          corrigendumApproved: { 
            $sum: { $cond: [{ $eq: ['$status.corrigendum', 'approved'] }, 1, 0] }
          },
          awardApproved: { 
            $sum: { $cond: [{ $eq: ['$status.award', 'approved'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const typeStats = await Project.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
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
// @access  Private (Admin only)
router.put('/:id/assign-officers', authorize('admin'), async (req, res) => {
  try {
    const { officerIds } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    project.assignedOfficers = officerIds;
    await project.save();
    
    const updatedProject = await Project.findById(project._id)
      .populate('assignedOfficers', 'name email');
    
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
// @access  Private (Admin, Officer)
router.put('/:id/assign-agents', authorize('admin', 'officer'), async (req, res) => {
  try {
    const { agentIds } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    project.assignedAgents = agentIds;
    await project.save();
    
    const updatedProject = await Project.findById(project._id)
      .populate('assignedAgents', 'name email');
    
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