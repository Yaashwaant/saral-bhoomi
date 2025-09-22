const { MongoClient } = require('mongodb');

async function checkConflicts() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    const collection = db.collection('landownerrecords');
    
    // Check for any records with survey_number 67
    const records67 = await collection.find({ survey_number: '67' }).toArray();
    console.log(`Records with survey_number '67': ${records67.length}`);
    
    records67.forEach((record, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`- ID: ${record._id}`);
      console.log(`- Project ID: ${record.project_id}`);
      console.log(`- Survey Number: ${record.survey_number}`);
      console.log(`- Landowner: ${record.landowner_name}`);
    });
    
    // Check for any records with the target project ID
    const targetProjectId = '68b833f8c2e6f8a446510454';
    const projectRecords = await collection.find({ project_id: targetProjectId }).toArray();
    console.log(`\nRecords for project ${targetProjectId}: ${projectRecords.length}`);
    
    projectRecords.forEach((record, index) => {
      console.log(`\nProject Record ${index + 1}:`);
      console.log(`- ID: ${record._id}`);
      console.log(`- Survey Number: ${record.survey_number}`);
      console.log(`- Landowner: ${record.landowner_name}`);
    });
    
    // Check if there are any records that might conflict
    const allRecords = await collection.find({}).toArray();
    console.log(`\nTotal records in database: ${allRecords.length}`);
    
    // Check for any survey number 67 in any field
    const any67 = allRecords.filter(record => 
      record.survey_number === '67' || 
      record['सर्वे_नं'] === '67' || 
      record['नविन_स.नं.'] === '67'
    );
    
    console.log(`Records with survey number 67 in any field: ${any67.length}`);
    any67.forEach((record, index) => {
      console.log(`\nAny 67 Record ${index + 1}:`);
      console.log(`- ID: ${record._id}`);
      console.log(`- Project: ${record.project_id || record.projectId}`);
      console.log(`- Survey (English): ${record.survey_number}`);
      console.log(`- Survey (Marathi): ${record['सर्वे_नं']}`);
      console.log(`- Survey (New): ${record['नविन_स.नं.']}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkConflicts();
