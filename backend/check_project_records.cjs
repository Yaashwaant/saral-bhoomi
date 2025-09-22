const { MongoClient } = require('mongodb');

async function checkProjectRecords() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    const collection = db.collection('landownerrecords');
    
    // Check for records with the specific project ID from the frontend
    const targetProjectId = '68b833f8c2e6f8a446510454';
    const records = await collection.find({ 
      project_id: targetProjectId 
    }).toArray();
    
    console.log(`Records for project ${targetProjectId}: ${records.length}`);
    
    records.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`- ID: ${record._id}`);
      console.log(`- Survey Number: ${record.survey_number}`);
      console.log(`- Landowner: ${record.landowner_name}`);
      console.log(`- Village: ${record.village}`);
    });
    
    // Also check all unique project IDs
    const allProjectIds = await collection.distinct('project_id');
    console.log(`\nAll project IDs in database: ${allProjectIds.join(', ')}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkProjectRecords();
