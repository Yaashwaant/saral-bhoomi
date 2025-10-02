const mongoose = require('mongoose');

async function updateProjectIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/saral_bhoomi');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Update documents with incorrect project_id
    const result = await db.collection('landownerrecords_english_complete').updateMany(
      { project_id: '68da6edf579af093415f639e' },
      { $set: { project_id: '68da854996a3d559f5005b5c' } }
    );

    console.log(`Updated ${result.modifiedCount} documents`);
    console.log(`Matched ${result.matchedCount} documents`);

    // Verify the update
    const count = await db.collection('landownerrecords_english_complete').countDocuments(
      { project_id: '68da854996a3d559f5005b5c' }
    );
    
    console.log(`Total documents with ROB project ID: ${count}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateProjectIds();