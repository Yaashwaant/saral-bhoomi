import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugFinal() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Import the model
    const LandownerRecord2 = await import('./models/mongo/LandownerRecord2.js');
    const MongoLandownerRecord2 = LandownerRecord2.default;
    
    const projectId = '68da6edf579af093415f639e';
    
    console.log('=== Final Debug After Conversion ===');
    
    // Test 1: Check records with ObjectId project_id (no is_active filter)
    console.log('1. Records with ObjectId project_id (no is_active filter):');
    const allRecords = await MongoLandownerRecord2.find({ 
      project_id: new mongoose.Types.ObjectId(projectId)
    });
    console.log(`   Found: ${allRecords.length} records`);
    if (allRecords.length > 0) {
      console.log(`   First record is_active: ${allRecords[0].is_active}`);
      console.log(`   First record project_id type: ${typeof allRecords[0].project_id}`);
    }

    // Test 2: Check records with is_active: true
    console.log('2. Records with is_active: true:');
    const activeRecords = await MongoLandownerRecord2.find({ 
      project_id: new mongoose.Types.ObjectId(projectId),
      is_active: true 
    });
    console.log(`   Found: ${activeRecords.length} records`);

    // Test 3: Check records with is_active: false
    console.log('3. Records with is_active: false:');
    const inactiveRecords = await MongoLandownerRecord2.find({ 
      project_id: new mongoose.Types.ObjectId(projectId),
      is_active: false 
    });
    console.log(`   Found: ${inactiveRecords.length} records`);

    // Test 4: Check records with no is_active field
    console.log('4. Records with no is_active field:');
    const noIsActiveRecords = await MongoLandownerRecord2.find({ 
      project_id: new mongoose.Types.ObjectId(projectId),
      is_active: { $exists: false } 
    });
    console.log(`   Found: ${noIsActiveRecords.length} records`);

    // Test 5: Check what is_active values exist
    console.log('5. is_active values in collection:');
    const isActiveValues = await MongoLandownerRecord2.aggregate([
      { $match: { project_id: new mongoose.Types.ObjectId(projectId) } },
      { $group: { _id: '$is_active', count: { $sum: 1 } } }
    ]);
    console.log('   Values:', isActiveValues);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugFinal();