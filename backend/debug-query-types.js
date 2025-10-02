import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const projectId = '68da6edf579af093415f639e';
    
    console.log('=== Debugging Project Query ===');
    
    // Test 1: Check project exists (ObjectId)
    const projectObjectId = await mongoose.connection.db.collection('projects').findOne({ 
      _id: new mongoose.Types.ObjectId(projectId) 
    });
    console.log('1. Project found with ObjectId:', !!projectObjectId);

    // Test 2: Check landowner records with string project_id
    const recordsString = await mongoose.connection.db.collection('landownerrecords2').find({ 
      project_id: projectId 
    }).toArray();
    console.log('2. Records found with string project_id:', recordsString.length);

    // Test 3: Check landowner records with ObjectId project_id
    const recordsObjectId = await mongoose.connection.db.collection('landownerrecords2').find({ 
      project_id: new mongoose.Types.ObjectId(projectId) 
    }).toArray();
    console.log('3. Records found with ObjectId project_id:', recordsObjectId.length);

    // Test 4: Check what types of project_id exist in the collection
    const sampleRecords = await mongoose.connection.db.collection('landownerrecords2')
      .find({}).limit(5).toArray();
    console.log('4. Sample project_id types:');
    sampleRecords.forEach((record, index) => {
      console.log(`   Record ${index + 1}: project_id = "${record.project_id}" (${typeof record.project_id})`);
    });

    // Test 5: Check if any records have ObjectId type project_id
    const objectIdRecords = await mongoose.connection.db.collection('landownerrecords2').find({ 
      project_id: { $type: 'objectId' } 
    }).toArray();
    console.log('5. Records with ObjectId type project_id:', objectIdRecords.length);

    // Test 6: Check if any records have string type project_id
    const stringRecords = await mongoose.connection.db.collection('landownerrecords2').find({ 
      project_id: { $type: 'string' } 
    }).toArray();
    console.log('6. Records with string type project_id:', stringRecords.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugQuery();