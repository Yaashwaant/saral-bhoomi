import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

// Import models
import '../models/index.js';
const Project = mongoose.model('Project');

async function listProjects() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all projects
    const projects = await Project.find({});
    
    console.log('\n=== All Projects ===');
    console.log('Total projects:', projects.length);
    
    projects.forEach((project, index) => {
      console.log(`\nProject ${index + 1}:`);
      console.log(`  ID: ${project._id}`);
      console.log(`  Name: ${project.projectName || project.name}`);
      console.log(`  Number: ${project.projectNumber}`);
      console.log(`  Villages: ${project.villages || 'Not set'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

listProjects();