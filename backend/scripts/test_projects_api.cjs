const { default: fetch } = require('node-fetch');

async function testProjectsAPI() {
  try {
    console.log('🔍 Testing Projects API...');
    
    const response = await fetch('http://localhost:5000/api/projects?limit=100');
    const data = await response.json();
    
    console.log('📊 API Response:');
    console.log('Count:', data.count);
    console.log('Total:', data.total);
    console.log('Success:', data.success);
    
    console.log('\n📁 Projects returned by API:');
    data.data.forEach(project => {
      console.log(`- ${project.projectName} (ID: ${project.id})`);
      console.log(`  Active: ${project.isActive}`);
      console.log(`  Scheme: ${project.schemeName}`);
      console.log(`  Type: ${project.type}`);
      console.log();
    });
    
    // Also test database directly
    console.log('📦 Checking database directly...');
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://localhost:27017/saral_bhoomi');
    const { default: Project } = await import('../models/mongo/Project.js');
    
    const allProjects = await Project.find({});
    console.log(`\n📋 Total projects in database: ${allProjects.length}`);
    allProjects.forEach(project => {
      console.log(`- ${project.projectName} (ID: ${project._id})`);
      console.log(`  Active: ${project.isActive}`);
      console.log(`  Created: ${project.createdAt}`);
      console.log();
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testProjectsAPI();
