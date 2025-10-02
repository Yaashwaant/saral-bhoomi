import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function updateToRailwayProject() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // The correct Railway Overbridge Project ID
    const railwayProjectId = new mongoose.Types.ObjectId('68da854996a3d559f5005b5c');
    
    // Update all land records to use the Railway Overbridge Project ID
    const result1 = await mongoose.connection.db.collection('landownerrecords_english_complete')
      .updateMany(
        {}, // Update all records
        { $set: { project_id: railwayProjectId } }
      );
    
    console.log(`Updated ${result1.modifiedCount} records in landownerrecords_english_complete`);
    
    // Also update landownerrecords2 collection
    const result2 = await mongoose.connection.db.collection('landownerrecords2')
      .updateMany(
        {}, // Update all records
        { $set: { project_id: railwayProjectId } }
      );
    
    console.log(`Updated ${result2.modifiedCount} records in landownerrecords2`);
    
    // Verify the update for both collections
    const count1 = await mongoose.connection.db.collection('landownerrecords_english_complete')
      .countDocuments({ project_id: railwayProjectId });
    
    const count2 = await mongoose.connection.db.collection('landownerrecords2')
      .countDocuments({ project_id: railwayProjectId });
    
    console.log(`Records in landownerrecords_english_complete with Railway Project ID: ${count1}`);
    console.log(`Records in landownerrecords2 with Railway Project ID: ${count2}`);
    
    // Show total records in both collections
    const totalRecords1 = await mongoose.connection.db.collection('landownerrecords_english_complete')
      .countDocuments({});
    
    const totalRecords2 = await mongoose.connection.db.collection('landownerrecords2')
      .countDocuments({});
    
    console.log(`Total records in landownerrecords_english_complete: ${totalRecords1}`);
    console.log(`Total records in landownerrecords2: ${totalRecords2}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

updateToRailwayProject();