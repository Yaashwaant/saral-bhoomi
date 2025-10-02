import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeLandownerRecords2Structure() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Get the native MongoDB client from Mongoose
    const db = mongoose.connection.db;
    const collection = db.collection('landownerrecords2');

    console.log('=== COMPREHENSIVE ANALYSIS OF LANDOWNERRECORDS2 ===\n');

    // 1. Basic Collection Info
    console.log('1. COLLECTION STATISTICS:');
    const totalCount = await collection.countDocuments();
    console.log(`   Total documents: ${totalCount}`);

    // 2. Sample a few documents to understand structure
    console.log('\n2. SAMPLE DOCUMENT STRUCTURE:');
    const sampleDocs = await collection.find({}).limit(3).toArray();
    
    sampleDocs.forEach((doc, index) => {
      console.log(`\n   Sample ${index + 1} (ID: ${doc._id}):`);
      console.log(`   - project_id: ${doc.project_id} (type: ${typeof doc.project_id})`);
      console.log(`   - is_active: ${doc.is_active} (type: ${typeof doc.is_active})`);
      console.log(`   - अ_क्र (serial): ${doc.अ_क्र}`);
      console.log(`   - खातेदाराचे_नांव (name): ${doc.खातेदाराचे_नांव}`);
      console.log(`   - Village: ${doc.Village}`);
      console.log(`   - created_at: ${doc.created_at}`);
      console.log(`   - updated_at: ${doc.updated_at}`);
    });

    // 3. Check all unique field names
    console.log('\n3. ALL FIELD NAMES IN COLLECTION:');
    const allFields = new Set();
    const cursor = collection.find({});
    
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      Object.keys(doc).forEach(field => allFields.add(field));
    }
    
    const fieldArray = Array.from(allFields).sort();
    console.log(`   Total unique fields: ${fieldArray.length}`);
    fieldArray.forEach(field => console.log(`   - ${field}`));

    // 4. Check project_id data types and values
    console.log('\n4. PROJECT_ID ANALYSIS:');
    const projectIdTypes = await collection.aggregate([
      {
        $group: {
          _id: { type: { $type: '$project_id' }, value: '$project_id' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('   Project ID types and values:');
    projectIdTypes.forEach(item => {
      console.log(`   - Type: ${item._id.type}, Value: ${item._id.value}, Count: ${item.count}`);
    });

    // 5. Check is_active field values
    console.log('\n5. IS_ACTIVE FIELD ANALYSIS:');
    const isActiveValues = await collection.aggregate([
      {
        $group: {
          _id: '$is_active',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    console.log('   is_active values:');
    isActiveValues.forEach(item => {
      console.log(`   - Value: ${item._id}, Count: ${item.count}`);
    });

    // 6. Check for documents missing key fields
    console.log('\n6. MISSING FIELD ANALYSIS:');
    const missingProjectId = await collection.countDocuments({ project_id: { $exists: false } });
    const missingIsActive = await collection.countDocuments({ is_active: { $exists: false } });
    const missingSerial = await collection.countDocuments({ अ_क्र: { $exists: false } });
    const missingName = await collection.countDocuments({ खातेदाराचे_नांव: { $exists: false } });
    
    console.log(`   Missing project_id: ${missingProjectId}`);
    console.log(`   Missing is_active: ${missingIsActive}`);
    console.log(`   Missing अ_क्र (serial): ${missingSerial}`);
    console.log(`   Missing खातेदाराचे_नांव (name): ${missingName}`);

    // 7. Check data types of key fields
    console.log('\n7. DATA TYPES OF KEY FIELDS:');
    const keyFields = ['project_id', 'is_active', 'अ_क्र', 'खातेदाराचे_नांव', 'Village', 'Taluka', 'District'];
    
    for (const field of keyFields) {
      const types = await collection.aggregate([
        { $match: { [field]: { $exists: true } } },
        {
          $group: {
            _id: { $type: `$${field}` },
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      
      console.log(`   ${field}:`);
      types.forEach(type => {
        console.log(`     - Type: ${type._id}, Count: ${type.count}`);
      });
    }

    // 8. Check for duplicate serial numbers within same project
    console.log('\n8. DUPLICATE SERIAL NUMBERS CHECK:');
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: { project_id: '$project_id', serial: '$अ_क्र' },
          count: { $sum: 1 },
          docIds: { $push: '$_id' }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.log(`   Found ${duplicates.length} duplicate serial numbers:`);
      duplicates.forEach(dup => {
        console.log(`   - Project: ${dup._id.project_id}, Serial: ${dup._id.serial}, Count: ${dup.count}`);
      });
    } else {
      console.log('   No duplicate serial numbers found');
    }

    console.log('\n=== ANALYSIS COMPLETE ===');

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeLandownerRecords2Structure();