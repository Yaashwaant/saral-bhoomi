import mongoose from 'mongoose';
import MongoProject from './models/mongo/Project.js';
import MongoLandownerRecord from './models/mongo/LandownerRecord.js';
import dotenv from 'dotenv';
dotenv.config();

async function verifyChandrapada() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi');
    
    const project = await MongoProject.findOne({ name: 'Chandrapada Project' });
    if (!project) {
      console.log('❌ Chandrapada Project not found');
      return;
    }
    
    console.log('📊 Chandrapada Project Found:');
    console.log('  - Project ID:', project._id);
    console.log('  - Project Number:', project.projectNumber);
    console.log('  - Name:', project.name);
    
    const recordCount = await MongoLandownerRecord.countDocuments({ project_id: project._id });
    console.log('  - Total Records:', recordCount);
    
    if (recordCount > 0) {
      const sampleRecords = await MongoLandownerRecord.find({ project_id: project._id }).limit(3);
      console.log('\n📋 Sample Records:');
      sampleRecords.forEach((record, index) => {
        console.log(`  Record ${index + 1}:`);
        console.log(`    - Name: ${record.landowner_name}`);
        console.log(`    - Survey: ${record.survey_number}`);
        console.log(`    - Area: ${record.total_area_village_record || record.area}`);
        console.log(`    - Village: ${record.village}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyChandrapada();