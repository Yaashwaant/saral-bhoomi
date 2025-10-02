import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

// ROB Project ID
const ROB_PROJECT_ID = '68da854996a3d559f5005b5c';

// Define the schema for landowner records
const landownerRecordSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  village: String,
  taluka: String,
  district: String,
  survey_number: String,
  sub_division: String,
  owner_name: String,
  area_acquired: Number,
  final_amount: Number,
  final_payable_amount: Number,
  total_final_compensation: Number,
  serial_number: String,
  payment_status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  data_format: { type: String, default: 'Parishisht-K' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'landownerrecords' });

const LandownerRecord = mongoose.model('LandownerRecord', landownerRecordSchema);

// Function to shuffle array randomly
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function update80PercentPayments() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('\n=== Updating 80% of Records to Completed Payment Status ===');
    console.log('Project ID:', ROB_PROJECT_ID);
    
    // Get all records for the ROB project
    const allRecords = await LandownerRecord.find({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID)
    });
    
    console.log(`Total records found: ${allRecords.length}`);
    
    if (allRecords.length === 0) {
      console.log('No records found for the ROB project');
      return;
    }
    
    // Check current status distribution
    const currentPending = await LandownerRecord.countDocuments({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      payment_status: 'pending'
    });
    
    const currentCompleted = await LandownerRecord.countDocuments({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      payment_status: 'completed'
    });
    
    console.log(`\nCurrent Status Distribution:`);
    console.log(`Pending: ${currentPending}`);
    console.log(`Completed: ${currentCompleted}`);
    
    // Calculate 80% of total records
    const targetCompleted = Math.floor(allRecords.length * 0.8);
    console.log(`\nTarget: ${targetCompleted} records (80% of ${allRecords.length}) should be completed`);
    
    // If we already have enough completed records, adjust accordingly
    if (currentCompleted >= targetCompleted) {
      console.log(`Already have ${currentCompleted} completed records, which is >= target of ${targetCompleted}`);
      return;
    }
    
    // Randomly shuffle all records
    const shuffledRecords = shuffleArray(allRecords);
    
    // Select records to update to completed status
    const recordsToComplete = shuffledRecords.slice(0, targetCompleted);
    
    console.log(`\nUpdating ${recordsToComplete.length} records to completed status...`);
    
    let updatedCount = 0;
    const batchSize = 50; // Update in batches for better performance
    
    for (let i = 0; i < recordsToComplete.length; i += batchSize) {
      const batch = recordsToComplete.slice(i, i + batchSize);
      const batchIds = batch.map(record => record._id);
      
      const result = await LandownerRecord.updateMany(
        { _id: { $in: batchIds } },
        { 
          payment_status: 'completed',
          updatedAt: new Date()
        }
      );
      
      updatedCount += result.modifiedCount;
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: Updated ${result.modifiedCount} records`);
    }
    
    // Verify final status distribution
    const finalPending = await LandownerRecord.countDocuments({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      payment_status: 'pending'
    });
    
    const finalCompleted = await LandownerRecord.countDocuments({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      payment_status: 'completed'
    });
    
    console.log(`\n=== Final Status Distribution ===`);
    console.log(`Pending: ${finalPending}`);
    console.log(`Completed: ${finalCompleted}`);
    console.log(`Total records updated: ${updatedCount}`);
    console.log(`Completion percentage: ${((finalCompleted / allRecords.length) * 100).toFixed(1)}%`);
    
    // Show breakdown by village
    console.log(`\n=== Village-wise Completion Status ===`);
    const villages = await LandownerRecord.distinct('village', {
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID)
    });
    
    for (const village of villages) {
      const villageTotal = await LandownerRecord.countDocuments({
        projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
        village: village
      });
      
      const villageCompleted = await LandownerRecord.countDocuments({
        projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
        village: village,
        payment_status: 'completed'
      });
      
      const villagePercentage = villageTotal > 0 ? ((villageCompleted / villageTotal) * 100).toFixed(1) : 0;
      console.log(`${village}: ${villageCompleted}/${villageTotal} (${villagePercentage}%)`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

update80PercentPayments();