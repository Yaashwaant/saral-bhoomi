import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function debugFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi');
    
    console.log('Checking landownerrecords_english_complete collection...');
    const db = mongoose.connection.db;
    const collection = db.collection('landownerrecords_english_complete');
    
    const record = await collection.findOne({});
    
    if (!record) {
      console.log('No records found in landownerrecords_english_complete');
      
      // Check what collections exist
      const collections = await db.listCollections().toArray();
      console.log('\nAvailable collections:');
      collections.forEach(col => console.log(col.name));
      return;
    }
    
    console.log('\nAll fields in the English complete record:');
    const fields = Object.keys(record);
    fields.forEach(field => {
      const value = record[field];
      console.log(`${field}: ${value} (type: ${typeof value})`);
    });
    
    // Check a few more records
    console.log('\nChecking 5 more records from English complete collection...');
    const moreRecords = await collection.find({}).limit(5).toArray();
    moreRecords.forEach((rec, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`survey_number: ${rec.survey_number}`);
      console.log(`landowner_name: ${rec.landowner_name}`);
      console.log(`project_id: ${rec.project_id}`);
      console.log(`village: ${rec.village}`);
    });
    
    // Check for survey number variations
    console.log('\nSurvey number variations:');
    const surveyVariations = ['survey_number', 'स.नं./हि.नं./ग.नं.', 'सर्वे_नं', 'Survey', 'survey', 'new_survey_number', 'old_survey_number', 'surveyNumber', 'cts_number'];
    surveyVariations.forEach(field => {
      const value = record[field];
      console.log(`${field}: ${value} ${value ? '(FOUND!)' : '(not found)'}`);
    });
    
    // Check for landowner name variations
    console.log('\nLandowner name variations:');
    const nameVariations = ['landowner_name', 'खातेदाराचे_नांव', 'owner_name', 'name', 'landOwnerName', 'ownerName'];
    nameVariations.forEach(field => {
      const value = record[field];
      console.log(`${field}: ${value} ${value ? '(FOUND!)' : '(not found)'}`);
    });
    
    // Show all available fields to identify the correct ones
    console.log('\nAll available fields in the record:');
    Object.keys(record).forEach(field => {
      const value = record[field];
      if (value && value !== '') {
        console.log(`${field}: ${value}`);
      }
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugFields();