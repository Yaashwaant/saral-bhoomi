import mongoose from 'mongoose';
import MongoProject from '../models/mongo/Project.js';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import CompleteEnglishLandownerRecord from '../models/mongo/CompleteEnglishLandownerRecord.js';
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

  // Query both collections for payment data
  const [regularPaymentsAgg] = await MongoLandownerRecord.aggregate([
    { $match: paymentMatch },
    {
      $group: {
        _id: null,
        paymentsCount: { $sum: 1 },
        budgetSum: { $sum: { $ifNull: ['$final_amount', 0] } }
      }
    }
  ]);

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

  // Combine payment data from both sources
  const totalPaymentsCount = (regularPaymentsAgg?.paymentsCount || 0) + (englishPaymentsAgg?.paymentsCount || 0);
  const totalBudgetSum = (regularPaymentsAgg?.budgetSum || 0) + (englishPaymentsAgg?.budgetSum || 0);

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

  // KYC completed and pending - combine from both collections
  const kycMatch = { ...match, kyc_status: 'approved' };
  const regularKycCompleted = await MongoLandownerRecord.countDocuments(kycMatch);
  
  // For English complete records, assume KYC is completed if compensation_distribution_status is not null
  const englishKycCompleted = await CompleteEnglishLandownerRecord.countDocuments({
    ...englishMatch,
    compensation_distribution_status: { $ne: null }
  });

  const regularKycPending = await MongoLandownerRecord.countDocuments({
    ...match,
    kyc_status: { $in: ['pending', 'in_progress'] }
  });

  const englishKycPending = await CompleteEnglishLandownerRecord.countDocuments({
    ...englishMatch,
    compensation_distribution_status: null
  });

  const totalKycCompleted = regularKycCompleted + englishKycCompleted;
  const totalKycPending = regularKycPending + englishKycPending;

  // Total acquired area - combine from both collections
  const [regularAreaAgg] = await MongoLandownerRecord.aggregate([
    { $match: { ...match } },
    {
      $group: {
        _id: null,
        totalAcquiredArea: { $sum: { $ifNull: ['$area_acquired', 0] } },
        totalArea: { $sum: { $ifNull: ['$area', 0] } }
      }
    }
  ]);

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

  const totalAcquiredArea = (regularAreaAgg?.totalAcquiredArea || 0) + (englishAreaAgg?.totalAcquiredArea || 0);
  const totalAreaLoaded = (regularAreaAgg?.totalArea || 0) + (englishAreaAgg?.totalArea || 0);

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
    totalAreaLoaded: totalAreaLoaded
  };
}


