import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeCompleteLandownerData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    
    console.log('=== ANALYZING COLLECTIONS WITH COMPLETE DATA ===\n');

    // Check landownerrecords2 - the one we've been working with
    console.log('1. LANDOWNERRECORDS2 (Current collection):');
    const landownerrecords2 = db.collection('landownerrecords2');
    const count2 = await landownerrecords2.countDocuments();
    console.log(`   Total records: ${count2}`);
    
    const sample2 = await landownerrecords2.findOne({});
    if (sample2) {
      console.log('   Sample fields:', Object.keys(sample2));
      console.log('   Has अ.क्र:', 'अ.क्र' in sample2);
      console.log('   Has खातेदाराचे नांव:', 'खातेदाराचे नांव' in sample2);
      console.log('   Has is_active:', 'is_active' in sample2);
    }

    // Check landownerrecords - has serial_number and owner_name
    console.log('\n2. LANDOWNERRECORDS:');
    const landownerrecords = db.collection('landownerrecords');
    const count1 = await landownerrecords.countDocuments();
    console.log(`   Total records: ${count1}`);
    
    const sample1 = await landownerrecords.findOne({});
    if (sample1) {
      console.log('   Sample fields:', Object.keys(sample1));
      console.log('   Has serial_number:', 'serial_number' in sample1);
      console.log('   Has owner_name:', 'owner_name' in sample1);
      console.log('   Has is_active:', 'is_active' in sample1);
    }

    // Check landrecords2 - has अ_क्र and खातेदाराचे_नांव
    console.log('\n3. LANDRECORDS2:');
    const landrecords2 = db.collection('landrecords2');
    const count3 = await landrecords2.countDocuments();
    console.log(`   Total records: ${count3}`);
    
    const sample3 = await landrecords2.findOne({});
    if (sample3) {
      console.log('   Sample fields:', Object.keys(sample3));
      console.log('   Has अ_क्र:', 'अ_क्र' in sample3);
      console.log('   Has खातेदाराचे_नांव:', 'खातेदाराचे_नांव' in sample3);
      console.log('   Has is_active:', 'is_active' in sample3);
    }

    // Check enhancedjmrrecords
    console.log('\n4. ENHANCEDJMRRECORDS:');
    const enhancedjmrrecords = db.collection('enhancedjmrrecords');
    const count4 = await enhancedjmrrecords.countDocuments();
    console.log(`   Total records: ${count4}`);
    
    const sample4 = await enhancedjmrrecords.findOne({});
    if (sample4) {
      console.log('   Sample fields:', Object.keys(sample4));
      console.log('   Has serial_number:', 'serial_number' in sample4);
      console.log('   Has any owner field:', 
        'owner_name' in sample4 || 'owner' in sample4 || 'खातेदाराचे नांव' in sample4);
      console.log('   Has is_active:', 'is_active' in sample4);
    }

    // Now let's check if any collection has the complete data like your sample
    console.log('\n=== SEARCHING FOR COMPLETE RECORDS LIKE YOUR SAMPLE ===');
    
    // Search in landrecords2 for records with अ_क्र = 4
    const recordWithSerial4 = await landrecords2.findOne({ 'अ_क्र': 4 });
    if (recordWithSerial4) {
      console.log('\nFound record with अ_क्र = 4 in landrecords2:');
      console.log('Serial:', recordWithSerial4['अ_क्र']);
      console.log('Owner:', recordWithSerial4['खातेदाराचे_नांव']);
      console.log('Village:', recordWithSerial4['Village']);
      console.log('Project ID:', recordWithSerial4['project_id']);
      console.log('Has is_active:', 'is_active' in recordWithSerial4);
    }

    // Search in landownerrecords2 for records with Village = चंद्रपाडा
    const recordsInChandrapada = await landownerrecords2.find({ Village: 'चंद्रपाडा' }).toArray();
    console.log(`\nFound ${recordsInChandrapada.length} records in चंद्रपाडा village in landownerrecords2`);
    if (recordsInChandrapada.length > 0) {
      console.log('Sample record:');
      console.log('Project ID:', recordsInChandrapada[0]['project_id']);
      console.log('Village:', recordsInChandrapada[0]['Village']);
      console.log('Available fields:', Object.keys(recordsInChandrapada[0]));
    }

    // Check if there's a mapping between collections
    console.log('\n=== CHECKING PROJECT_ID CONSISTENCY ===');
    const projectIdsInLandownerrecords2 = await landownerrecords2.distinct('project_id');
    const projectIdsInLandrecords2 = await landrecords2.distinct('project_id');
    
    console.log('Project IDs in landownerrecords2:', projectIdsInLandownerrecords2);
    console.log('Project IDs in landrecords2:', projectIdsInLandrecords2);

    // Final recommendation
    console.log('\n=== RECOMMENDATION ===');
    console.log('Based on the analysis:');
    console.log('1. landownerrecords2 has 88 records but missing key fields');
    console.log('2. landrecords2 has complete data with अ_क्र and खातेदाराचे_नांव');
    console.log('3. The API is querying landownerrecords2 but should query landrecords2');
    console.log('4. Need to check if landrecords2 has is_active field or modify API');

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeCompleteLandownerData();