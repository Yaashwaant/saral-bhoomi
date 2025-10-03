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

// Function to identify project IDs and misplaced documents
const identifyProjectIssues = async () => {
  console.log('🔍 Identifying Project ID Issues');
  console.log('================================');
  
  const englishCollection = mongoose.connection.db.collection('landownerrecords_english_complete');
  
  // Get all unique project IDs and their counts
  console.log('\n📊 Current Project Distribution:');
  console.log('================================\n');
  
  const projectStats = await englishCollection.aggregate([
    {
      $group: {
        _id: "$project_id",
        count: { $sum: 1 },
        sampleDocs: { $push: { _id: "$_id", serial_number: "$serial_number" } }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]).toArray();
  
  projectStats.forEach(project => {
    console.log(`🔸 Project ID: "${project._id}"`);
    console.log(`   Document count: ${project.count}`);
    console.log(`   Sample serial numbers: [${project.sampleDocs.slice(0, 3).map(doc => doc.serial_number).join(', ')}]`);
    console.log('');
  });
  
  // Look for projects that might be ROB or DFCC
  console.log('🎯 Project Analysis:');
  console.log('===================\n');
  
  let robProjectId = null;
  let dfccProjectId = null;
  
  projectStats.forEach(project => {
    const projectIdStr = project._id ? String(project._id) : '';
    const projectIdLower = projectIdStr.toLowerCase();
    
    if (projectIdLower.includes('rob') || projectIdLower.includes('railway') || projectIdLower.includes('overbridge')) {
      console.log(`🚂 ROB Project Found: "${project._id}" (${project.count} documents)`);
      robProjectId = project._id;
    } else if (projectIdLower.includes('dfcc') || projectIdLower.includes('palghar')) {
      console.log(`🏗️  DFCC Project Found: "${project._id}" (${project.count} documents)`);
      dfccProjectId = project._id;
    } else {
      console.log(`❓ Other Project: "${project._id}" (${project.count} documents)`);
    }
  });
  
  console.log('');
  
  // Check if we have both projects
  if (!robProjectId) {
    console.log('⚠️  ROB project not found. Let me check for documents that should be ROB...');
    
    // Look for documents with ROB-related content
    const robDocs = await englishCollection.find({
      $or: [
        { "project_name": { $regex: /rob|railway|overbridge/i } },
        { "notice_number": { $regex: /rob|railway|overbridge/i } },
        { "project_description": { $regex: /rob|railway|overbridge/i } }
      ]
    }).limit(5).toArray();
    
    if (robDocs.length > 0) {
      console.log(`   Found ${robDocs.length} documents with ROB-related content:`);
      robDocs.forEach(doc => {
        console.log(`   - Serial ${doc.serial_number}: Project ID "${doc.project_id}"`);
      });
    }
  }
  
  if (!dfccProjectId) {
    console.log('⚠️  DFCC project not found. Let me check for documents that should be DFCC...');
    
    // Look for documents with DFCC-related content
    const dfccDocs = await englishCollection.find({
      $or: [
        { "project_name": { $regex: /dfcc|palghar/i } },
        { "notice_number": { $regex: /dfcc|palghar/i } },
        { "project_description": { $regex: /dfcc|palghar/i } }
      ]
    }).limit(5).toArray();
    
    if (dfccDocs.length > 0) {
      console.log(`   Found ${dfccDocs.length} documents with DFCC-related content:`);
      dfccDocs.forEach(doc => {
        console.log(`   - Serial ${doc.serial_number}: Project ID "${doc.project_id}"`);
      });
    }
  }
  
  // Analyze recent documents (likely the newly added ones)
  console.log('\n📅 Recent Documents Analysis:');
  console.log('============================\n');
  
  const recentDocs = await englishCollection.find({})
    .sort({ _id: -1 })
    .limit(10)
    .toArray();
  
  console.log('Last 10 documents added:');
  recentDocs.forEach(doc => {
    console.log(`   Serial ${doc.serial_number}: Project ID "${doc.project_id}"`);
    
    // Check if this looks like it should be ROB
    const content = JSON.stringify(doc).toLowerCase();
    if (content.includes('rob') || content.includes('railway') || content.includes('overbridge')) {
      console.log(`     ⚠️  This document contains ROB-related content!`);
    }
  });
  
  // Check for documents with notice numbers containing ROB
  console.log('\n🔍 Documents with ROB in Notice Number:');
  console.log('======================================\n');
  
  const robNoticeDocs = await englishCollection.find({
    "notice_number": { $regex: /rob/i }
  }).toArray();
  
  if (robNoticeDocs.length > 0) {
    console.log(`Found ${robNoticeDocs.length} documents with ROB in notice number:`);
    
    const projectGroups = {};
    robNoticeDocs.forEach(doc => {
      if (!projectGroups[doc.project_id]) {
        projectGroups[doc.project_id] = [];
      }
      projectGroups[doc.project_id].push(doc.serial_number);
    });
    
    Object.keys(projectGroups).forEach(projectId => {
      console.log(`   Project "${projectId}": ${projectGroups[projectId].length} documents`);
      console.log(`     Serial numbers: [${projectGroups[projectId].slice(0, 5).join(', ')}${projectGroups[projectId].length > 5 ? '...' : ''}]`);
    });
  } else {
    console.log('No documents found with ROB in notice number.');
  }
  
  return {
    projectStats,
    robProjectId,
    dfccProjectId,
    recentDocs,
    robNoticeDocs
  };
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting Project ID Analysis\n');
    
    const result = await identifyProjectIssues();
    
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log(`Total projects found: ${result.projectStats.length}`);
    console.log(`ROB project ID: ${result.robProjectId || 'Not found'}`);
    console.log(`DFCC project ID: ${result.dfccProjectId || 'Not found'}`);
    console.log(`Documents with ROB notices: ${result.robNoticeDocs.length}`);
    
    if (result.robNoticeDocs.length > 0) {
      console.log('\n🎯 Next Steps:');
      console.log('==============');
      console.log('1. Identify the correct ROB project ID');
      console.log('2. Update documents with ROB notices to use the correct project ID');
      console.log('3. Verify the migration results');
    }
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();