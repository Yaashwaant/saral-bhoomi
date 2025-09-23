import express from 'express';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import MongoUser from '../models/mongo/User.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get village-wise summary for project
// @route   GET /api/villages/summary/:projectId
// @access  Public (temporarily)
router.get('/summary/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const records = await MongoLandownerRecord.find({ project_id: projectId });

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
      summary.totalCompensation += parseFloat(record.final_amount) || 0;
      summary.totalArea += parseFloat(record.area) || 0;
      summary.totalAcquiredArea += parseFloat(record.acquired_area) || 0;
      if (record.notice_generated) summary.noticesGenerated++;
      
      // KYC status counts
      switch (record.kyc_status) {
        case 'pending': summary.kycPending++; break;
        case 'in_progress': summary.kycInProgress++; break;
        case 'completed': summary.kycCompleted++; break;
        case 'approved': summary.kycApproved++; break;
        case 'rejected': summary.kycRejected++; break;
      }
      
      // Payment status counts
      switch (record.payment_status) {
        case 'pending': summary.paymentsPending++; break;
        case 'initiated': summary.paymentsInitiated++; break;
        case 'success': 
          summary.paymentsSuccess++; 
          summary.totalPaid += parseFloat(record.final_amount) || 0;
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

    const records = await MongoLandownerRecord.find(where)
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ landowner_name: 1 }); // Assuming landowner_name is the sort field

    const total = await MongoLandownerRecord.countDocuments(where);

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
    const project = await MongoProject.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get overall project statistics
    const records = await MongoLandownerRecord.find({ project_id: projectId });

    const overallStats = {
      totalRecords: records.length,
      totalCompensation: records.reduce((sum, r) => sum + (parseFloat(r.final_amount) || 0), 0),
      noticesGenerated: records.filter(r => r.notice_generated).length,
      kycApproved: records.filter(r => r.kyc_status === 'approved').length,
      paymentsCompleted: records.filter(r => r.payment_status === 'success').length,
      totalPaid: records
        .filter(r => r.payment_status === 'success')
        .reduce((sum, r) => sum + (parseFloat(r.final_amount) || 0), 0)
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
      if (record.payment_status === 'success') progress.paymentsCompleted++;
      if (record.notice_generated) progress.noticesGenerated++;
      if (record.kyc_status === 'approved') progress.kycApproved++;
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
          id: project._id,
          name: project.project_name,
          pmisCode: project.pmis_code,
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

    const records = await MongoLandownerRecord.find({ 
      project_id: projectId,
      assigned_agent: { $ne: null }
    }).populate('assigned_agent');

    // Group by agent and village
    const agentMap = {};
    records.forEach(record => {
      if (!record.assigned_agent) return;
      
      const agentId = record.assigned_agent._id;
      const village = record.village;
      
      if (!agentMap[agentId]) {
        agentMap[agentId] = {
          agentId,
          agentName: record.assigned_agent.name,
          agentEmail: record.assigned_agent.email,
          villages: {},
          totalAssigned: 0,
          totalKycCompleted: 0,
          totalPaymentsCompleted: 0
        };
      }
      
      const agent = agentMap[agentId];
      agent.totalAssigned++;
      
      if (['completed', 'approved'].includes(record.kyc_status)) {
        agent.totalKycCompleted++;
      }
      if (record.payment_status === 'success') {
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
      if (['completed', 'approved'].includes(record.kyc_status)) {
        agent.villages[village].kycCompleted++;
      }
      if (record.payment_status === 'success') {
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