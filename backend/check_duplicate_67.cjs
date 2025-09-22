const { MongoClient } = require('mongodb');

async function checkDuplicate67() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    const collection = db.collection('landownerrecords');
    
    // Check for any record with survey number 67 in any field
    const allRecords = await collection.find({}).toArray();
    
    console.log(`Total records: ${allRecords.length}`);
    
    allRecords.forEach((record, index) => {
      const survey67 = record.survey_number === '67' || 
                      record['सर्वे_नं'] === '67' || 
                      record['नविन_स.नं.'] === '67';
      
      if (survey67) {
        console.log(`\nRecord ${index + 1} has survey number 67:`);
        console.log(`- ID: ${record._id}`);
        console.log(`- survey_number: ${record.survey_number}`);
        console.log(`- सर्वे_नं: ${record['सर्वे_नं']}`);
        console.log(`- नविन_स.नं.: ${record['नविन_स.नं.']}`);
        console.log(`- Landowner: ${record.landowner_name || record['खातेदाराचे_नांव']}`);
        console.log(`- Project ID: ${record.project_id || record.projectId}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkDuplicate67();
