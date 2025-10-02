import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    console.log('🔗 Database:', mongoose.connection.db.databaseName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define the LandownerRecord schema
const landownerRecordSchema = new mongoose.Schema({
  project_id: { type: String, required: true },
  village: { type: String, required: true },
  taluka: { type: String, required: true },
  district: { type: String, required: true },
  serial_number: { type: String, required: true },
  survey_number: { type: String },
  landowner_name: { type: String, required: true },
  final_amount: { type: Number, default: 0 },
  payment_status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const LandownerRecord = mongoose.model('LandownerRecord', landownerRecordSchema);

// Constants
const ROB_PROJECT_ID = '67a0b8b8e4b0c1d2e3f4g5h6';

const debugDatabase = async () => {
  try {
    await connectDB();
    
    console.log('\n🔍 Debugging Database Contents...\n');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available Collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Get total count of all landowner records
    const totalRecords = await LandownerRecord.countDocuments();
    console.log(`\n📊 Total LandownerRecord documents: ${totalRecords}`);
    
    if (totalRecords > 0) {
      // Get all unique project IDs
      const projectIds = await LandownerRecord.distinct('project_id');
      console.log('\n🏗️ Unique Project IDs:');
      projectIds.forEach(id => {
        console.log(`  - ${id}`);
      });
      
      // Get all unique villages
      const villages = await LandownerRecord.distinct('village');
      console.log('\n🏘️ Unique Villages:');
      villages.forEach(village => {
        console.log(`  - ${village}`);
      });
      
      // Check for Dongare records in any project
      const dongareRecords = await LandownerRecord.find({ village: 'Dongare' });
      console.log(`\n🔍 Dongare records (any project): ${dongareRecords.length}`);
      
      if (dongareRecords.length > 0) {
        console.log('\n📋 Dongare Records by Project:');
        const dongareByProject = await LandownerRecord.aggregate([
          { $match: { village: 'Dongare' } },
          {
            $group: {
              _id: '$project_id',
              count: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ['$payment_status', 'completed'] }, 1, 0] }
              },
              pending: {
                $sum: { $cond: [{ $eq: ['$payment_status', 'pending'] }, 1, 0] }
              }
            }
          }
        ]);
        
        dongareByProject.forEach(project => {
          console.log(`  Project: ${project._id}`);
          console.log(`    Total: ${project.count}, Completed: ${project.completed}, Pending: ${project.pending}`);
        });
        
        // Show sample Dongare records
        console.log('\n📝 Sample Dongare Records:');
        dongareRecords.slice(0, 3).forEach((record, index) => {
          console.log(`  ${index + 1}. Project: ${record.project_id}`);
          console.log(`     Name: ${record.landowner_name}`);
          console.log(`     Status: ${record.payment_status}`);
          console.log(`     Amount: ₹${record.final_amount}`);
          console.log(`     Serial: ${record.serial_number}`);
          console.log('');
        });
      }
      
      // Check specifically for ROB project
      const robRecords = await LandownerRecord.find({ project_id: ROB_PROJECT_ID });
      console.log(`\n🎯 ROB Project (${ROB_PROJECT_ID}) records: ${robRecords.length}`);
      
      if (robRecords.length > 0) {
        const robVillages = await LandownerRecord.distinct('village', { project_id: ROB_PROJECT_ID });
        console.log('  Villages in ROB project:', robVillages);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the debug
debugDatabase();