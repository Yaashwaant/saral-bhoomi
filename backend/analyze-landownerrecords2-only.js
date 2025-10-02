import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeLandownerRecords2Only() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    const collection = db.collection('landownerrecords2');

    console.log('=== LANDOWNERRECORDS2 COLLECTION ANALYSIS ===\n');

    // 1. Basic Statistics
    const totalCount = await collection.countDocuments();
    console.log('1. BASIC STATISTICS:');
    console.log(`   Total documents: ${totalCount}`);

    // 2. Project ID Analysis
    console.log('\n2. PROJECT_ID ANALYSIS:');
    const projectIds = await collection.distinct('project_id');
    console.log(`   Unique project IDs: ${projectIds.length}`);
    console.log(`   Project IDs: ${projectIds.map(id => id.toString()).join(', ')}`);

    // 3. Check for your sample data
    console.log('\n3. SEARCHING FOR YOUR SAMPLE DATA:');
    const sampleSerial = 4;
    const sampleOwner = "विदयाधर रामकृष्ण पाटील";
    const sampleVillage = "चंद्रपाडा";

    // Search by serial number
    const bySerial = await collection.findOne({ 'अ.क्र': sampleSerial });
    if (bySerial) {
      console.log(`   Found record with serial ${sampleSerial}:`);
      console.log(`   - Owner: ${bySerial['खातेदाराचे नांव']}`);
      console.log(`   - Village: ${bySerial['Village']}`);
      console.log(`   - Project ID: ${bySerial['project_id']}`);
    } else {
      console.log(`   No record found with serial ${sampleSerial}`);
    }

    // Search by owner name
    const byOwner = await collection.findOne({ 'खातेदाराचे नांव': sampleOwner });
    if (byOwner) {
      console.log(`   Found record with owner "${sampleOwner}":`);
      console.log(`   - Serial: ${byOwner['अ.क्र']}`);
      console.log(`   - Village: ${byOwner['Village']}`);
      console.log(`   - Project ID: ${byOwner['project_id']}`);
    } else {
      console.log(`   No record found with owner "${sampleOwner}"`);
    }

    // Search by village
    const byVillage = await collection.findOne({ Village: sampleVillage });
    if (byVillage) {
      console.log(`   Found record in village "${sampleVillage}":`);
      console.log(`   - Serial: ${byVillage['अ.क्र']}`);
      console.log(`   - Owner: ${byVillage['खातेदाराचे नांव']}`);
      console.log(`   - Project ID: ${byVillage['project_id']}`);
    } else {
      console.log(`   No record found in village "${sampleVillage}"`);
    }

    // 4. Field Presence Analysis
    console.log('\n4. FIELD PRESENCE ANALYSIS:');
    const fieldsToCheck = [
      'अ.क्र', 'खातेदाराचे नांव', 'Village', 'Taluka', 'District',
      'is_active', 'project_id', 'created_at', 'updated_at'
    ];

    for (const field of fieldsToCheck) {
      const count = await collection.countDocuments({ [field]: { $exists: true } });
      console.log(`   ${field}: ${count}/${totalCount} records (${((count/totalCount)*100).toFixed(1)}%)`);
    }

    // 5. Data Types Analysis
    console.log('\n5. DATA TYPES ANALYSIS:');
    for (const field of ['project_id', 'अ.क्र', 'is_active']) {
      const types = await collection.aggregate([
        { $match: { [field]: { $exists: true } } },
        {
          $group: {
            _id: { $type: `$${field}` },
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      
      console.log(`   ${field} types:`);
      types.forEach(type => {
        console.log(`     - ${type._id}: ${type.count} records`);
      });
    }

    // 6. Sample Complete Record
    console.log('\n6. SAMPLE COMPLETE RECORD:');
    const completeRecord = await collection.findOne({
      'अ.क्र': { $exists: true },
      'खातेदाराचे नांव': { $exists: true },
      'Village': { $exists: true }
    });
    
    if (completeRecord) {
      console.log('   Found complete record:');
      console.log(`   - Serial (अ.क्र): ${completeRecord['अ.क्र']}`);
      console.log(`   - Owner (खातेदाराचे नांव): ${completeRecord['खातेदाराचे नांव']}`);
      console.log(`   - Village: ${completeRecord['Village']}`);
      console.log(`   - Project ID: ${completeRecord['project_id']}`);
      console.log(`   - is_active: ${completeRecord['is_active']}`);
    } else {
      console.log('   No complete record found with all key fields');
    }

    // 7. Check if data exists with different field names
    console.log('\n7. ALTERNATIVE FIELD NAMES CHECK:');
    const alternativeFields = [
      'serial_number', 'serial', 'sr_no', 'srno',
      'owner_name', 'owner', 'name',
      'अ_क्र', 'खातेदाराचे_नांव'
    ];

    for (const field of alternativeFields) {
      const count = await collection.countDocuments({ [field]: { $exists: true } });
      if (count > 0) {
        console.log(`   Found ${count} records with field "${field}"`);
        const sample = await collection.findOne({ [field]: { $exists: true } });
        console.log(`   Sample value: ${sample[field]}`);
      }
    }

    console.log('\n=== ANALYSIS COMPLETE ===');

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeLandownerRecords2Only();