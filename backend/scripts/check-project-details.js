import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to check project details
const checkProjectDetails = async () => {
  console.log('🔍 Checking Project Details');
  console.log('===========================');
  
  // Check all collections to understand the structure
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n📋 Available Collections:');
  collections.forEach(col => {
    console.log(`   - ${col.name}`);
  });
  
  // Check if there's a projects collection
  const projectsCollection = mongoose.connection.db.collection('projects');
  const projectsCount = await projectsCollection.countDocuments();
  
  console.log(`\n📊 Projects Collection: ${projectsCount} documents\n`);
  
  if (projectsCount > 0) {
    const allProjects = await projectsCollection.find({}).toArray();
    
    console.log('🏗️  All Projects:');
    console.log('================\n');
    
    allProjects.forEach(project => {
      console.log(`🔸 Project ID: ${project._id}`);
      console.log(`   Name: ${project.name || 'N/A'}`);
      console.log(`   Description: ${project.description || 'N/A'}`);
      console.log(`   Type: ${project.type || 'N/A'}`);
      console.log(`   Status: ${project.status || 'N/A'}`);
      console.log(`   Location: ${project.location || 'N/A'}`);
      
      // Check if this is ROB or DFCC related
      const projectStr = JSON.stringify(project).toLowerCase();
      if (projectStr.includes('rob') || projectStr.includes('railway') || projectStr.includes('overbridge')) {
        console.log(`   🚂 *** THIS IS THE ROB PROJECT ***`);
      } else if (projectStr.includes('dfcc') || projectStr.includes('palghar')) {
        console.log(`   🏗️  *** THIS IS THE DFCC PROJECT ***`);
      }
      
      console.log('');
    });
  }
  
  // Also check the English collection for project-related fields
  console.log('📄 Sample Document Analysis:');
  console.log('============================\n');
  
  const englishCollection = mongoose.connection.db.collection('landownerrecords_english_complete');
  const sampleDoc = await englishCollection.findOne({});
  
  if (sampleDoc) {
    console.log('Fields in landowner records:');
    Object.keys(sampleDoc).forEach(key => {
      if (key.toLowerCase().includes('project') || key.toLowerCase().includes('notice')) {
        console.log(`   ${key}: ${sampleDoc[key]}`);
      }
    });
  }
  
  // Check for documents with different project IDs and their content
  console.log('\n🔍 Project ID Content Analysis:');
  console.log('==============================\n');
  
  const projectGroups = await englishCollection.aggregate([
    {
      $group: {
        _id: "$project_id",
        count: { $sum: 1 },
        sampleDoc: { $first: "$$ROOT" }
      }
    }
  ]).toArray();
  
  for (const group of projectGroups) {
    console.log(`🔸 Project ID: ${group._id} (${group.count} documents)`);
    
    const doc = group.sampleDoc;
    
    // Check notice number
    if (doc.notice_number) {
      console.log(`   Notice Number: ${doc.notice_number}`);
      if (doc.notice_number.toLowerCase().includes('rob')) {
        console.log(`   🚂 *** ROB PROJECT DETECTED ***`);
      } else if (doc.notice_number.toLowerCase().includes('dfcc')) {
        console.log(`   🏗️  *** DFCC PROJECT DETECTED ***`);
      }
    }
    
    // Check project name if exists
    if (doc.project_name) {
      console.log(`   Project Name: ${doc.project_name}`);
    }
    
    // Check other relevant fields
    if (doc.project_description) {
      console.log(`   Description: ${doc.project_description}`);
    }
    
    console.log('');
  }
  
  return {
    allProjects: projectsCount > 0 ? await projectsCollection.find({}).toArray() : [],
    projectGroups
  };
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting Project Details Check\n');
    
    const result = await checkProjectDetails();
    
    console.log('\n📋 Analysis Summary:');
    console.log('===================');
    
    // Find ROB and DFCC projects
    let robProjectId = null;
    let dfccProjectId = null;
    
    // Check in projects collection first
    result.allProjects.forEach(project => {
      const projectStr = JSON.stringify(project).toLowerCase();
      if (projectStr.includes('rob') || projectStr.includes('railway') || projectStr.includes('overbridge')) {
        robProjectId = project._id;
        console.log(`🚂 ROB Project ID: ${robProjectId}`);
      } else if (projectStr.includes('dfcc') || projectStr.includes('palghar')) {
        dfccProjectId = project._id;
        console.log(`🏗️  DFCC Project ID: ${dfccProjectId}`);
      }
    });
    
    // Check in document content
    result.projectGroups.forEach(group => {
      const doc = group.sampleDoc;
      const docStr = JSON.stringify(doc).toLowerCase();
      
      if (docStr.includes('rob') && !robProjectId) {
        robProjectId = group._id;
        console.log(`🚂 ROB Project ID (from documents): ${robProjectId}`);
      } else if (docStr.includes('dfcc') && !dfccProjectId) {
        dfccProjectId = group._id;
        console.log(`🏗️  DFCC Project ID (from documents): ${dfccProjectId}`);
      }
    });
    
    console.log(`\nROB Project ID: ${robProjectId || 'Not found'}`);
    console.log(`DFCC Project ID: ${dfccProjectId || 'Not found'}`);
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();