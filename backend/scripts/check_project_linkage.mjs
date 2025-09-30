import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

// Import models
import '../models/index.js';
const Project = mongoose.model('Project');
const LandownerRecord = mongoose.model('LandownerRecord');

async function checkProjectLinkage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find ROB project
    const robProject = await Project.findOne({ 
      name: { $regex: /railway.*overbridge/i } 
    });
    
    console.log('\n=== ROB Project Details ===');
    if (robProject) {
      console.log('Project ID:', robProject._id);
      console.log('Project Name:', robProject.name);
      console.log('Villages:', robProject.villages);
    } else {
      console.log('ROB Project not found!');
    }

    // Check Dongare records
    console.log('\n=== Dongare Records Analysis ===');
    const dongareRecords = await LandownerRecord.find({ village: 'Dongare' });
    console.log('Total Dongare records:', dongareRecords.length);

    if (dongareRecords.length > 0) {
      // Check project_id values
      const projectIdCounts = {};
      dongareRecords.forEach(record => {
        const projectId = record.project_id ? record.project_id.toString() : 'null';
        projectIdCounts[projectId] = (projectIdCounts[projectId] || 0) + 1;
      });

      console.log('\nProject ID distribution:');
      Object.entries(projectIdCounts).forEach(([projectId, count]) => {
        console.log(`  ${projectId}: ${count} records`);
      });

      // Show sample records
      console.log('\n=== Sample Dongare Records ===');
      dongareRecords.slice(0, 3).forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  Project ID: ${record.project_id}`);
        console.log(`  Owner: ${record.owner_name}`);
        console.log(`  Village: ${record.village}`);
        console.log(`  Payment Status: ${record.payment_status}`);
        console.log(`  Final Amount: ₹${record.final_amount?.toLocaleString('en-IN') || 0}`);
        console.log('---');
      });

      // Check payment status distribution
      const paymentStatusCounts = {};
      dongareRecords.forEach(record => {
        const status = record.payment_status || 'undefined';
        paymentStatusCounts[status] = (paymentStatusCounts[status] || 0) + 1;
      });

      console.log('\n=== Payment Status Distribution ===');
      Object.entries(paymentStatusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} records`);
      });
    }

    // Check if we need to update project_id
    if (robProject && dongareRecords.length > 0) {
      const recordsWithNullProjectId = dongareRecords.filter(r => !r.project_id);
      if (recordsWithNullProjectId.length > 0) {
        console.log(`\n⚠️  Found ${recordsWithNullProjectId.length} Dongare records with null project_id`);
        console.log('These records need to be linked to ROB project:', robProject._id);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkProjectLinkage();