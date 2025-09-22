const { MongoClient } = require('mongodb');

async function dropAllIndexes() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    const collection = db.collection('landownerrecords');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Drop all indexes except _id_
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`✓ Dropped index: ${index.name}`);
        } catch (error) {
          console.log(`Failed to drop ${index.name}: ${error.message}`);
        }
      }
    }
    
    // Create only the compound index we need
    try {
      await collection.createIndex({ project_id: 1, survey_number: 1 }, { unique: true });
      console.log('✓ Created compound index on project_id and survey_number');
    } catch (error) {
      console.log('Error creating compound index:', error.message);
    }
    
    // Show final indexes
    const finalIndexes = await collection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

dropAllIndexes();
