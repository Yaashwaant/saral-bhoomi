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

// Function to investigate count discrepancy
const investigateCountDiscrepancy = async () => {
  console.log('🔍 Investigating Count Discrepancy');
  console.log('==================================');
  console.log('Database shows: 108 documents');
  console.log('App shows: 105 documents');
  console.log('Difference: 3 documents\n');
  
  const collection = mongoose.connection.db.collection('landownerrecords_english_complete');
  
  // Get total count
  const totalCount = await collection.countDocuments();
  console.log(`📊 Current database total: ${totalCount} documents\n`);
  
  // Check for different document states
  console.log('🔍 Document State Analysis:');
  console.log('===========================');
  
  // Check for documents with different statuses
  const statusCounts = await collection.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log('📋 Documents by Status:');
  statusCounts.forEach(status => {
    console.log(`   ${status._id || 'undefined'}: ${status.count} documents`);
  });
  
  // Check for documents with different visibility states
  const visibilityCounts = await collection.aggregate([
    {
      $group: {
        _id: "$visible",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log('\n👁️  Documents by Visibility:');
  visibilityCounts.forEach(visibility => {
    console.log(`   visible=${visibility._id}: ${visibility.count} documents`);
  });
  
  // Check for documents with different active states
  const activeCounts = await collection.aggregate([
    {
      $group: {
        _id: "$active",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log('\n🔄 Documents by Active State:');
  activeCounts.forEach(active => {
    console.log(`   active=${active._id}: ${active.count} documents`);
  });
  
  // Check for documents with different deleted states
  const deletedCounts = await collection.aggregate([
    {
      $group: {
        _id: "$deleted",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log('\n🗑️  Documents by Deleted State:');
  deletedCounts.forEach(deleted => {
    console.log(`   deleted=${deleted._id}: ${deleted.count} documents`);
  });
  
  // Check for documents that might be filtered out in the app
  console.log('\n🔍 Potential App Filters:');
  console.log('=========================');
  
  // Documents that might be hidden from app
  const hiddenFromApp = await collection.find({
    $or: [
      { status: { $in: ['deleted', 'hidden', 'draft', 'inactive'] } },
      { visible: false },
      { active: false },
      { deleted: true }
    ]
  }).toArray();
  
  console.log(`🚫 Documents potentially hidden from app: ${hiddenFromApp.length}`);
  
  if (hiddenFromApp.length > 0) {
    console.log('\n📄 Hidden Documents Details:');
    hiddenFromApp.forEach(doc => {
      console.log(`   Serial ${doc.serial_number}:`);
      console.log(`     Status: ${doc.status || 'undefined'}`);
      console.log(`     Visible: ${doc.visible}`);
      console.log(`     Active: ${doc.active}`);
      console.log(`     Deleted: ${doc.deleted}`);
      console.log(`     Owner: ${doc.landowner_name || 'N/A'}`);
      console.log(`     Project: ${doc.project_id}`);
      console.log('');
    });
  }
  
  // Check for duplicate serial numbers
  console.log('🔍 Checking for Duplicates:');
  console.log('===========================');
  
  const duplicateSerials = await collection.aggregate([
    {
      $group: {
        _id: "$serial_number",
        count: { $sum: 1 },
        docs: { $push: "$$ROOT" }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]).toArray();
  
  console.log(`🔄 Duplicate serial numbers found: ${duplicateSerials.length}`);
  
  if (duplicateSerials.length > 0) {
    console.log('\n📄 Duplicate Documents:');
    duplicateSerials.forEach(duplicate => {
      console.log(`   Serial ${duplicate._id}: ${duplicate.count} copies`);
      duplicate.docs.forEach((doc, index) => {
        console.log(`     Copy ${index + 1}: ID ${doc._id}, Project: ${doc.project_id}`);
      });
      console.log('');
    });
  }
  
  // Check recent changes
  console.log('📅 Recent Document Changes:');
  console.log('===========================');
  
  const recentDocs = await collection.find({}).sort({ _id: -1 }).limit(10).toArray();
  
  console.log('Last 10 documents added:');
  recentDocs.forEach(doc => {
    console.log(`   Serial ${doc.serial_number}: Project ${doc.project_id}`);
    if (doc.migration_date) {
      console.log(`     ✅ Migrated from: ${doc.migration_from}`);
    }
  });
  
  // Check project distribution
  console.log('\n📊 Project Distribution:');
  console.log('========================');
  
  const projectCounts = await collection.aggregate([
    {
      $group: {
        _id: "$project_id",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
  
  projectCounts.forEach(project => {
    console.log(`   Project ${project._id}: ${project.count} documents`);
  });
  
  // Calculate what the app might be showing
  const visibleCount = await collection.countDocuments({
    $and: [
      { $or: [{ deleted: { $ne: true } }, { deleted: { $exists: false } }] },
      { $or: [{ visible: { $ne: false } }, { visible: { $exists: false } }] },
      { $or: [{ active: { $ne: false } }, { active: { $exists: false } }] },
      { $or: [{ status: { $nin: ['deleted', 'hidden', 'draft'] } }, { status: { $exists: false } }] }
    ]
  });
  
  console.log('\n🎯 Analysis Results:');
  console.log('====================');
  console.log(`📊 Total documents in DB: ${totalCount}`);
  console.log(`👁️  Potentially visible to app: ${visibleCount}`);
  console.log(`🚫 Potentially hidden from app: ${totalCount - visibleCount}`);
  console.log(`🔄 Duplicate documents: ${duplicateSerials.length > 0 ? duplicateSerials.reduce((sum, dup) => sum + dup.count - 1, 0) : 0}`);
  
  if (totalCount === 108 && visibleCount === 105) {
    console.log('✅ FOUND THE ISSUE: 3 documents are hidden from the app due to status/visibility filters');
  } else if (totalCount !== 108) {
    console.log(`⚠️  Database count changed: Expected 108, found ${totalCount}`);
  }
  
  return {
    totalCount,
    visibleCount,
    hiddenCount: totalCount - visibleCount,
    duplicates: duplicateSerials.length,
    hiddenDocuments: hiddenFromApp
  };
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    const result = await investigateCountDiscrepancy();
    
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log(`Database total: ${result.totalCount}`);
    console.log(`App visible: ${result.visibleCount}`);
    console.log(`Hidden from app: ${result.hiddenCount}`);
    console.log(`Duplicates: ${result.duplicates}`);
    
    if (result.hiddenCount === 3 && result.totalCount === 108) {
      console.log('\n✅ EXPLANATION: The 3-document difference is likely due to:');
      console.log('   - Documents with status filters (deleted, hidden, draft)');
      console.log('   - Documents with visibility flags (visible: false)');
      console.log('   - Documents with active flags (active: false)');
    }
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();