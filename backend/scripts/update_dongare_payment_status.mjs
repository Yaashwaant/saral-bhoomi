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

async function updateDongarePaymentStatus() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('\n=== Updating Dongare Payment Status ===');
    console.log('Project ID:', ROB_PROJECT_ID);
    
    // First, check current status distribution
    const totalDongareRecords = await LandownerRecord.countDocuments({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      village: 'Dongare'
    });
    
    const pendingRecords = await LandownerRecord.countDocuments({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      village: 'Dongare',
      payment_status: 'pending'
    });
    
    const completedRecords = await LandownerRecord.countDocuments({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      village: 'Dongare',
      payment_status: 'completed'
    });
    
    console.log(`\nCurrent Status Distribution:`);
    console.log(`Total Dongare records: ${totalDongareRecords}`);
    console.log(`Pending payments: ${pendingRecords}`);
    console.log(`Completed payments: ${completedRecords}`);
    
    // Update some records with final_amount > 0 to have completed status
    const recordsToUpdate = await LandownerRecord.find({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      village: 'Dongare',
      final_amount: { $gt: 0 },
      payment_status: 'pending'
    }).limit(3); // Update 3 records to completed status
    
    console.log(`\nFound ${recordsToUpdate.length} records with final_amount > 0 to update`);
    
    let updatedCount = 0;
    for (const record of recordsToUpdate) {
      await LandownerRecord.updateOne(
        { _id: record._id },
        { 
          payment_status: 'completed',
          updatedAt: new Date()
        }
      );
      updatedCount++;
      console.log(`Updated record ${record.serial_number} (${record.owner_name}) to completed status`);
    }
    
    // Check final status distribution
    const finalPendingRecords = await LandownerRecord.countDocuments({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      village: 'Dongare',
      payment_status: 'pending'
    });
    
    const finalCompletedRecords = await LandownerRecord.countDocuments({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      village: 'Dongare',
      payment_status: 'completed'
    });
    
    console.log(`\nFinal Status Distribution:`);
    console.log(`Pending payments: ${finalPendingRecords}`);
    console.log(`Completed payments: ${finalCompletedRecords}`);
    console.log(`Records updated: ${updatedCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

updateDongarePaymentStatus();