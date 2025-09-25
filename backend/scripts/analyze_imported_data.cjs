const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function analyzeImportedData() {
  console.log('🔍 ANALYZING IMPORTED DATA');
  console.log('=====================================');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const { default: LandownerRecord } = await import('../models/mongo/LandownerRecord.js');
    const { default: Project } = await import('../models/mongo/Project.js');
    
    const project = await Project.findOne({ projectName: 'Chandrapada Import Project' });
    if (!project) {
      console.log('❌ Project not found');
      return;
    }
    
    const records = await LandownerRecord.find({ project_id: project._id });
    
    console.log('📊 Current database status:');
    console.log('Records in database:', records.length);
    console.log('Project ID:', project._id);
    
    console.log('\n🔍 Sample records and their unique keys:');
    records.slice(0, 10).forEach((record, i) => {
      console.log(`${i+1}. Name: ${record.landowner_name?.substring(0, 40)}...`);
      console.log(`   Old Survey: ${record.old_survey_number}`);
      console.log(`   New Survey: ${record.new_survey_number}`);
      console.log(`   Serial: ${record.serial_number}`);
      console.log(`   Area: ${record.total_area_village_record}`);
      console.log(`   Final Amount: ${record.final_payable_amount}`);
      console.log();
    });
    
    // Check for potential duplicates by unique constraint
    const duplicateCheck = {};
    const duplicates = [];
    
    records.forEach(record => {
      const key = `${record.old_survey_number}_${record.new_survey_number}_${record.landowner_name}`;
      if (duplicateCheck[key]) {
        duplicates.push({
          key,
          record1: duplicateCheck[key],
          record2: record
        });
      } else {
        duplicateCheck[key] = record;
      }
    });
    
    console.log('🔍 Duplicate analysis:');
    console.log('Unique keys in database:', Object.keys(duplicateCheck).length);
    console.log('Actual duplicate records:', duplicates.length);
    
    if (duplicates.length > 0) {
      console.log('\n📋 Found duplicates:');
      duplicates.forEach((dup, i) => {
        console.log(`${i+1}. Key: ${dup.key.substring(0, 50)}...`);
      });
    }
    
    // Analyze data completeness
    console.log('\n📊 Data completeness analysis:');
    const sampleRecord = records[0];
    if (sampleRecord) {
      const fields = Object.keys(sampleRecord.toObject());
      console.log('Total fields per record:', fields.length);
      
      // Check which fields have data
      const fieldStats = {};
      fields.forEach(field => {
        fieldStats[field] = 0;
      });
      
      records.forEach(record => {
        fields.forEach(field => {
          if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
            fieldStats[field]++;
          }
        });
      });
      
      console.log('\n📋 Field population (top 15 fields):');
      Object.entries(fieldStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .forEach(([field, count]) => {
          const percentage = ((count / records.length) * 100).toFixed(1);
          console.log(`  ${field}: ${count}/${records.length} (${percentage}%)`);
        });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Analysis completed');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

analyzeImportedData();
