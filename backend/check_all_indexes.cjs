const { MongoClient } = require('mongodb');

async function checkAllIndexes() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    const collection = db.collection('landownerrecords');
    
    // Get all indexes including system indexes
    const indexes = await collection.indexes();
    console.log('All indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique})`);
    });
    
    // Check if there are any records with survey_number 67
    const records67 = await collection.find({ survey_number: '67' }).toArray();
    console.log(`\nRecords with survey_number '67': ${records67.length}`);
    records67.forEach(record => {
      console.log(`- ID: ${record._id}, Project: ${record.project_id}, Landowner: ${record.landowner_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkAllIndexes();
