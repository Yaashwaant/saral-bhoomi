const { MongoClient } = require('mongodb');

async function fixIndexes() {
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
    
    // Drop the problematic survey_number index if it exists
    try {
      await collection.dropIndex('survey_number_1');
      console.log('✓ Dropped survey_number_1 index');
    } catch (error) {
      console.log('survey_number_1 index not found or already dropped');
    }
    
    // Drop the old Marathi index if it exists
    try {
      await collection.dropIndex('सर्वे_नं_1');
      console.log('✓ Dropped सर्वे_नं_1 index');
    } catch (error) {
      console.log('सर्वे_नं_1 index not found or already dropped');
    }
    
    // Create a compound index for project_id and survey_number to allow duplicates across projects
    try {
      await collection.createIndex({ project_id: 1, survey_number: 1 }, { unique: true });
      console.log('✓ Created compound index on project_id and survey_number');
    } catch (error) {
      console.log('Compound index already exists or error:', error.message);
    }
    
    // Show final indexes
    const finalIndexes = await collection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixIndexes();
