const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

// ROB Project ID
const ROB_PROJECT_ID = '68da854996a3d559f5005b5c';

async function clearDongareData() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('\n=== Clearing Existing Dongare Data ===');
    
    // Delete existing Dongare records
    const result = await mongoose.connection.db
      .collection('landownerrecords')
      .deleteMany({ 
        projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
        village: 'Dongare'
      });
    
    console.log(`Deleted ${result.deletedCount} existing Dongare records`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearDongareData();