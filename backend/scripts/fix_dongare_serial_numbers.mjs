import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

// Import models
import '../models/index.js';
const Project = mongoose.model('Project');
const LandownerRecord = mongoose.model('LandownerRecord');

async function fixDongareSerialNumbers() {
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

    // Find all Dongare records
    const dongareRecords = await LandownerRecord.find({ 
      village: 'Dongare'
    }).sort({ _id: 1 }); // Sort by creation order

    console.log(`\n=== Found ${dongareRecords.length} Dongare records ===`);

    // Update each record with unique serial numbers
    for (let i = 0; i < dongareRecords.length; i++) {
      const record = dongareRecords[i];
      const newSerialNumber = `dongare_${i + 1}`;
      
      try {
        await LandownerRecord.updateOne(
          { _id: record._id },
          { 
            $set: { 
              project_id: robProject._id,
              serial_number: newSerialNumber
            }
          }
        );
        
        console.log(`Updated record ${i + 1}: Serial number set to ${newSerialNumber}`);
      } catch (error) {
        console.error(`Error updating record ${i + 1}:`, error.message);
      }
    }

    // Verify the updates
    const updatedRecords = await LandownerRecord.find({ 
      village: 'Dongare',
      project_id: robProject._id 
    });

    console.log('\n=== Verification ===');
    console.log('Records now linked to ROB project:', updatedRecords.length);

    // Check for duplicates
    const serialNumbers = updatedRecords.map(r => r.serial_number);
    const uniqueSerialNumbers = [...new Set(serialNumbers)];
    console.log('Unique serial numbers:', uniqueSerialNumbers.length);
    console.log('Total records:', updatedRecords.length);

    if (uniqueSerialNumbers.length === updatedRecords.length) {
      console.log('✅ All serial numbers are unique!');
    } else {
      console.log('❌ Still have duplicate serial numbers');
    }

    // Show sample updated records
    console.log('\n=== Sample Updated Records ===');
    updatedRecords.slice(0, 5).forEach((record, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  Project ID: ${record.project_id}`);
      console.log(`  Serial Number: ${record.serial_number}`);
      console.log(`  Owner: ${record.owner_name}`);
      console.log(`  Village: ${record.village}`);
      console.log(`  Payment Status: ${record.payment_status}`);
      console.log(`  Final Amount: ₹${record.final_amount?.toLocaleString('en-IN') || 0}`);
      console.log('---');
    });

    // Check payment status distribution
    const paymentStatusCounts = {};
    updatedRecords.forEach(record => {
      const status = record.payment_status || 'undefined';
      paymentStatusCounts[status] = (paymentStatusCounts[status] || 0) + 1;
    });

    console.log('\n=== Payment Status Distribution ===');
    Object.entries(paymentStatusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} records`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixDongareSerialNumbers();