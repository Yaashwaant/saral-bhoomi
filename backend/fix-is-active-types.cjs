const mongoose = require('mongoose');
require('dotenv').config();

async function fixIsActiveTypes() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    
    // Update all records with string "TRUE" to boolean true
    const result = await db.collection('landownerrecords_english_complete').updateMany(
      { is_active: "TRUE" },
      { $set: { is_active: true } }
    );

    console.log(`Updated ${result.modifiedCount} documents`);
    console.log(`Matched ${result.matchedCount} documents`);

    // Verify the fix - check ROB project records
    const robActiveCount = await db.collection('landownerrecords_english_complete').countDocuments({
      project_id: '68da854996a3d559f5005b5c',
      is_active: true
    });
    
    console.log(`ROB project records with boolean true: ${robActiveCount}`);
    
    // Check if any string "TRUE" values remain
    const remainingStringTrue = await db.collection('landownerrecords_english_complete').countDocuments({
      is_active: "TRUE"
    });
    
    console.log(`Remaining records with string "TRUE": ${remainingStringTrue}`);
    
    // Get updated data types
    const isActiveValues = await db.collection('landownerrecords_english_complete').aggregate([
      {
        $group: {
          _id: {
            value: "$is_active",
            type: { $type: "$is_active" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    console.log('\nUpdated is_active values and their types:');
    isActiveValues.forEach(item => {
      console.log(`Value: ${item._id.value}, Type: ${item._id.type}, Count: ${item.count}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixIsActiveTypes();