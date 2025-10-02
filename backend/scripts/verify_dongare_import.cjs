const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

// ROB Project ID
const ROB_PROJECT_ID = '68da854996a3d559f5005b5c';

async function verifyDongareImport() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('\n=== Dongare Import Verification ===');
    
    // Get all Dongare records
    const dongareRecords = await mongoose.connection.db
      .collection('landownerrecords')
      .find({ 
        projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
        village: 'Dongare'
      })
      .toArray();
    
    console.log(`Total Dongare records: ${dongareRecords.length}`);
    
    // Check final_amount population
    const recordsWithFinalAmount = dongareRecords.filter(record => 
      record.final_amount && record.final_amount > 0
    );
    
    console.log(`Records with final_amount > 0: ${recordsWithFinalAmount.length}`);
    
    // Show sample records with final_amount
    console.log('\n=== Sample Records with Final Amount ===');
    recordsWithFinalAmount.slice(0, 5).forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  Owner: ${record.owner_name}`);
      console.log(`  Survey Number: ${record.survey_number}`);
      console.log(`  Area Acquired: ${record.area_acquired}`);
      console.log(`  Final Amount: ${record.final_amount}`);
      console.log(`  Total Compensation: ${record.total_final_compensation}`);
      console.log(`  Serial Number: ${record.serial_number}`);
      console.log('---');
    });
    
    // Check for records without final_amount
    const recordsWithoutFinalAmount = dongareRecords.filter(record => 
      !record.final_amount || record.final_amount === 0
    );
    
    console.log(`\nRecords without final_amount: ${recordsWithoutFinalAmount.length}`);
    
    if (recordsWithoutFinalAmount.length > 0) {
      console.log('\n=== Sample Records WITHOUT Final Amount ===');
      recordsWithoutFinalAmount.slice(0, 3).forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  Owner: ${record.owner_name}`);
        console.log(`  Survey Number: ${record.survey_number}`);
        console.log(`  Final Amount: ${record.final_amount}`);
        console.log(`  Total Compensation: ${record.total_final_compensation}`);
        console.log('---');
      });
    }
    
    // Summary statistics
    const totalFinalAmount = dongareRecords.reduce((sum, record) => 
      sum + (record.final_amount || 0), 0
    );
    
    console.log('\n=== Summary Statistics ===');
    console.log(`Total Final Amount: ₹${totalFinalAmount.toLocaleString()}`);
    console.log(`Average Final Amount: ₹${(totalFinalAmount / recordsWithFinalAmount.length || 0).toLocaleString()}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyDongareImport();