import express from 'express';
import LandownerRecord from '../models/LandownerRecord.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import sequelize from '../config/database.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get village-wise summary for project
// @route   GET /api/villages/summary/:projectId
// @access  Public (temporarily)
router.get('/summary/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const records = await LandownerRecord.findAll({
      where: { projectId }
    });

    // Group by village
    const villageMap = {};
    records.forEach(record => {
      const village = record.village;
      if (!villageMap[village]) {
        villageMap[village] = {
          villageName: village,
          totalLandowners: 0,
          totalCompensation: 0,
          totalArea: 0,
          totalAcquiredArea: 0,
          noticesGenerated: 0,
          kycPending: 0,
          kycInProgress: 0,
          kycCompleted: 0,
          kycApproved: 0,
          kycRejected: 0,
          paymentsPending: 0,
          paymentsInitiated: 0,
          paymentsSuccess: 0,
          paymentsFailed: 0,
          totalPaid: 0
        };
      }
      
      const summary = villageMap[village];
      summary.totalLandowners++;
      summary.totalCompensation += parseFloat(record.अंतिम_रक्कम) || 0;
      summary.totalArea += parseFloat(record.क्षेत्र) || 0;
      summary.totalAcquiredArea += parseFloat(record.संपादित_क्षेत्र) || 0;
      if (record.noticeGenerated) summary.noticesGenerated++;
      
      // KYC status counts
      switch (record.kycStatus) {
        case 'pending': summary.kycPending++; break;
        case 'in_progress': summary.kycInProgress++; break;
        case 'completed': summary.kycCompleted++; break;
        case 'approved': summary.kycApproved++; break;
        case 'rejected': summary.kycRejected++; break;
      }
      
      // Payment status counts
      switch (record.paymentStatus) {
        case 'pending': summary.paymentsPending++; break;
        case 'initiated': summary.paymentsInitiated++; break;
        case 'success': 
          summary.paymentsSuccess++; 
          summary.totalPaid += parseFloat(record.अंतिम_रक्कम) || 0;
          break;
        case 'failed': summary.paymentsFailed++; break;
      }
    });

    const villageSummary = Object.values(villageMap).sort((a, b) => b.totalLandowners - a.totalLandowners);

    res.status(200).json({
      success: true,
      count: villageSummary.length,
      data: villageSummary
    });

  } catch (error) {
    console.error('Get village summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching village summary'
    });
  }
});

// @desc    Get detailed records for a specific village
// @route   GET /api/villages/details/:projectId/:villageName
// @access  Public (temporarily)
router.get('/details/:projectId/:villageName', async (req, res) => {
  try {
    const { projectId, villageName } = req.params;
    const { 
      page = 1, 
      limit = 10,
      kycStatus,
      paymentStatus,
      assignedAgent
    } = req.query;

    const where = { 
      projectId, 
      village: decodeURIComponent(villageName)
    };
    
    if (kycStatus) where.kycStatus = kycStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (assignedAgent) where.assignedAgent = assignedAgent;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const records = await LandownerRecord.findAll({
      where,
      include: [
        { model: User, as: 'assignedAgentUser', attributes: ['name', 'email', 'phone'] },
        { model: Project, attributes: ['projectName', 'pmisCode'] }
      ],
      order: [['खातेदाराचे_नांव', 'ASC']],
      offset,
      limit: parseInt(limit)
    });

    const total = await LandownerRecord.count({ where });

    res.status(200).json({
      success: true,
      village: decodeURIComponent(villageName),
      count: records.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: records
    });

  } catch (error) {
    console.error('Get village details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching village details'
    });
  }
});

// @desc    Get progress report for all villages in project
// @route   GET /api/villages/progress/:projectId
// @access  Public (temporarily)
router.get('/progress/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get project details
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get overall project statistics
    const records = await LandownerRecord.findAll({
      where: { projectId }
    });

    const overallStats = {
      totalRecords: records.length,
      totalCompensation: records.reduce((sum, r) => sum + (parseFloat(r.अंतिम_रक्कम) || 0), 0),
      noticesGenerated: records.filter(r => r.noticeGenerated).length,
      kycApproved: records.filter(r => r.kycStatus === 'approved').length,
      paymentsCompleted: records.filter(r => r.paymentStatus === 'success').length,
      totalPaid: records
        .filter(r => r.paymentStatus === 'success')
        .reduce((sum, r) => sum + (parseFloat(r.अंतिम_रक्कम) || 0), 0)
    };

    // Get village-wise progress
    const villageMap = {};
    records.forEach(record => {
      const village = record.village;
      if (!villageMap[village]) {
        villageMap[village] = {
          villageName: village,
          totalRecords: 0,
          paymentsCompleted: 0,
          noticesGenerated: 0,
          kycApproved: 0
        };
      }
      
      const progress = villageMap[village];
      progress.totalRecords++;
      if (record.paymentStatus === 'success') progress.paymentsCompleted++;
      if (record.noticeGenerated) progress.noticesGenerated++;
      if (record.kycStatus === 'approved') progress.kycApproved++;
    });

    const villageProgress = Object.values(villageMap).map(progress => ({
      ...progress,
      progressPercentage: progress.totalRecords > 0 ? Math.round((progress.paymentsCompleted / progress.totalRecords) * 100) : 0,
      noticeProgress: progress.totalRecords > 0 ? Math.round((progress.noticesGenerated / progress.totalRecords) * 100) : 0,
      kycProgress: progress.totalRecords > 0 ? Math.round((progress.kycApproved / progress.totalRecords) * 100) : 0,
      paymentProgress: progress.totalRecords > 0 ? Math.round((progress.paymentsCompleted / progress.totalRecords) * 100) : 0
    })).sort((a, b) => b.progressPercentage - a.progressPercentage);

    // Calculate project completion percentage
    const stats = overallStats;
    const projectCompletion = stats.totalRecords > 0 
      ? Math.round((stats.paymentsCompleted / stats.totalRecords) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.projectName,
          pmisCode: project.pmisCode,
          completionPercentage: projectCompletion
        },
        overallStats: {
          ...stats,
          completionPercentage: projectCompletion
        },
        villageProgress
      }
    });

  } catch (error) {
    console.error('Get village progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching village progress'
    });
  }
});

// @desc    Get agent workload by village
// @route   GET /api/villages/agent-workload/:projectId
// @access  Public (temporarily)
router.get('/agent-workload/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const records = await LandownerRecord.findAll({
      where: { 
        projectId,
        assignedAgent: { [sequelize.Op.ne]: null }
      },
      include: [
        { model: User, as: 'assignedAgentUser', attributes: ['name', 'email'] }
      ]
    });

    // Group by agent and village
    const agentMap = {};
    records.forEach(record => {
      if (!record.assignedAgentUser) return;
      
      const agentId = record.assignedAgent;
      const village = record.village;
      
      if (!agentMap[agentId]) {
        agentMap[agentId] = {
          agentId,
          agentName: record.assignedAgentUser.name,
          agentEmail: record.assignedAgentUser.email,
          villages: {},
          totalAssigned: 0,
          totalKycCompleted: 0,
          totalPaymentsCompleted: 0
        };
      }
      
      const agent = agentMap[agentId];
      agent.totalAssigned++;
      
      if (['completed', 'approved'].includes(record.kycStatus)) {
        agent.totalKycCompleted++;
      }
      if (record.paymentStatus === 'success') {
        agent.totalPaymentsCompleted++;
      }
      
      if (!agent.villages[village]) {
        agent.villages[village] = {
          village,
          totalAssigned: 0,
          kycCompleted: 0,
          paymentsCompleted: 0
        };
      }
      
      agent.villages[village].totalAssigned++;
      if (['completed', 'approved'].includes(record.kycStatus)) {
        agent.villages[village].kycCompleted++;
      }
      if (record.paymentStatus === 'success') {
        agent.villages[village].paymentsCompleted++;
      }
    });

    const agentWorkload = Object.values(agentMap)
      .map(agent => ({
        ...agent,
        villages: Object.values(agent.villages)
      }))
      .sort((a, b) => b.totalAssigned - a.totalAssigned);

    res.status(200).json({
      success: true,
      count: agentWorkload.length,
      data: agentWorkload
    });

  } catch (error) {
    console.error('Get agent workload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching agent workload'
    });
  }
});

export default router; 