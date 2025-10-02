import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugModelQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Import the model
    const LandownerRecord2 = await import('./models/mongo/LandownerRecord2.js');
    const MongoLandownerRecord2 = LandownerRecord2.default;
    
    const projectId = '68da6edf579af093415f639e';
    
    console.log('=== Testing Mongoose Model Query ===');
    
    // Test 1: Direct MongoDB query with string
    console.log('1. Direct MongoDB query with string:');
    const directString = await mongoose.connection.db.collection('landownerrecords2').find({ 
      project_id: projectId,
      is_active: true 
    }).toArray();
    console.log(`   Found: ${directString.length} records`);

    // Test 2: Mongoose query with string
    console.log('2. Mongoose query with string:');
    const mongooseString = await MongoLandownerRecord2.find({ 
      project_id: projectId,
      is_active: true 
    });
    console.log(`   Found: ${mongooseString.length} records`);

    // Test 3: Check model schema
    console.log('3. Model schema for project_id:');
    console.log(`   Type: ${MongoLandownerRecord2.schema.paths.project_id.instance}`);
    console.log(`   Required: ${MongoLandownerRecord2.schema.paths.project_id.isRequired}`);

    // Test 4: Check if there are any records at all
    console.log('4. Total records in collection:');
    const totalRecords = await MongoLandownerRecord2.find({});
    console.log(`   Total: ${totalRecords.length} records`);

    // Test 5: Check first few records
    console.log('5. First 3 records project_id values:');
    const sampleRecords = await MongoLandownerRecord2.find({}).limit(3);
    sampleRecords.forEach((record, index) => {
      console.log(`   Record ${index + 1}: project_id = "${record.project_id}" (${typeof record.project_id})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugModelQuery();