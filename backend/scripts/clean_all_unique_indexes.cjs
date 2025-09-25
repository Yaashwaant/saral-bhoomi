const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function cleanAllUniqueIndexes() {
  console.log('🔧 CLEANING ALL CONFLICTING UNIQUE INDEXES');
  console.log('=====================================');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const { default: LandownerRecord } = await import('../models/mongo/LandownerRecord.js');
    const collection = LandownerRecord.collection;
    
    // List current indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('📋 Current unique indexes:');
    indexes.filter(index => index.unique).forEach(index => {
      console.log(`  ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Drop old problematic unique indexes (keep only our new one)
    const indexesToDrop = [
      'survey_number_1',
      'project_survey_landowner_unique', 
      'project_id_1_survey_number_1'
    ];
    
    console.log('\n🗑️ Dropping old unique indexes:');
    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`  ✅ Dropped: ${indexName}`);
      } catch (error) {
        if (error.code === 27) {
          console.log(`  ℹ️  Not found: ${indexName}`);
        } else {
          console.log(`  ❌ Error dropping ${indexName}: ${error.message}`);
        }
      }
    }
    
    // Ensure our new unique index exists
    console.log('\n🔧 Ensuring correct unique index:');
    try {
      await collection.createIndex(
        { project_id: 1, serial_number: 1 },
        { unique: true, name: 'project_id_1_serial_number_1' }
      );
      console.log('  ✅ Created/Confirmed: project_id + serial_number');
    } catch (error) {
      if (error.code === 85) {
        console.log('  ℹ️  Already exists: project_id + serial_number');
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    // List final indexes
    console.log('\n📋 Final unique indexes:');
    const finalIndexes = await collection.listIndexes().toArray();
    finalIndexes.filter(index => index.unique).forEach(index => {
      console.log(`  ✅ ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Index cleanup completed');
    
  } catch (error) {
    console.error('❌ Index cleanup failed:', error);
  }
}

cleanAllUniqueIndexes();
