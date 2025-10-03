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

// Function to verify migration results
const verifyMigration = async () => {
  console.log('🔍 Verifying Migration Results');
  console.log('==============================');
  
  const collection = mongoose.connection.db.collection('landownerrecords_english_complete');
  
  // ROB project ID
  const robProjectId = '68da854996a3d559f5005b5c';
  
  // Get current project distribution
  console.log('\n📊 Current Project Distribution:');
  console.log('================================');
  
  const projectStats = await collection.aggregate([
    {
      $group: {
        _id: "$project_id",
        count: { $sum: 1 },
        sampleSerials: { $push: "$serial_number" }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
  
  let totalDocuments = 0;
  let robDocuments = 0;
  
  projectStats.forEach(project => {
    totalDocuments += project.count;
    
    if (project._id === robProjectId) {
      robDocuments = project.count;
      console.log(`🚂 ROB Project: "${project._id}" (${project.count} documents) ⭐`);
    } else {
      console.log(`📁 Project: "${project._id}" (${project.count} documents)`);
    }
    
    // Show sample serial numbers
    const sampleSerials = project.sampleSerials.slice(0, 5);
    console.log(`   Sample serials: [${sampleSerials.join(', ')}]`);
  });
  
  console.log(`\n📈 Total documents: ${totalDocuments}`);
  console.log(`🚂 ROB project documents: ${robDocuments}`);
  
  // Check for migrated documents
  console.log('\n🔄 Migration Tracking:');
  console.log('======================');
  
  const migratedDocs = await collection.find({ 
    migration_date: { $exists: true },
    project_id: robProjectId
  }).toArray();
  
  console.log(`📋 Documents with migration tracking: ${migratedDocs.length}`);
  
  if (migratedDocs.length > 0) {
    console.log('\n📄 Migrated Documents Details:');
    migratedDocs.forEach(doc => {
      console.log(`   Serial ${doc.serial_number}:`);
      console.log(`     From: ${doc.migration_from}`);
      console.log(`     To: ${doc.migration_to}`);
      console.log(`     Date: ${doc.migration_date}`);
      console.log(`     Owner: ${doc.landowner_name || 'N/A'}`);
      console.log(`     Village: ${doc.village_name || 'N/A'}`);
      console.log(`     Notice: ${doc.notice_number || 'N/A'}`);
      console.log('');
    });
  }
  
  // Check ROB project documents
  console.log('\n🚂 ROB Project Documents:');
  console.log('=========================');
  
  const robDocs = await collection.find({ project_id: robProjectId }).toArray();
  
  console.log(`📊 Total ROB documents: ${robDocs.length}`);
  
  robDocs.forEach(doc => {
    console.log(`📄 Serial ${doc.serial_number}:`);
    console.log(`   Owner: ${doc.landowner_name || 'N/A'}`);
    console.log(`   Village: ${doc.village_name || 'N/A'}`);
    console.log(`   Notice: ${doc.notice_number || 'N/A'}`);
    console.log(`   Survey No: ${doc.survey_number || 'N/A'}`);
    console.log(`   Land Area: ${doc.land_area_as_per_7_12 || 'N/A'}`);
    
    if (doc.migration_date) {
      console.log(`   ✅ Migrated from: ${doc.migration_from}`);
      console.log(`   📅 Migration date: ${doc.migration_date}`);
    } else {
      console.log(`   📌 Original ROB document`);
    }
    console.log('');
  });
  
  // Verify no documents are in wrong projects
  console.log('\n🔍 Checking for Remaining Issues:');
  console.log('=================================');
  
  const incorrectProjectIds = [
    '68da6edf579af093415f639e',
    '68de9541fd4a30d926a94919',
    '68de957dfd4a30d926a9491d',
    '68de956bfd4a30d926a9491c',
    '68de955afd4a30d926a9491b',
    '68de954efd4a30d926a9491a'
  ];
  
  let issuesFound = false;
  
  for (const projectId of incorrectProjectIds) {
    const count = await collection.countDocuments({ project_id: projectId });
    if (count > 0) {
      console.log(`⚠️  Issue: ${count} documents still in project ${projectId}`);
      issuesFound = true;
    }
  }
  
  if (!issuesFound) {
    console.log('✅ No issues found - all documents properly migrated!');
  }
  
  return {
    totalDocuments,
    robDocuments,
    migratedDocuments: migratedDocs.length,
    projectDistribution: projectStats,
    issuesFound
  };
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    const result = await verifyMigration();
    
    console.log('\n🎯 Migration Verification Summary:');
    console.log('==================================');
    console.log(`📊 Total documents in database: ${result.totalDocuments}`);
    console.log(`🚂 Documents in ROB project: ${result.robDocuments}`);
    console.log(`🔄 Documents with migration tracking: ${result.migratedDocuments}`);
    console.log(`📁 Total projects: ${result.projectDistribution.length}`);
    
    if (result.issuesFound) {
      console.log('⚠️  Status: Issues found - migration incomplete');
    } else {
      console.log('✅ Status: Migration successful - all documents properly assigned');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();