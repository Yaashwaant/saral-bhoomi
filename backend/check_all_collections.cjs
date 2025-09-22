const { MongoClient } = require('mongodb');

async function checkAllCollections() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Check landownerrecords collection
    const landownerCollection = db.collection('landownerrecords');
    const count = await landownerCollection.countDocuments();
    console.log(`\nlandownerrecords collection has ${count} documents`);
    
    // Get a sample document
    const sample = await landownerCollection.findOne();
    if (sample) {
      console.log('Sample document:', JSON.stringify(sample, null, 2));
    }
    
    // Check for the specific project
    const projectRecords = await landownerCollection.find({ 
      project_id: '68b833f8c2e6f8a446510454' 
    }).toArray();
    console.log(`\nRecords for project 68b833f8c2e6f8a446510454: ${projectRecords.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkAllCollections();
