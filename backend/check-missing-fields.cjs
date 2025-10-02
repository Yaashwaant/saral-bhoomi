const mongoose = require('mongoose');
require('dotenv').config();

async function checkMissingFields() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    const projectId = '68da854996a3d559f5005b5c';
    
    // Get sample records to check field presence
    const sampleRecords = await db.collection('landownerrecords_english_complete').find({
      project_id: new mongoose.Types.ObjectId(projectId),
      is_active: true
    }).limit(5).toArray();
    
    console.log(`Found ${sampleRecords.length} sample records for ROB project`);
    
    // Check for the specific fields mentioned by user
    const fieldsToCheck = ['old_survey_number', 'new_survey_number', 'group_number', 'cts_number'];
    
    console.log('\nChecking field presence in sample records:');
    sampleRecords.forEach((record, index) => {
      console.log(`\nRecord ${index + 1} (ID: ${record._id}):`);
      console.log(`  serial_number: ${record.serial_number}`);
      console.log(`  owner_name: ${record.owner_name}`);
      
      fieldsToCheck.forEach(field => {
        const value = record[field];
        const exists = value !== undefined && value !== null && value !== '';
        console.log(`  ${field}: ${value} (exists: ${exists})`);
      });
    });
    
    // Count records that have these fields with actual values
    console.log('\nCounting records with non-empty values for each field:');
    for (const field of fieldsToCheck) {
      const count = await db.collection('landownerrecords_english_complete').countDocuments({
        project_id: new mongoose.Types.ObjectId(projectId),
        is_active: true,
        [field]: { $exists: true, $ne: null, $ne: '' }
      });
      console.log(`  ${field}: ${count} records have non-empty values`);
    }
    
    // Get records with specific values mentioned by user
    console.log('\nLooking for records with the specific values mentioned:');
    const specificRecord = await db.collection('landownerrecords_english_complete').findOne({
      project_id: new mongoose.Types.ObjectId(projectId),
      is_active: true,
      $or: [
        { old_survey_number: '350' },
        { old_survey_number: 350 },
        { new_survey_number: '66' },
        { new_survey_number: 66 }
      ]
    });
    
    if (specificRecord) {
      console.log('Found record with mentioned values:');
      console.log(`  _id: ${specificRecord._id}`);
      console.log(`  serial_number: ${specificRecord.serial_number}`);
      console.log(`  owner_name: ${specificRecord.owner_name}`);
      fieldsToCheck.forEach(field => {
        console.log(`  ${field}: ${specificRecord[field]} (${typeof specificRecord[field]})`);
      });
    } else {
      console.log('No record found with the specific values mentioned');
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMissingFields();