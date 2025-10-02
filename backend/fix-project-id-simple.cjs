const mongoose = require('mongoose');
require('dotenv').config();

async function fixProjectIdTypes() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    const projectId = '68da854996a3d559f5005b5c';
    
    // Find all records with string project_id
    const stringRecords = await db.collection('landownerrecords_english_complete').find({
      project_id: projectId  // This will match string version
    }).toArray();
    
    console.log(`Found ${stringRecords.length} records with string project_id`);
    
    // Update each record individually
    let updatedCount = 0;
    for (const record of stringRecords) {
      if (typeof record.project_id === 'string') {
        await db.collection('landownerrecords_english_complete').updateOne(
          { _id: record._id },
          { $set: { project_id: new mongoose.Types.ObjectId(projectId) } }
        );
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} records from string to ObjectId`);

    // Verify the fix
    const objectIdCount = await db.collection('landownerrecords_english_complete').countDocuments({
      project_id: new mongoose.Types.ObjectId(projectId),
      is_active: true
    });
    
    console.log(`Records with ObjectId project_id and is_active true: ${objectIdCount}`);
    
    const stringCount = await db.collection('landownerrecords_english_complete').countDocuments({
      project_id: projectId,
      is_active: true
    });
    
    console.log(`Records with string project_id and is_active true: ${stringCount}`);
    
    // Total count for this project
    const totalCount = await db.collection('landownerrecords_english_complete').countDocuments({
      $or: [
        { project_id: new mongoose.Types.ObjectId(projectId) },
        { project_id: projectId }
      ],
      is_active: true
    });
    
    console.log(`Total records for this project with is_active true: ${totalCount}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixProjectIdTypes();