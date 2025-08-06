import express from 'express';
import LandownerRecord from '../models/LandownerRecord.js';
import Project from '../models/Project.js';
import { authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get village-wise summary for project
// @route   GET /api/villages/summary/:projectId
// @access  Public (temporarily)
router.get('/summary/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const villageSummary = await LandownerRecord.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: '$village',
          villageName: { $first: '$village' },
          totalLandowners: { $sum: 1 },
          totalCompensation: { $sum: { $toDouble: '$अंतिम_रक्कम' } },
          totalArea: { $sum: { $toDouble: '$क्षेत्र' } },
          totalAcquiredArea: { $sum: { $toDouble: '$संपादित_क्षेत्र' } },
          noticesGenerated: { $sum: { $cond: ['$noticeGenerated', 1, 0] } },
          kycPending: { $sum: { $cond: [{ $eq: ['$kycStatus', 'pending'] }, 1, 0] } },
          kycInProgress: { $sum: { $cond: [{ $eq: ['$kycStatus', 'in_progress'] }, 1, 0] } },
          kycCompleted: { $sum: { $cond: [{ $eq: ['$kycStatus', 'completed'] }, 1, 0] } },
          kycApproved: { $sum: { $cond: [{ $eq: ['$kycStatus', 'approved'] }, 1, 0] } },
          kycRejected: { $sum: { $cond: [{ $eq: ['$kycStatus', 'rejected'] }, 1, 0] } },
          paymentsPending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } },
          paymentsInitiated: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'initiated'] }, 1, 0] } },
          paymentsSuccess: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'success'] }, 1, 0] } },
          paymentsFailed: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'failed'] }, 1, 0] } },
          totalPaid: { 
            $sum: { 
              $cond: [
                { $eq: ['$paymentStatus', 'success'] }, 
                { $toDouble: '$अंतिम_रक्कम' }, 
                0
              ] 
            } 
          }
        }
      },
      { $sort: { totalLandowners: -1 } }
    ]);

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

    const filter = { 
      projectId, 
      village: decodeURIComponent(villageName)
    };
    
    if (kycStatus) filter.kycStatus = kycStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (assignedAgent) filter.assignedAgent = assignedAgent;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const records = await LandownerRecord.find(filter)
      .populate('assignedAgent', 'name email phone')
      .populate('projectId', 'projectName pmisCode')
      .sort({ 'खातेदाराचे_नांव': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LandownerRecord.countDocuments(filter);

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
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get overall project statistics
    const overallStats = await LandownerRecord.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalCompensation: { $sum: { $toDouble: '$अंतिम_रक्कम' } },
          noticesGenerated: { $sum: { $cond: ['$noticeGenerated', 1, 0] } },
          kycApproved: { $sum: { $cond: [{ $eq: ['$kycStatus', 'approved'] }, 1, 0] } },
          paymentsCompleted: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'success'] }, 1, 0] } },
          totalPaid: { 
            $sum: { 
              $cond: [
                { $eq: ['$paymentStatus', 'success'] }, 
                { $toDouble: '$अंतिम_रक्कम' }, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    // Get village-wise progress
    const villageProgress = await LandownerRecord.aggregate([
      { $match: { projectId } },
      {
        $group: {
          _id: '$village',
          villageName: { $first: '$village' },
          totalRecords: { $sum: 1 },
          progressPercentage: {
            $multiply: [
              {
                $divide: [
                  { $sum: { $cond: [{ $eq: ['$paymentStatus', 'success'] }, 1, 0] } },
                  { $sum: 1 }
                ]
              },
              100
            ]
          },
          noticeProgress: {
            $multiply: [
              {
                $divide: [
                  { $sum: { $cond: ['$noticeGenerated', 1, 0] } },
                  { $sum: 1 }
                ]
              },
              100
            ]
          },
          kycProgress: {
            $multiply: [
              {
                $divide: [
                  { $sum: { $cond: [{ $eq: ['$kycStatus', 'approved'] }, 1, 0] } },
                  { $sum: 1 }
                ]
              },
              100
            ]
          },
          paymentProgress: {
            $multiply: [
              {
                $divide: [
                  { $sum: { $cond: [{ $eq: ['$paymentStatus', 'success'] }, 1, 0] } },
                  { $sum: 1 }
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { progressPercentage: -1 } }
    ]);

    // Calculate project completion percentage
    const stats = overallStats[0] || {};
    const projectCompletion = stats.totalRecords > 0 
      ? Math.round((stats.paymentsCompleted / stats.totalRecords) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        project: {
          id: project._id,
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

    const agentWorkload = await LandownerRecord.aggregate([
      {
        $match: { 
          projectId,
          assignedAgent: { $exists: true, $ne: null }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedAgent',
          foreignField: '_id',
          as: 'agentInfo'
        }
      },
      { $unwind: '$agentInfo' },
      {
        $group: {
          _id: {
            agentId: '$assignedAgent',
            village: '$village'
          },
          agentName: { $first: '$agentInfo.name' },
          agentEmail: { $first: '$agentInfo.email' },
          village: { $first: '$village' },
          totalAssigned: { $sum: 1 },
          kycCompleted: { $sum: { $cond: [{ $in: ['$kycStatus', ['completed', 'approved']] }, 1, 0] } },
          paymentsCompleted: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'success'] }, 1, 0] } }
        }
      },
      {
        $group: {
          _id: '$_id.agentId',
          agentName: { $first: '$agentName' },
          agentEmail: { $first: '$agentEmail' },
          villages: {
            $push: {
              village: '$village',
              totalAssigned: '$totalAssigned',
              kycCompleted: '$kycCompleted',
              paymentsCompleted: '$paymentsCompleted'
            }
          },
          totalAssigned: { $sum: '$totalAssigned' },
          totalKycCompleted: { $sum: '$kycCompleted' },
          totalPaymentsCompleted: { $sum: '$paymentsCompleted' }
        }
      },
      { $sort: { totalAssigned: -1 } }
    ]);

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