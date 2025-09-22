const { MongoClient } = require('mongodb');

async function checkAllRecords() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    const collection = db.collection('landownerrecords');
    
    const allRecords = await collection.find({}).toArray();
    
    console.log(`Total records: ${allRecords.length}`);
    
    allRecords.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`- ID: ${record._id}`);
      console.log(`- Project ID: ${record.project_id || record.projectId}`);
      console.log(`- Survey Number (English): ${record.survey_number}`);
      console.log(`- Survey Number (Marathi सर्वे_नं): ${record['सर्वे_नं']}`);
      console.log(`- Survey Number (Marathi नविन_स.नं.): ${record['नविन_स.नं.']}`);
      console.log(`- Landowner (English): ${record.landowner_name}`);
      console.log(`- Landowner (Marathi): ${record['खातेदाराचे_नांव']}`);
      console.log(`- Village: ${record.village}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkAllRecords();
