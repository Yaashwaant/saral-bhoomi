import mongoose from 'mongoose';
import MongoJMRRecord from '../models/mongo/JMRRecord.js';
import MongoNotice from '../models/mongo/Notice.js';
import CompleteEnglishLandownerRecord from '../models/mongo/CompleteEnglishLandownerRecord.js';
import MongoPayment from '../models/mongo/Payment.js';
import MongoAward from '../models/mongo/Award.js';
import MongoBlockchainLedger from '../models/mongo/BlockchainLedger.js';
import MongoProject from '../models/mongo/Project.js';

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

  // Payments (status filterable) - combine data from both collections
  const requestedStatus = filters.paymentStatus;
  const paymentStatus = requestedStatus && requestedStatus !== 'all' ? requestedStatus : 'completed';

  // Build match for English complete records
  const englishMatch = { ...match };
  if (englishMatch.project_id) {
    englishMatch.project_id = typeof englishMatch.project_id === 'string' ? parseObjectId(englishMatch.project_id) || englishMatch.project_id : englishMatch.project_id;
  }
  
  // For English complete records, we'll use compensation_distribution_status as payment status
  const englishPaymentMatch = { ...englishMatch };
  if (paymentStatus === 'completed') {
    englishPaymentMatch.compensation_distribution_status = { $in: ['completed', 'distributed', 'paid'] };
  } else if (paymentStatus === 'pending') {
    englishPaymentMatch.compensation_distribution_status = { $in: ['pending', 'initiated'] };
  }

  // Add date filtering if provided (assuming updated_at field for payment completion date)
  if (fromDate || toDate) {
    englishPaymentMatch.updated_at = {};
    if (fromDate) englishPaymentMatch.updated_at.$gte = fromDate;
    if (toDate) englishPaymentMatch.updated_at.$lte = toDate;
  }

  // Payments completed from regular landowner records
  const paymentMatch = { ...match, payment_status: paymentStatus };
  if (fromDate || toDate) {
    paymentMatch.updatedAt = {};
    if (fromDate) paymentMatch.updatedAt.$gte = fromDate;
    if (toDate) paymentMatch.updatedAt.$lte = toDate;
  }

  // Query English collection for payment data
  const [englishPaymentsAgg] = await CompleteEnglishLandownerRecord.aggregate([
    { $match: englishPaymentMatch },
    {
      $group: {
        _id: null,
        paymentsCount: { $sum: 1 },
        budgetSum: { $sum: { $ifNull: ['$final_payable_compensation', 0] } }
      }
    }
  ]);

  // Use only English collection data
  const totalPaymentsCount = englishPaymentsAgg?.paymentsCount || 0;
  const totalBudgetSum = englishPaymentsAgg?.budgetSum || 0;

  // Notices issued - keep existing logic for now (mainly from regular records)
  const noticeMatch = {};
  if (fromDate || toDate) {
    noticeMatch.notice_date = {};
    if (fromDate) noticeMatch.notice_date.$gte = fromDate;
    if (toDate) noticeMatch.notice_date.$lte = toDate;
  }
  
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
    if (match.project_id) noticeMatch.project_id = match.project_id;
    noticesIssued = await MongoNotice.countDocuments(noticeMatch);
  }

  // KYC completed and pending - use only English collection
  const englishKycCompleted = await CompleteEnglishLandownerRecord.countDocuments({
    ...englishMatch,
    compensation_distribution_status: { $ne: null }
  });

  const englishKycPending = await CompleteEnglishLandownerRecord.countDocuments({
    ...englishMatch,
    compensation_distribution_status: null
  });

  const totalKycCompleted = englishKycCompleted;
  const totalKycPending = englishKycPending;

  // Total acquired area - use only English collection
  const [englishAreaAgg] = await CompleteEnglishLandownerRecord.aggregate([
    { $match: { ...englishMatch } },
    {
      $group: {
        _id: null,
        totalAcquiredArea: { $sum: { $ifNull: ['$acquired_land_area', 0] } },
        totalArea: { $sum: { $ifNull: ['$land_area_as_per_7_12', 0] } }
      }
    }
  ]);

  const totalAcquiredArea = englishAreaAgg?.totalAcquiredArea || 0;
  const totalArea = englishAreaAgg?.totalArea || 0;

  return {
    totalProjects: projectsAgg?.totalProjects || 0,
    activeProjects: projectsAgg?.activeProjects || 0,
    totalBudgetAllocated: projectsAgg?.totalBudgetAllocated || 0,
    budgetSpentToDate: totalBudgetSum,
    paymentsCompletedCount: totalPaymentsCount,
    noticesIssued: noticesIssued || 0,
    kycCompleted: totalKycCompleted,
    kycPending: totalKycPending,
    totalAcquiredArea: totalAcquiredArea,
    totalAreaLoaded: totalArea
  };
}


