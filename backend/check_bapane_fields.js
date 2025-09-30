const { MongoClient } = require('mongodb');

async function checkBapaneFields() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('saral_bhoomi_dev');
    const collection = db.collection('landownerrecords');
    
    // Find a Bapane record
    const bapaneRecord = await collection.findOne({ 
      village_name: { $regex: /bapane/i } 
    });
    
    if (bapaneRecord) {
      console.log('\n🔍 Bapane record compensation fields:');
      console.log('- final_payable_amount:', bapaneRecord.final_payable_amount);
      console.log('- final_amount:', bapaneRecord.final_amount);
      console.log('- total_compensation_amount:', bapaneRecord.total_compensation_amount);
      console.log('- total_compensation:', bapaneRecord.total_compensation);
      console.log('- determined_compensation:', bapaneRecord.determined_compensation);
      console.log('- solatium_100_percent:', bapaneRecord.solatium_100_percent);
      console.log('- additional_25_percent_compensation:', bapaneRecord.additional_25_percent_compensation);
      
      console.log('\n🔗 Project linkage fields:');
      console.log('- project_id:', bapaneRecord.project_id);
      console.log('- projectId:', bapaneRecord.projectId);
      
      console.log('\n📋 All compensation/project related fields:');
      const relevantFields = Object.keys(bapaneRecord).filter(k => 
        k.includes('amount') || 
        k.includes('compensation') || 
        k.includes('final') || 
        k.includes('project') ||
        k.includes('solatium')
      );
      console.log(relevantFields);
      
      console.log('\n📊 Sample record values:');
      console.log('Landowner:', bapaneRecord.landowner_name);
      console.log('Survey:', bapaneRecord.survey_number);
      console.log('Village:', bapaneRecord.village_name);
      
    } else {
      console.log('❌ No Bapane record found');
      
      // Check what records exist
      const totalRecords = await collection.countDocuments();
      console.log(`Total records in database: ${totalRecords}`);
      
      const sampleRecord = await collection.findOne();
      if (sampleRecord) {
        console.log('\n📋 Sample record fields:');
        console.log(Object.keys(sampleRecord));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkBapaneFields();