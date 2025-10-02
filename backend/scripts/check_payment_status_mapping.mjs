import mongoose from 'mongoose';
import dotenv from 'dotenv';
import '../models/index.js';

dotenv.config();

async function checkPaymentStatusMapping() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const LandownerRecord = mongoose.model('LandownerRecord');
    
    // Get all Dongare records
    const dongareRecords = await LandownerRecord.find({ 
      village: { $in: ['Dongare', 'dongare', 'DONGARE'] }
    }).limit(5);
    
    console.log('=== Sample Dongare Records ===');
    dongareRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  payment_status: ${record.payment_status}`);
      console.log(`  paymentStatus: ${record.paymentStatus}`);
      console.log(`  owner_name: ${record.owner_name}`);
      console.log(`  project_id: ${record.project_id}`);
      console.log('---');
    });
    
    // Check unique payment status values
    const uniqueStatuses = await LandownerRecord.distinct('payment_status', { 
      village: { $in: ['Dongare', 'dongare', 'DONGARE'] }
    });
    
    console.log('=== Unique payment_status values in Dongare records ===');
    console.log(uniqueStatuses);
    
    // Count by payment status
    const statusCounts = await LandownerRecord.aggregate([
      { $match: { village: { $in: ['Dongare', 'dongare', 'DONGARE'] } } },
      { $group: { _id: '$payment_status', count: { $sum: 1 } } }
    ]);
    
    console.log('=== Payment Status Distribution ===');
    statusCounts.forEach(status => {
      console.log(`${status._id}: ${status.count} records`);
    });
    
    // Check what the frontend expects vs what's in database
    console.log('\n=== Frontend vs Database Mapping Issue ===');
    console.log('Frontend getOverviewKpis looks for: paymentStatus === "success"');
    console.log('Database has payment_status values:', uniqueStatuses);
    console.log('This is the issue! Frontend expects "success" but database has "completed"');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaymentStatusMapping();