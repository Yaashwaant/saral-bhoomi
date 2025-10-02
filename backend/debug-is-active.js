import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugIsActive() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Import the model
    const LandownerRecord2 = await import('./models/mongo/LandownerRecord2.js');
    const MongoLandownerRecord2 = LandownerRecord2.default;
    
    const projectId = '68da6edf579af093415f639e';
    
    console.log('=== Debugging is_active field ===');
    
    // Test 1: Check records without is_active filter
    console.log('1. Records without is_active filter:');
    const allRecords = await MongoLandownerRecord2.find({ 
      project_id: projectId
    });
    console.log(`   Found: ${allRecords.length} records`);

    // Test 2: Check what is_active values exist
    console.log('2. is_active values in collection:');
    const isActiveValues = await MongoLandownerRecord2.aggregate([
      { $group: { _id: '$is_active', count: { $sum: 1 } } }
    ]);
    console.log('   Values:', isActiveValues);

    // Test 3: Check records with is_active: true
    console.log('3. Records with is_active: true:');
    const activeRecords = await MongoLandownerRecord2.find({ 
      project_id: projectId,
      is_active: true 
    });
    console.log(`   Found: ${activeRecords.length} records`);

    // Test 4: Check records with is_active: false
    console.log('4. Records with is_active: false:');
    const inactiveRecords = await MongoLandownerRecord2.find({ 
      project_id: projectId,
      is_active: false 
    });
    console.log(`   Found: ${inactiveRecords.length} records`);

    // Test 5: Check records with no is_active field
    console.log('5. Records with no is_active field:');
    const noIsActiveRecords = await MongoLandownerRecord2.find({ 
      project_id: projectId,
      is_active: { $exists: false } 
    });
    console.log(`   Found: ${noIsActiveRecords.length} records`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugIsActive();