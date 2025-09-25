const mongoose = require('mongoose');

async function checkData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/saral_bhoomi');
    const { default: LandownerRecord } = await import('../models/mongo/LandownerRecord.js');
    const { default: Project } = await import('../models/mongo/Project.js');
    
    // Check all projects
    const projects = await Project.find({});
    console.log('📁 All Projects:');
    projects.forEach(project => {
      console.log(`   - ${project.projectName} (ID: ${project._id})`);
    });
    
    // Check records by project
    console.log('\n📊 Records by Project:');
    for (const project of projects) {
      const count = await LandownerRecord.countDocuments({ project_id: project._id });
      console.log(`   - ${project.projectName}: ${count} records`);
      
      if (count > 0) {
        const sample = await LandownerRecord.findOne({ project_id: project._id });
        console.log(`     Sample: ${sample.landowner_name} (Survey: ${sample.survey_number})`);
        console.log(`     Data Format: ${sample.data_format || 'legacy'}`);
      }
    }
    
    // Check total records
    const totalRecords = await LandownerRecord.countDocuments({});
    console.log(`\n📦 Total landowner records in database: ${totalRecords}`);
    
    // Check records with new format
    const newFormatRecords = await LandownerRecord.countDocuments({ data_format: 'parishisht_k' });
    console.log(`📊 New format (Parishisht-K) records: ${newFormatRecords}`);
    
    await mongoose.disconnect();
    console.log('✅ Check completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
