const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function checkIndexes() {
  console.log('🔍 CHECKING DATABASE INDEXES');
  console.log('=====================================');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const { default: LandownerRecord } = await import('../models/mongo/LandownerRecord.js');
    const indexes = await LandownerRecord.collection.listIndexes().toArray();
    
    console.log('📋 All indexes:');
    indexes.forEach(index => {
      console.log(`  ${index.name}: ${JSON.stringify(index.key)}`);
      if (index.unique) console.log(`    ⚠️  UNIQUE INDEX`);
    });
    
    console.log('\n🔍 Unique indexes only:');
    const uniqueIndexes = indexes.filter(index => index.unique);
    if (uniqueIndexes.length === 0) {
      console.log('  No unique indexes found (other than _id)');
    } else {
      uniqueIndexes.forEach(index => {
        console.log(`  ✅ ${index.name}: ${JSON.stringify(index.key)}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Index check completed');
    
  } catch (error) {
    console.error('❌ Index check failed:', error);
  }
}

checkIndexes();
