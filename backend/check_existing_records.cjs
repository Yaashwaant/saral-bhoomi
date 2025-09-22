const { MongoClient } = require('mongodb');

async function checkExistingRecords() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    const collection = db.collection('landownerrecords');
    
    // Find all records for the project
    const records = await collection.find({ 
      project_id: '68b833f8c2e6f8a446510454' 
    }).toArray();
    
    console.log(`Found ${records.length} existing records:`);
    records.forEach(record => {
      console.log(`- Survey: ${record.survey_number}, Landowner: ${record.landowner_name}`);
    });
    
    // Check for survey number 67 specifically
    const survey67 = await collection.find({ 
      project_id: '68b833f8c2e6f8a446510454',
      survey_number: '67'
    }).toArray();
    
    console.log(`\nSurvey number 67 records: ${survey67.length}`);
    survey67.forEach(record => {
      console.log(`- ID: ${record._id}, Landowner: ${record.landowner_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkExistingRecords();
