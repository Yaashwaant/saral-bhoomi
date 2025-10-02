import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './backend/models/Project.js';

// Load environment variables
dotenv.config();

async function checkProjectData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi');
    console.log('✅ Connected to MongoDB');
    
    // Get all projects with all fields
    const projects = await Project.find({}).lean();
    console.log(`\n📊 Found ${projects.length} projects in database:`);
    
    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. Project Details:`);
      console.log(`   _id: ${project._id}`);
      console.log(`   projectNumber: ${project.projectNumber || '❌ MISSING'}`);
      console.log(`   projectName: ${project.projectName}`);
      console.log(`   schemeName: ${project.schemeName}`);
      console.log(`   district: ${project.district}`);
      console.log(`   taluka: ${project.taluka}`);
      console.log(`   type: ${project.type}`);
      console.log(`   status (overall): ${project.status?.overall || 'N/A'}`);
      console.log(`   isActive: ${project.isActive}`);
      console.log(`   createdAt: ${project.createdAt}`);
      console.log(`   updatedAt: ${project.updatedAt}`);
      
      // Check for any status fields
      if (project.stage3A || project.stage3D || project.corrigendum || project.award) {
        console.log(`   Stage Statuses:`);
        console.log(`     stage3A: ${project.stage3A}`);
        console.log(`     stage3D: ${project.stage3D}`);
        console.log(`     corrigendum: ${project.corrigendum}`);
        console.log(`     award: ${project.award}`);
      }
      
      // Check for budget and land info
      if (project.estimatedCost || project.allocatedBudget) {
        console.log(`   Budget: ₹${project.estimatedCost} / ₹${project.allocatedBudget}`);
      }
      if (project.landRequired || project.landAvailable) {
        console.log(`   Land: ${project.landAvailable}ha / ${project.landRequired}ha required`);
      }
    });
    
    // Check if any projects have projectNumber
    const projectsWithNumbers = projects.filter(p => p.projectNumber);
    console.log(`\n📈 Summary:`);
    console.log(`   Total projects: ${projects.length}`);
    console.log(`   Projects with projectNumber: ${projectsWithNumbers.length}`);
    console.log(`   Projects missing projectNumber: ${projects.length - projectsWithNumbers.length}`);
    
    if (projectsWithNumbers.length > 0) {
      console.log(`   Existing project numbers: ${projectsWithNumbers.map(p => p.projectNumber).join(', ')}`);
    }
    
    // Check the raw MongoDB data
    console.log(`\n🔍 Raw MongoDB Query Results:`);
    const rawProjects = await mongoose.connection.db.collection('projects').find({}).toArray();
    console.log(`   Raw documents count: ${rawProjects.length}`);
    
    rawProjects.forEach((doc, index) => {
      console.log(`   ${index + 1}. Raw doc _id: ${doc._id}`);
      console.log(`      projectNumber: ${doc.projectNumber || '❌ MISSING'}`);
      console.log(`      schemeName: ${doc.schemeName}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking project data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkProjectData();