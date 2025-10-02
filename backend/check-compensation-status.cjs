const mongoose = require('mongoose');
require('dotenv').config();

async function checkCompensationStatus() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    
    // Get total count of all documents in the collection
    const totalCount = await db.collection('landownerrecords_english_complete').countDocuments();
    console.log(`Total documents in collection: ${totalCount}`);
    
    // Get count by compensation_distribution_status
    const statusCounts = await db.collection('landownerrecords_english_complete').aggregate([
      {
        $group: {
          _id: "$compensation_distribution_status",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    console.log('\nDocuments by compensation_distribution_status:');
    statusCounts.forEach(status => {
      console.log(`Status: "${status._id}" - Count: ${status.count}`);
    });
    
    // Check for documents without compensation_distribution_status
    const noStatus = await db.collection('landownerrecords_english_complete').countDocuments({
      $or: [
        { compensation_distribution_status: { $exists: false } },
        { compensation_distribution_status: null },
        { compensation_distribution_status: "" }
      ]
    });
    console.log(`\nDocuments without compensation_distribution_status: ${noStatus}`);
    
    // Get some sample documents to see their structure
    const sampleDocs = await db.collection('landownerrecords_english_complete').find({}).limit(5).toArray();
    console.log('\nSample documents:');
    sampleDocs.forEach((doc, index) => {
      console.log(`Sample ${index + 1}:`);
      console.log(`  _id: ${doc._id}`);
      console.log(`  project_id: ${doc.project_id}`);
      console.log(`  compensation_distribution_status: "${doc.compensation_distribution_status}"`);
      console.log(`  acquired_land_area: ${doc.acquired_land_area}`);
      console.log(`  compensation_amount: ${doc.compensation_amount}`);
      console.log('  ---');
    });

    // Check for specific status values we're looking for
    const paidCount = await db.collection('landownerrecords_english_complete').countDocuments({
      compensation_distribution_status: { $regex: /^paid$/i }
    });
    console.log(`\nRecords with status "paid" (case-insensitive): ${paidCount}`);
    
    const completedCount = await db.collection('landownerrecords_english_complete').countDocuments({
      compensation_distribution_status: { $regex: /^completed$/i }
    });
    console.log(`Records with status "completed" (case-insensitive): ${completedCount}`);
    
    const distributedCount = await db.collection('landownerrecords_english_complete').countDocuments({
      compensation_distribution_status: { $regex: /^distributed$/i }
    });
    console.log(`Records with status "distributed" (case-insensitive): ${distributedCount}`);

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCompensationStatus();