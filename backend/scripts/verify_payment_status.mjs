import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
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

const verifyPaymentStatus = async () => {
  try {
    await connectDB();
    
    console.log('\n📊 Verifying Payment Status in MongoDB Atlas...\n');
    
    // Get all Dongare records in ROB project
    const dongareRecords = await LandownerRecord.find({
      project_id: ROB_PROJECT_ID,
      village: 'Dongare'
    });
    
    console.log(`📋 Total Dongare records in ROB project: ${dongareRecords.length}`);
    
    // Count by payment status
    const statusCounts = await LandownerRecord.aggregate([
      {
        $match: {
          project_id: ROB_PROJECT_ID,
          village: 'Dongare'
        }
      },
      {
        $group: {
          _id: '$payment_status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n💰 Payment Status Distribution:');
    statusCounts.forEach(status => {
      console.log(`  ${status._id}: ${status.count} records`);
    });
    
    // Get records with final_amount > 0
    const recordsWithAmount = await LandownerRecord.find({
      project_id: ROB_PROJECT_ID,
      village: 'Dongare',
      final_amount: { $gt: 0 }
    });
    
    console.log(`\n💵 Records with final_amount > 0: ${recordsWithAmount.length}`);
    
    // Show breakdown of completed vs pending for records with amounts
    const completedWithAmount = recordsWithAmount.filter(r => r.payment_status === 'completed');
    const pendingWithAmount = recordsWithAmount.filter(r => r.payment_status === 'pending');
    
    console.log(`  - Completed: ${completedWithAmount.length}`);
    console.log(`  - Pending: ${pendingWithAmount.length}`);
    
    // Show some sample completed records
    if (completedWithAmount.length > 0) {
      console.log('\n✅ Sample Completed Records:');
      completedWithAmount.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.landowner_name} - ₹${record.final_amount} (Serial: ${record.serial_number})`);
      });
    }
    
    // Calculate completion percentage
    const totalRecords = dongareRecords.length;
    const completedRecords = statusCounts.find(s => s._id === 'completed')?.count || 0;
    const completionPercentage = totalRecords > 0 ? ((completedRecords / totalRecords) * 100).toFixed(1) : 0;
    
    console.log(`\n📈 Overall Completion Rate: ${completionPercentage}% (${completedRecords}/${totalRecords})`);
    
  } catch (error) {
    console.error('❌ Error verifying payment status:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the verification
verifyPaymentStatus();