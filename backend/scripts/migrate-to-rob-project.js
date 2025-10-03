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

// Function to migrate documents to ROB project
const migrateToRobProject = async () => {
  console.log('🚀 Starting Migration to ROB Project');
  console.log('===================================');
  
  const collection = mongoose.connection.db.collection('landownerrecords_english_complete');
  
  // Correct ROB project ID (identified from analysis)
  const correctRobProjectId = '68da854996a3d559f5005b5c';
  
  // Incorrect project IDs that should be moved to ROB
  const incorrectProjectIds = [
    '68da6edf579af093415f639e',
    '68de9541fd4a30d926a94919',
    '68de957dfd4a30d926a9491d',
    '68de956bfd4a30d926a9491c',
    '68de955afd4a30d926a9491b',
    '68de954efd4a30d926a9491a'
  ];
  
  console.log(`🎯 Target ROB Project ID: ${correctRobProjectId}`);
  console.log(`📋 Incorrect Project IDs to migrate: ${incorrectProjectIds.length}`);
  
  // First, let's check what documents we're about to migrate
  console.log('\n🔍 Documents to be migrated:');
  console.log('============================');
  
  for (const projectId of incorrectProjectIds) {
    const docs = await collection.find({ project_id: projectId }).toArray();
    
    if (docs.length > 0) {
      console.log(`\n📁 Project ID: ${projectId} (${docs.length} documents)`);
      
      docs.forEach(doc => {
        console.log(`   📄 Serial: ${doc.serial_number || 'N/A'}`);
        console.log(`      Notice: ${doc.notice_number || 'N/A'}`);
        console.log(`      Owner: ${doc.landowner_name || 'N/A'}`);
        console.log(`      Village: ${doc.village_name || 'N/A'}`);
      });
    }
  }
  
  // Ask for confirmation (in production, you might want to add a command line argument)
  console.log('\n⚠️  MIGRATION PREVIEW COMPLETE');
  console.log('==============================');
  
  let totalDocumentsToMigrate = 0;
  for (const projectId of incorrectProjectIds) {
    const count = await collection.countDocuments({ project_id: projectId });
    totalDocumentsToMigrate += count;
  }
  
  console.log(`📊 Total documents to migrate: ${totalDocumentsToMigrate}`);
  console.log(`🎯 Target project ID: ${correctRobProjectId}`);
  
  // Perform the migration
  console.log('\n🚀 Starting Migration...');
  console.log('========================');
  
  let totalMigrated = 0;
  const migrationResults = [];
  
  for (const projectId of incorrectProjectIds) {
    console.log(`\n📝 Migrating documents from project: ${projectId}`);
    
    const result = await collection.updateMany(
      { project_id: projectId },
      { 
        $set: { 
          project_id: correctRobProjectId,
          migration_date: new Date(),
          migration_from: projectId,
          migration_to: correctRobProjectId
        }
      }
    );
    
    console.log(`   ✅ Updated ${result.modifiedCount} documents`);
    totalMigrated += result.modifiedCount;
    
    migrationResults.push({
      fromProjectId: projectId,
      toProjectId: correctRobProjectId,
      documentsUpdated: result.modifiedCount
    });
  }
  
  console.log('\n🎉 Migration Complete!');
  console.log('======================');
  console.log(`📊 Total documents migrated: ${totalMigrated}`);
  
  // Verify the migration
  console.log('\n🔍 Verification:');
  console.log('================');
  
  const robProjectCount = await collection.countDocuments({ project_id: correctRobProjectId });
  console.log(`📈 Total documents in ROB project now: ${robProjectCount}`);
  
  // Check if any documents are still in the old project IDs
  for (const projectId of incorrectProjectIds) {
    const remainingCount = await collection.countDocuments({ project_id: projectId });
    if (remainingCount > 0) {
      console.log(`⚠️  Warning: ${remainingCount} documents still in project ${projectId}`);
    } else {
      console.log(`✅ No documents remaining in project ${projectId}`);
    }
  }
  
  // Show sample of migrated documents
  console.log('\n📋 Sample of migrated documents:');
  console.log('================================');
  
  const sampleDocs = await collection.find({ 
    project_id: correctRobProjectId,
    migration_date: { $exists: true }
  }).limit(5).toArray();
  
  sampleDocs.forEach(doc => {
    console.log(`📄 Serial: ${doc.serial_number}`);
    console.log(`   Owner: ${doc.landowner_name}`);
    console.log(`   Migrated from: ${doc.migration_from}`);
    console.log(`   Migration date: ${doc.migration_date}`);
    console.log('');
  });
  
  return {
    totalMigrated,
    migrationResults,
    finalRobProjectCount: robProjectCount
  };
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    const result = await migrateToRobProject();
    
    console.log('\n📋 Final Summary:');
    console.log('=================');
    console.log(`✅ Successfully migrated ${result.totalMigrated} documents to ROB project`);
    console.log(`📊 ROB project now contains ${result.finalRobProjectCount} total documents`);
    
    console.log('\n🎯 Migration Details:');
    result.migrationResults.forEach(migration => {
      console.log(`   ${migration.fromProjectId} → ${migration.toProjectId}: ${migration.documentsUpdated} docs`);
    });
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();