import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

// Import models
import '../models/index.js';
const Project = mongoose.model('Project');
const LandownerRecord = mongoose.model('LandownerRecord');

async function fixDongareProjectLinkage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find ROB project
    const robProject = await Project.findOne({ 
      projectName: 'Railway Overbridge Project (ROB)' 
    });
    
    if (!robProject) {
      console.log('ROB Project not found!');
      return;
    }

    console.log('\n=== ROB Project Found ===');
    console.log('Project ID:', robProject._id);
    console.log('Project Name:', robProject.projectName);
    console.log('Villages:', robProject.villages);

    // Find Dongare records with null project_id
    const dongareRecords = await LandownerRecord.find({ 
      village: 'Dongare',
      project_id: null 
    });

    console.log(`\n=== Found ${dongareRecords.length} Dongare records with null project_id ===`);

    if (dongareRecords.length > 0) {
      // Update all Dongare records to link to ROB project
      const updateResult = await LandownerRecord.updateMany(
        { village: 'Dongare', project_id: null },
        { $set: { project_id: robProject._id } }
      );

      console.log('\n=== Update Results ===');
      console.log('Matched records:', updateResult.matchedCount);
      console.log('Modified records:', updateResult.modifiedCount);

      // Verify the update
      const updatedRecords = await LandownerRecord.find({ 
        village: 'Dongare',
        project_id: robProject._id 
      });

      console.log('\n=== Verification ===');
      console.log('Records now linked to ROB project:', updatedRecords.length);

      // Show sample updated records
      console.log('\n=== Sample Updated Records ===');
      updatedRecords.slice(0, 3).forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  Project ID: ${record.project_id}`);
        console.log(`  Owner: ${record.owner_name}`);
        console.log(`  Village: ${record.village}`);
        console.log(`  Payment Status: ${record.payment_status}`);
        console.log(`  Final Amount: ₹${record.final_amount?.toLocaleString('en-IN') || 0}`);
        console.log('---');
      });

      // Check payment status distribution after update
      const paymentStatusCounts = {};
      updatedRecords.forEach(record => {
        const status = record.payment_status || 'undefined';
        paymentStatusCounts[status] = (paymentStatusCounts[status] || 0) + 1;
      });

      console.log('\n=== Payment Status Distribution (After Update) ===');
      Object.entries(paymentStatusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} records`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixDongareProjectLinkage();