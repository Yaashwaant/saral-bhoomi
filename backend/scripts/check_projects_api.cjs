const mongoose = require('mongoose');

async function checkProjectsAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/saral_bhoomi');
    const { default: Project } = await import('../models/mongo/Project.js');
    
    const projects = await Project.find({});
    console.log('📁 Projects in database:');
    projects.forEach(project => {
      console.log(`   - Name: ${project.projectName}`);
      console.log(`     ID: ${project._id}`);
      console.log(`     Scheme: ${project.schemeName}`);
      console.log(`     Active: ${project.isActive !== false}`);
      console.log(`     Type: ${project.type}`);
      console.log();
    });
    
    // Also check what the API endpoint should return
    console.log('📊 API Response format:');
    const apiResponse = projects.map(project => ({
      id: project._id.toString(),
      projectName: project.projectName,
      pmisCode: project.pmisCode,
      schemeName: project.schemeName,
      landRequired: project.landRequired,
      landAvailable: project.landAvailable,
      landToBeAcquired: project.landToBeAcquired,
      type: project.type,
      district: project.district,
      taluka: project.taluka,
      villages: project.villages,
      isActive: project.isActive !== false,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));
    
    console.log('Projects for frontend:');
    apiResponse.forEach(project => {
      console.log(`   - ${project.projectName} (${project.id})`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProjectsAPI();
