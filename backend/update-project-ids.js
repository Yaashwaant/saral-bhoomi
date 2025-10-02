import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
const TARGET_PROJECT_ID = '68da854996a3d559f5005b5c';

async function updateProjectIds() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the database
    const db = mongoose.connection.db;
    const collection = db.collection('landownerrecords_english_complete');

    // First, check how many records exist
    const totalRecords = await collection.countDocuments();
    console.log(`📊 Total records in landownerrecords_english_complete: ${totalRecords}`);

    if (totalRecords === 0) {
      console.log('❌ No records found in the collection');
      return;
    }

    // Show current project_id distribution
    console.log('\n📋 Current project_id distribution:');
    const currentDistribution = await collection.aggregate([
      {
        $group: {
          _id: '$project_id',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    currentDistribution.forEach(item => {
      console.log(`  - project_id: ${item._id} (${item.count} records)`);
    });

    // Convert target project ID to ObjectId
    const targetObjectId = new mongoose.Types.ObjectId(TARGET_PROJECT_ID);
    
    console.log(`\n🔄 Updating all project_id values to: ${TARGET_PROJECT_ID}`);
    console.log(`   (as ObjectId: ${targetObjectId})`);

    // Update all records
    const updateResult = await collection.updateMany(
      {}, // Empty filter to match all documents
      {
        $set: {
          project_id: targetObjectId,
          updatedAt: new Date()
        }
      }
    );

    console.log(`\n✅ Update completed!`);
    console.log(`   - Matched: ${updateResult.matchedCount} records`);
    console.log(`   - Modified: ${updateResult.modifiedCount} records`);

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const verificationCount = await collection.countDocuments({
      project_id: targetObjectId
    });

    console.log(`✅ Verification: ${verificationCount} records now have project_id: ${TARGET_PROJECT_ID}`);

    if (verificationCount === totalRecords) {
      console.log('🎉 All records successfully updated!');
    } else {
      console.log('⚠️  Warning: Not all records were updated');
    }

  } catch (error) {
    console.error('❌ Error updating project IDs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the update
updateProjectIds();