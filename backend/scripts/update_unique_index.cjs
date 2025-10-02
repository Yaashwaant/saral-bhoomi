const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function updateUniqueIndex() {
  console.log('🔧 UPDATING UNIQUE INDEX');
  console.log('=====================================');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const { default: LandownerRecord } = await import('../models/mongo/LandownerRecord.js');
    
    // Get the collection
    const collection = LandownerRecord.collection;
    
    // List existing indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.listIndexes().toArray();
    indexes.forEach(index => {
      console.log(`  ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.unique) console.log(`    (unique: true)`);
    });
    
    // Drop old unique indexes if they exist
    const oldIndexNames = [
      'project_id_1_old_survey_number_1_new_survey_number_1_landowner_name_1',
      'project_id_1_serial_number_1'
    ];
    for (const oldIndexName of oldIndexNames) {
      try {
        await collection.dropIndex(oldIndexName);
        console.log(`✅ Dropped old unique index: ${oldIndexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`ℹ️  Old unique index not found: ${oldIndexName} (already dropped)`);
        } else {
          console.log(`⚠️  Error dropping old index ${oldIndexName}: ${error.message}`);
        }
      }
    }
    
    // Create new unique index scoped by village
    try {
      await collection.createIndex(
        { project_id: 1, village: 1, serial_number: 1 },
        { unique: true, name: 'project_id_1_village_1_serial_number_1' }
      );
      console.log(`✅ Created new unique index: project_id + village + serial_number`);
    } catch (error) {
      console.log(`⚠️  Error creating new index: ${error.message}`);
    }
    
    // List indexes after update
    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await collection.listIndexes().toArray();
    updatedIndexes.forEach(index => {
      console.log(`  ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.unique) console.log(`    (unique: true)`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Index update completed');
    
  } catch (error) {
    console.error('❌ Index update failed:', error);
  }
}

updateUniqueIndex();
