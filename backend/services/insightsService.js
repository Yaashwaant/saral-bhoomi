import mongoose from 'mongoose';
import MongoProject from '../models/mongo/Project.js';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoPayment from '../models/mongo/Payment.js';
import MongoNotice from '../models/mongo/Notice.js';

const parseDate = (value) => {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
};

const buildCommonMatch = (filters = {}) => {
  const { projectId, district, taluka, village, from, to, isTribal } = filters;
  const match = {};
  if (projectId) match.project_id = typeof projectId === 'string' ? parseObjectId(projectId) || projectId : projectId;
  if (district) match.district = district;
  if (taluka) match.taluka = taluka;
  if (village) match.village = village;
  if (typeof isTribal === 'boolean') match.is_tribal = isTribal;
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  return { match, fromDate, toDate };
};

const parseObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
};

export async function getOverviewKPIs(filters = {}) {
  const { match, fromDate, toDate } = buildCommonMatch(filters);

  // Projects
  const projectMatch = {};
  if (filters.projectId) projectMatch._id = filters.projectId;
  if (filters.district) projectMatch.district = filters.district;
  if (filters.taluka) projectMatch.taluka = filters.taluka;

  const [projectsAgg] = await MongoProject.aggregate([
    { $match: projectMatch },
    {
      $group: {
        _id: null,
        totalProjects: { $sum: 1 },
        activeProjects: { $sum: { $cond: [{ $ifNull: ['$isActive', false] }, 1, 0] } },
        totalBudgetAllocated: { $sum: { $ifNull: ['$allocatedBudget', 0] } }
      }
    }
  ]);

  // Payments (status filterable)
  const requestedStatus = filters.paymentStatus;
  const paymentStatus = requestedStatus && requestedStatus !== 'all' ? requestedStatus : 'completed';
  const paymentDateMatch = { payment_status: paymentStatus };
  if (fromDate || toDate) {
    paymentDateMatch.payment_date = {};
    if (fromDate) paymentDateMatch.payment_date.$gte = fromDate;
    if (toDate) paymentDateMatch.payment_date.$lte = toDate;
  }
  // If location/tribal filters provided, join with landowner records on survey_number
  const needsLocationFilter = !!(match.district || match.taluka || match.village || typeof match.is_tribal === 'boolean' || match.project_id);
  const paymentsPipeline = [];
  paymentsPipeline.push({ $match: paymentDateMatch });
  if (needsLocationFilter) {
    paymentsPipeline.push({
      $lookup: {
        from: 'landownerrecords',
        localField: 'survey_number',
        foreignField: 'survey_number',
        as: 'lor'
      }
    });
    paymentsPipeline.push({ $unwind: '$lor' });
    const locMatch = {};
    if (match.project_id) locMatch['lor.project_id'] = match.project_id;
    if (match.district) locMatch['lor.district'] = match.district;
    if (match.taluka) locMatch['lor.taluka'] = match.taluka;
    if (match.village) locMatch['lor.village'] = match.village;
    if (typeof match.is_tribal === 'boolean') locMatch['lor.is_tribal'] = match.is_tribal;
    paymentsPipeline.push({ $match: locMatch });
  } else if (match.project_id) {
    paymentsPipeline.push({ $match: { project_id: match.project_id } });
  }
  paymentsPipeline.push({
    $group: {
      _id: null,
      paymentsCount: { $sum: 1 },
      budgetSum: { $sum: { $ifNull: ['$amount', 0] } }
    }
  });
  const [paymentsAgg] = await MongoPayment.aggregate(paymentsPipeline);

  // Notices issued
  const noticeMatch = {};
  if (fromDate || toDate) {
    noticeMatch.notice_date = {};
    if (fromDate) noticeMatch.notice_date.$gte = fromDate;
    if (toDate) noticeMatch.notice_date.$lte = toDate;
  }
  // Apply location filters to notices via join with landowner records
  let noticesIssued = 0;
  if (match.district || match.taluka || match.village || typeof match.is_tribal === 'boolean') {
    const pipeline = [
      { $match: noticeMatch },
      {
        $lookup: {
          from: 'landownerrecords',
          localField: 'survey_number',
          foreignField: 'survey_number',
          as: 'lor'
        }
      },
      { $unwind: '$lor' }
    ];
    const loc = {};
    if (match.project_id) loc['lor.project_id'] = match.project_id;
    if (match.district) loc['lor.district'] = match.district;
    if (match.taluka) loc['lor.taluka'] = match.taluka;
    if (match.village) loc['lor.village'] = match.village;
    if (typeof match.is_tribal === 'boolean') loc['lor.is_tribal'] = match.is_tribal;
    if (Object.keys(loc).length > 0) pipeline.push({ $match: loc });
    pipeline.push({ $count: 'count' });
    const res = await MongoNotice.aggregate(pipeline);
    noticesIssued = res?.[0]?.count || 0;
  } else {
    // Fallback by project if provided
    if (match.project_id) noticeMatch.project_id = match.project_id;
    noticesIssued = await MongoNotice.countDocuments(noticeMatch);
  }

  // KYC completed (approved)
  const kycMatch = { ...match, kyc_status: 'approved' };
  const kycCompleted = await MongoLandownerRecord.countDocuments(kycMatch);
  // KYC pending (pending or in_progress)
  const kycPending = await MongoLandownerRecord.countDocuments({
    ...match,
    kyc_status: { $in: ['pending', 'in_progress'] }
  });

  // Total acquired area (Ha) – sum acquired_area, fallback 0 if null
  const [areaAgg] = await MongoLandownerRecord.aggregate([
    { $match: { ...match } },
    {
      $group: {
        _id: null,
        totalAcquiredArea: { $sum: { $ifNull: ['$acquired_area', 0] } },
        totalArea: { $sum: { $ifNull: ['$area', 0] } }
      }
    }
  ]);

  return {
    totalProjects: projectsAgg?.totalProjects || 0,
    activeProjects: projectsAgg?.activeProjects || 0,
    totalBudgetAllocated: projectsAgg?.totalBudgetAllocated || 0,
    budgetSpentToDate: paymentsAgg?.budgetSum || 0,
    paymentsCompletedCount: paymentsAgg?.paymentsCount || 0,
    noticesIssued: noticesIssued || 0,
    kycCompleted: kycCompleted || 0,
    kycPending: kycPending || 0,
    totalAcquiredArea: areaAgg?.totalAcquiredArea || 0,
    totalAreaLoaded: areaAgg?.totalArea || 0
  };
}


