const { MongoClient } = require('mongodb');

async function checkSurvey67() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    const collection = db.collection('landownerrecords');
    
    // Check for survey number 67 in both English and Marathi fields
    const records = await collection.find({
      $or: [
        { survey_number: '67' },
        { 'सर्वे_नं': '67' },
        { 'नविन_स.नं.': '67' }
      ]
    }).toArray();
    
    console.log(`Found ${records.length} records with survey number 67:`);
    records.forEach(record => {
      console.log(`- ID: ${record._id}`);
      console.log(`- English survey_number: ${record.survey_number}`);
      console.log(`- Marathi सर्वे_नं: ${record['सर्वे_नं']}`);
      console.log(`- Marathi नविन_स.नं.: ${record['नविन_स.नं.']}`);
      console.log(`- Landowner: ${record.landowner_name || record['खातेदाराचे_नांव']}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkSurvey67();
