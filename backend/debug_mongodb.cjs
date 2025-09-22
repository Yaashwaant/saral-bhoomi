const { MongoClient } = require('mongodb');

async function debugMongoDB() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('saral_bhoomi');
    const collection = db.collection('landownerrecords');
    
    // Try to insert a test record to see what happens
    console.log('Testing insert with survey_number 67...');
    
    try {
      const testRecord = {
        project_id: '68b833f8c2e6f8a446510454',
        survey_number: '67',
        landowner_name: 'Test Landowner',
        village: 'Test Village',
        taluka: 'Test Taluka',
        district: 'Test District',
        area: 1.0,
        acquired_area: 1.0,
        rate: 100000,
        total_compensation: 100000,
        solatium: 20000,
        final_amount: 120000,
        createdBy: 1,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await collection.insertOne(testRecord);
      console.log('✓ Test record inserted successfully:', result.insertedId);
      
      // Clean up the test record
      await collection.deleteOne({ _id: result.insertedId });
      console.log('✓ Test record cleaned up');
      
    } catch (insertError) {
      console.error('Insert error:', insertError.message);
      console.error('Error code:', insertError.code);
      console.error('Error name:', insertError.name);
    }
    
    // Check indexes again
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugMongoDB();
