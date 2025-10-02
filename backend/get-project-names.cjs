const mongoose = require('mongoose');
const Project = require('./models/mongo/Project.js');

async function getProjectNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi');
    console.log('Connected to MongoDB');
    
    const projects = await Project.find({}, 'projectName projectNumber schemeName type district').lean();
    console.log(`\nFound ${projects.length} projects:\n`);
    
    projects.forEach((project, index) => {
      console.log(`${index + 1}. Project Name: ${project.projectName}`);
      console.log(`   Project Number: ${project.projectNumber || 'Not assigned'}`);
      console.log(`   Scheme Name: ${project.schemeName || 'Not specified'}`);
      console.log(`   Type: ${project.type || 'Not specified'}`);
      console.log(`   District: ${project.district || 'Not specified'}`);
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getProjectNames();