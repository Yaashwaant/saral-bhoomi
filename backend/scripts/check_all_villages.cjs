const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function checkAllVillages() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check the specific project
    const projectId = '678fe385996b2b9331f8c40c';
    
    console.log('\n=== All villages in project ===');
    
    // Get all distinct villages
    const villages = await mongoose.connection.db
      .collection('landownerrecords')
      .distinct('village', { 
        project_id: new mongoose.Types.ObjectId(projectId)
      });
    
    console.log('Villages found:', villages);
    
    // Get total record count for project
    const totalRecords = await mongoose.connection.db
      .collection('landownerrecords')
      .countDocuments({ 
        project_id: new mongoose.Types.ObjectId(projectId)
      });
    
    console.log(`Total records for project: ${totalRecords}`);
    
    // Get sample records
    const sampleRecords = await mongoose.connection.db
      .collection('landownerrecords')
      .find({ 
        project_id: new mongoose.Types.ObjectId(projectId)
      })
      .limit(3)
      .toArray();
    
    console.log('\nSample records:');
    sampleRecords.forEach((record, i) => {
      console.log(`\nRecord ${i + 1}:`);
      console.log('  village:', record.village);
      console.log('  landowner_name:', record.landowner_name);
      console.log('  survey_number:', record.survey_number);
      console.log('  final_amount:', record.final_amount);
      console.log('  final_payable_amount:', record.final_payable_amount);
      console.log('  data_format:', record.data_format);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkAllVillages();