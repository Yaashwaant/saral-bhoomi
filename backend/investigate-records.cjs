const mongoose = require('mongoose');
require('dotenv').config();

async function investigateRecords() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    
    // Get total count of all documents in the collection
    const totalCount = await db.collection('landownerrecords_english_complete').countDocuments();
    console.log(`Total documents in collection: ${totalCount}`);
    
    // Get count by project_id
    const projectCounts = await db.collection('landownerrecords_english_complete').aggregate([
      {
        $group: {
          _id: "$project_id",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    console.log('\nDocuments by project_id:');
    projectCounts.forEach(project => {
      console.log(`Project ID: ${project._id} - Count: ${project.count}`);
    });
    
    // Check for documents without project_id
    const noProjectId = await db.collection('landownerrecords_english_complete').countDocuments({
      $or: [
        { project_id: { $exists: false } },
        { project_id: null },
        { project_id: "" }
      ]
    });
    console.log(`\nDocuments without project_id: ${noProjectId}`);
    
    // Get some sample documents to see their structure
    const sampleDocs = await db.collection('landownerrecords_english_complete').find({}).limit(3).toArray();
    console.log('\nSample documents:');
    sampleDocs.forEach((doc, index) => {
      console.log(`Sample ${index + 1}:`);
      console.log(`  _id: ${doc._id}`);
      console.log(`  project_id: ${doc.project_id}`);
      console.log(`  serial_number: ${doc.serial_number}`);
      console.log(`  owner_name: ${doc.owner_name}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

investigateRecords();