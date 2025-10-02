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
    
    // Update all records with string project_id to ObjectId
    const result = await db.collection('landownerrecords_english_complete').updateMany(
      { 
        project_id: projectId,  // string version
        $type: { project_id: "string" }
      },
      { 
        $set: { 
          project_id: new mongoose.Types.ObjectId(projectId) 
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} documents`);
    console.log(`Matched ${result.matchedCount} documents`);

    // Alternative approach - update all string project_ids
    const result2 = await db.collection('landownerrecords_english_complete').updateMany(
      { 
        project_id: { $type: "string" },
        project_id: projectId
      },
      [
        {
          $set: {
            project_id: { $toObjectId: "$project_id" }
          }
        }
      ]
    );

    console.log(`Alternative update - Modified: ${result2.modifiedCount}, Matched: ${result2.matchedCount}`);

    // Verify the fix
    const objectIdCount = await db.collection('landownerrecords_english_complete').countDocuments({
      project_id: new mongoose.Types.ObjectId(projectId),
      is_active: true
    });
    
    console.log(`Records with ObjectId project_id: ${objectIdCount}`);
    
    const stringCount = await db.collection('landownerrecords_english_complete').countDocuments({
      project_id: projectId,
      is_active: true
    });
    
    console.log(`Records with string project_id: ${stringCount}`);
    
    // Check updated data types
    const projectIdTypes = await db.collection('landownerrecords_english_complete').aggregate([
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
    
    console.log('\nUpdated project_id values and their types:');
    projectIdTypes.forEach(item => {
      console.log(`Value: ${item._id.value}, Type: ${item._id.type}, Count: ${item.count}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixProjectIdTypes();