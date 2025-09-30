const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

// ROB Project ID
const ROB_PROJECT_ID = '68da854996a3d559f5005b5c';

async function verifyPaymentStatus() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('\n=== Payment Status Verification for Dongare ===');
    
    // Get all Dongare records
    const dongareRecords = await mongoose.connection.db
      .collection('landownerrecords')
      .find({ 
        projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
        village: 'Dongare'
      })
      .toArray();
    
    console.log(`Total Dongare records: ${dongareRecords.length}`);
    
    // Check payment status distribution
    const statusCounts = {
      pending: 0,
      completed: 0,
      undefined: 0
    };
    
    dongareRecords.forEach(record => {
      if (record.payment_status === 'completed') {
        statusCounts.completed++;
      } else if (record.payment_status === 'pending') {
        statusCounts.pending++;
      } else {
        statusCounts.undefined++;
      }
    });
    
    console.log('\n=== Payment Status Distribution ===');
    console.log(`Completed (PAID): ${statusCounts.completed}`);
    console.log(`Pending (UNPAID): ${statusCounts.pending}`);
    console.log(`Undefined: ${statusCounts.undefined}`);
    
    // Show records with completed status
    const completedRecords = dongareRecords.filter(record => 
      record.payment_status === 'completed'
    );
    
    console.log('\n=== Records with COMPLETED Status ===');
    completedRecords.forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  Owner: ${record.owner_name}`);
      console.log(`  Survey Number: ${record.survey_number}`);
      console.log(`  Final Amount: ₹${record.final_amount?.toLocaleString() || 0}`);
      console.log(`  Payment Status: ${record.payment_status}`);
      console.log(`  Serial Number: ${record.serial_number}`);
      console.log('---');
    });
    
    // Show sample records with pending status
    const pendingRecords = dongareRecords.filter(record => 
      record.payment_status === 'pending'
    );
    
    console.log('\n=== Sample Records with PENDING Status ===');
    pendingRecords.slice(0, 3).forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  Owner: ${record.owner_name}`);
      console.log(`  Survey Number: ${record.survey_number}`);
      console.log(`  Final Amount: ₹${record.final_amount?.toLocaleString() || 0}`);
      console.log(`  Payment Status: ${record.payment_status}`);
      console.log('---');
    });
    
    // Summary statistics by payment status
    const completedAmount = completedRecords.reduce((sum, record) => 
      sum + (record.final_amount || 0), 0
    );
    
    const pendingAmount = pendingRecords.reduce((sum, record) => 
      sum + (record.final_amount || 0), 0
    );
    
    console.log('\n=== Financial Summary by Payment Status ===');
    console.log(`Completed Payments: ₹${completedAmount.toLocaleString()}`);
    console.log(`Pending Payments: ₹${pendingAmount.toLocaleString()}`);
    console.log(`Total Amount: ₹${(completedAmount + pendingAmount).toLocaleString()}`);
    
    // Verify the mapping worked correctly
    console.log('\n=== Payment Status Mapping Verification ===');
    console.log('Expected: Records with "PAID" in Excel should have payment_status = "completed"');
    console.log('Expected: All other records should have payment_status = "pending"');
    console.log(`Actual: ${statusCounts.completed} completed, ${statusCounts.pending} pending`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyPaymentStatus();