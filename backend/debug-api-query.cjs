const mongoose = require('mongoose');
require('dotenv').config();

async function debugApiQuery() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    const projectId = '68da854996a3d559f5005b5c';
    
    // Test the exact query the API uses
    console.log('Testing API query with ObjectId conversion...');
    const apiQuery = { 
      project_id: new mongoose.Types.ObjectId(projectId),
      is_active: true 
    };
    
    const apiResults = await db.collection('landownerrecords_english_complete').find(apiQuery).toArray();
    console.log(`API query results: ${apiResults.length} records`);
    
    // Test query with string project_id
    console.log('\nTesting query with string project_id...');
    const stringQuery = { 
      project_id: projectId,
      is_active: true 
    };
    
    const stringResults = await db.collection('landownerrecords_english_complete').find(stringQuery).toArray();
    console.log(`String query results: ${stringResults.length} records`);
    
    // Check what type project_id is stored as in the database
    console.log('\nChecking project_id data types...');
    const projectIdTypes = await db.collection('landownerrecords_english_complete').aggregate([
      {
        $match: { project_id: { $exists: true } }
      },
      {
        $group: {
          _id: {
            value: "$project_id",
            type: { $type: "$project_id" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    console.log('Project ID values and their types:');
    projectIdTypes.forEach(item => {
      console.log(`Value: ${item._id.value}, Type: ${item._id.type}, Count: ${item.count}`);
    });
    
    // Get sample records to see their project_id structure
    const sampleRecords = await db.collection('landownerrecords_english_complete').find({}).limit(3).toArray();
    console.log('\nSample records project_id structure:');
    sampleRecords.forEach((doc, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  _id: ${doc._id}`);
      console.log(`  project_id: ${doc.project_id} (${typeof doc.project_id})`);
      console.log(`  is_active: ${doc.is_active} (${typeof doc.is_active})`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugApiQuery();