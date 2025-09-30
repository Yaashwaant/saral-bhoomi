require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function main() {
  try {
    console.log('Starting query...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
    console.log('MongoDB URI:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const col = db.collection('landownerrecords');

    const projectId = '68da854996a3d559f5005b5c';
    console.log('Project ID:', projectId);

    // First check total records
    const totalRecords = await col.countDocuments({});
    console.log('Total records in collection:', totalRecords);

    // Check records for this project
    const projectRecords = await col.countDocuments({ project_id: new mongoose.Types.ObjectId(projectId) });
    console.log('Records for this project:', projectRecords);

    if (projectRecords === 0) {
      console.log('No records found for this project ID');
      return;
    }

    // Get all villages for this project
    const villages = await col.distinct('village', { project_id: new mongoose.Types.ObjectId(projectId) });
    console.log('Villages for project:', villages);

    // Search for Dongare records (case insensitive)
    const dongareRecords = await col.countDocuments({ 
      project_id: new mongoose.Types.ObjectId(projectId), 
      village: { $regex: /dongare/i } 
    });
    console.log('Records with Dongare (case insensitive):', dongareRecords);

    // Get sample records
    const sample = await col
      .find({ project_id: new mongoose.Types.ObjectId(projectId) })
      .limit(5)
      .toArray();

    console.log('\nSample records:');
    sample.forEach((r, i) => {
      console.log(`${i + 1}. ${r.landowner_name} | village:${r.village} | survey:${r.survey_number} | final_amount:${r.final_amount} | final_payable_amount:${r.final_payable_amount}`);
    });

    // Check if any records have final_amount
    const withFinalAmount = await col.countDocuments({ 
      project_id: new mongoose.Types.ObjectId(projectId), 
      final_amount: { $exists: true, $ne: null, $ne: 0 } 
    });
    
    const withFinalPayable = await col.countDocuments({ 
      project_id: new mongoose.Types.ObjectId(projectId), 
      final_payable_amount: { $exists: true, $ne: null, $ne: 0 } 
    });

    console.log('\nAmount field summary:');
    console.log(`Records with final_amount > 0: ${withFinalAmount}`);
    console.log(`Records with final_payable_amount > 0: ${withFinalPayable}`);

  } catch (err) {
    console.error('Query failed:', err.message);
    console.error(err.stack);
  } finally {
    await mongoose.disconnect();
  }
}

main();