const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function checkFinalAmountData() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check the specific project
    const projectId = '678fe385996b2b9331f8c40c';
    
    console.log('\n=== Checking Chandrapada village records ===');
    
    // Get sample records with all amount fields
    const sampleRecords = await mongoose.connection.db
      .collection('landownerrecords')
      .find({ 
        project_id: new mongoose.Types.ObjectId(projectId),
        village: 'चंद्रपदा'
      })
      .limit(5)
      .toArray();
    
    console.log(`Found ${sampleRecords.length} sample records`);
    
    sampleRecords.forEach((record, i) => {
      console.log(`\nRecord ${i + 1}:`);
      console.log('  landowner_name:', record.landowner_name);
      console.log('  survey_number:', record.survey_number);
      console.log('  final_amount:', record.final_amount);
      console.log('  final_payable_amount:', record.final_payable_amount);
      console.log('  total_final_compensation:', record.total_final_compensation);
      console.log('  data_format:', record.data_format);
      console.log('  source_file_name:', record.source_file_name);
    });

    // Count records by data format
    console.log('\n=== Records by data format ===');
    const formatCounts = await mongoose.connection.db
      .collection('landownerrecords')
      .aggregate([
        { 
          $match: { 
            project_id: new mongoose.Types.ObjectId(projectId),
            village: 'चंद्रपदा'
          }
        },
        {
          $group: {
            _id: '$data_format',
            count: { $sum: 1 },
            avg_final_amount: { $avg: '$final_amount' },
            avg_final_payable_amount: { $avg: '$final_payable_amount' }
          }
        }
      ])
      .toArray();
    
    formatCounts.forEach(group => {
      console.log(`Format: ${group._id}`);
      console.log(`  Count: ${group.count}`);
      console.log(`  Avg final_amount: ${group.avg_final_amount}`);
      console.log(`  Avg final_payable_amount: ${group.avg_final_payable_amount}`);
    });

    // Check if any records have final_amount > 0
    console.log('\n=== Records with final_amount > 0 ===');
    const recordsWithFinalAmount = await mongoose.connection.db
      .collection('landownerrecords')
      .countDocuments({ 
        project_id: new mongoose.Types.ObjectId(projectId),
        village: 'चंद्रपदा',
        final_amount: { $gt: 0 }
      });
    
    console.log(`Records with final_amount > 0: ${recordsWithFinalAmount}`);

    // Check records with final_payable_amount > 0 but final_amount = 0 or null
    console.log('\n=== Records with final_payable_amount > 0 but final_amount missing ===');
    const recordsWithIssue = await mongoose.connection.db
      .collection('landownerrecords')
      .countDocuments({ 
        project_id: new mongoose.Types.ObjectId(projectId),
        village: 'चंद्रपदा',
        final_payable_amount: { $gt: 0 },
        $or: [
          { final_amount: { $exists: false } },
          { final_amount: null },
          { final_amount: 0 }
        ]
      });
    
    console.log(`Records with final_payable_amount > 0 but final_amount missing/0: ${recordsWithIssue}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkFinalAmountData();