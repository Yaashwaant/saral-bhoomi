const mongoose = require('mongoose');

/**
 * Clean database before importing new Excel data
 * This removes all existing landowner records to prevent conflicts
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function cleanDatabase() {
  let connection;
  
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Dynamic import of ES modules
    console.log('📦 Loading models...');
    const { default: LandownerRecord } = await import('../models/mongo/LandownerRecord.js');
    const { default: Project } = await import('../models/mongo/Project.js');
    
    // Get current counts
    const landownerCount = await LandownerRecord.countDocuments({});
    const projectCount = await Project.countDocuments({});
    
    console.log('📊 Current database state:');
    console.log(`   📋 Landowner records: ${landownerCount}`);
    console.log(`   📁 Projects: ${projectCount}`);
    
    if (landownerCount > 0) {
      console.log('🗑️ Clearing all landowner records...');
      const deleteResult = await LandownerRecord.deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} landowner records`);
    } else {
      console.log('ℹ️ No landowner records to delete');
    }
    
    // Optional: Also clean projects (uncomment if needed)
    /*
    if (projectCount > 0) {
      console.log('🗑️ Clearing all projects...');
      const deleteProjectResult = await Project.deleteMany({});
      console.log(`✅ Deleted ${deleteProjectResult.deletedCount} projects`);
    } else {
      console.log('ℹ️ No projects to delete');
    }
    */
    
    // Verify cleanup
    const finalLandownerCount = await LandownerRecord.countDocuments({});
    const finalProjectCount = await Project.countDocuments({});
    
    console.log('\n📊 Database state after cleanup:');
    console.log(`   📋 Landowner records: ${finalLandownerCount}`);
    console.log(`   📁 Projects: ${finalProjectCount}`);
    
    console.log('\n🎉 DATABASE CLEANUP COMPLETED!');
    console.log('✨ Database is now clean and ready for fresh Excel import');
    
  } catch (error) {
    console.error('💥 Database cleanup failed:', error);
    throw error;
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('📦 Disconnected from MongoDB');
    }
  }
}

// Run the cleanup
cleanDatabase()
  .then(() => {
    console.log('🏁 Database cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database cleanup failed:', error);
    process.exit(1);
  });
