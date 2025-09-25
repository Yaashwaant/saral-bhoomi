const mongoose = require('mongoose');

/**
 * Update database indexes to support new unique constraint
 * Drop old index and create new one
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';

async function updateIndexes() {
  let connection;
  
  try {
    console.log('🚀 Updating database indexes...');
    
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the collection directly
    const db = mongoose.connection.db;
    const collection = db.collection('landownerrecords');
    
    console.log('📋 Current indexes:');
    const currentIndexes = await collection.indexes();
    currentIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Drop the old unique index if it exists
    try {
      console.log('🗑️ Dropping old unique index...');
      await collection.dropIndex('project_id_1_survey_number_1');
      console.log('✅ Old index dropped successfully');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Old index does not exist, skipping drop');
      } else {
        console.warn('⚠️ Error dropping old index:', error.message);
      }
    }
    
    // Create new unique index
    console.log('🔧 Creating new unique index...');
    await collection.createIndex(
      { 
        project_id: 1, 
        old_survey_number: 1, 
        new_survey_number: 1, 
        landowner_name: 1 
      },
      { 
        unique: true,
        name: 'project_oldsurvey_newsurvey_landowner_unique'
      }
    );
    console.log('✅ New unique index created successfully');
    
    // Show updated indexes
    console.log('📋 Updated indexes:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n🎉 Index update completed successfully!');
    console.log('🔑 New unique constraint: project_id + old_survey_number + new_survey_number + landowner_name');
    
  } catch (error) {
    console.error('💥 Index update failed:', error);
    throw error;
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('📦 Disconnected from MongoDB');
    }
  }
}

// Run the index update
updateIndexes()
  .then(() => {
    console.log('🏁 Index update process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Index update process failed:', error);
    process.exit(1);
  });
