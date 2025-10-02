const mongoose = require('mongoose');
require('dotenv').config();

async function checkDataTypes() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    
    // Get all unique is_active values and their types
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
    
    console.log('All is_active values and their types:');
    isActiveValues.forEach(item => {
      console.log(`Value: ${item._id.value}, Type: ${item._id.type}, Count: ${item.count}`);
    });
    
    // Check specifically for ROB project records
    const robIsActiveValues = await db.collection('landownerrecords_english_complete').aggregate([
      {
        $match: { project_id: '68da854996a3d559f5005b5c' }
      },
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
    
    console.log('\nROB project is_active values and their types:');
    robIsActiveValues.forEach(item => {
      console.log(`Value: ${item._id.value}, Type: ${item._id.type}, Count: ${item.count}`);
    });
    
    // Get sample records with different is_active values
    const stringTrueRecords = await db.collection('landownerrecords_english_complete').find({
      project_id: '68da854996a3d559f5005b5c',
      is_active: 'TRUE'
    }).limit(2).toArray();
    
    const booleanTrueRecords = await db.collection('landownerrecords_english_complete').find({
      project_id: '68da854996a3d559f5005b5c',
      is_active: true
    }).limit(2).toArray();
    
    console.log('\nSample records with string "TRUE":');
    stringTrueRecords.forEach((doc, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  _id: ${doc._id}`);
      console.log(`  serial_number: ${doc.serial_number}`);
      console.log(`  is_active: ${doc.is_active} (${typeof doc.is_active})`);
    });
    
    console.log('\nSample records with boolean true:');
    booleanTrueRecords.forEach((doc, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  _id: ${doc._id}`);
      console.log(`  serial_number: ${doc.serial_number}`);
      console.log(`  is_active: ${doc.is_active} (${typeof doc.is_active})`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDataTypes();