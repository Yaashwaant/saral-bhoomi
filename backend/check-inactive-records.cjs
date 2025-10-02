const mongoose = require('mongoose');
require('dotenv').config();

async function checkInactiveRecords() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    
    // Get total count of all documents in the collection
    const totalCount = await db.collection('landownerrecords_english_complete').countDocuments();
    console.log(`Total documents in collection: ${totalCount}`);
    
    // Get count of active documents for ROB project
    const activeROBCount = await db.collection('landownerrecords_english_complete').countDocuments({
      project_id: '68da854996a3d559f5005b5c',
      is_active: true
    });
    console.log(`Active ROB project documents: ${activeROBCount}`);
    
    // Get count of inactive documents for ROB project
    const inactiveROBCount = await db.collection('landownerrecords_english_complete').countDocuments({
      project_id: '68da854996a3d559f5005b5c',
      is_active: false
    });
    console.log(`Inactive ROB project documents: ${inactiveROBCount}`);
    
    // Get count of ROB documents without is_active field
    const noIsActiveROBCount = await db.collection('landownerrecords_english_complete').countDocuments({
      project_id: '68da854996a3d559f5005b5c',
      is_active: { $exists: false }
    });
    console.log(`ROB project documents without is_active field: ${noIsActiveROBCount}`);
    
    // Get all ROB documents regardless of is_active status
    const allROBCount = await db.collection('landownerrecords_english_complete').countDocuments({
      project_id: '68da854996a3d559f5005b5c'
    });
    console.log(`All ROB project documents (regardless of is_active): ${allROBCount}`);
    
    // Check for documents with different is_active values
    const isActiveStats = await db.collection('landownerrecords_english_complete').aggregate([
      {
        $match: { project_id: '68da854996a3d559f5005b5c' }
      },
      {
        $group: {
          _id: "$is_active",
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('\nROB project documents by is_active status:');
    isActiveStats.forEach(stat => {
      console.log(`is_active: ${stat._id} - Count: ${stat.count}`);
    });
    
    // Get some sample inactive records if they exist
    const inactiveRecords = await db.collection('landownerrecords_english_complete').find({
      project_id: '68da854996a3d559f5005b5c',
      is_active: false
    }).limit(3).toArray();
    
    if (inactiveRecords.length > 0) {
      console.log('\nSample inactive records:');
      inactiveRecords.forEach((doc, index) => {
        console.log(`Inactive ${index + 1}:`);
        console.log(`  _id: ${doc._id}`);
        console.log(`  serial_number: ${doc.serial_number}`);
        console.log(`  owner_name: ${doc.owner_name}`);
        console.log(`  is_active: ${doc.is_active}`);
      });
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkInactiveRecords();