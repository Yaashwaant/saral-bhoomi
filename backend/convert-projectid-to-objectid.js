import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function convertProjectIdToObjectId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Get the native MongoDB client from Mongoose
    const db = mongoose.connection.db;
    const collection = db.collection('landownerrecords2');

    console.log('=== Converting project_id from String to ObjectId ===');

    // Step 1: Count total records
    const totalRecords = await collection.countDocuments();
    console.log(`Total records in collection: ${totalRecords}`);

    // Step 2: Find records where project_id is a string
    const stringRecords = await collection.find({ 
      project_id: { $type: 'string' } 
    }).toArray();
    console.log(`Records with string project_id: ${stringRecords.length}`);

    if (stringRecords.length === 0) {
      console.log('No string project_id records found to convert.');
      return;
    }

    // Step 3: Convert each record
    let convertedCount = 0;
    let errorCount = 0;

    for (const record of stringRecords) {
      try {
        // Convert string to ObjectId
        const objectId = new ObjectId(record.project_id);
        
        // Update the record
        const result = await collection.updateOne(
          { _id: record._id },
          { $set: { project_id: objectId } }
        );
        
        if (result.modifiedCount === 1) {
          convertedCount++;
          console.log(`✓ Converted record ${record._id}: project_id "${record.project_id}" -> ObjectId("${record.project_id}")`);
        } else {
          errorCount++;
          console.log(`✗ Failed to convert record ${record._id}`);
        }
      } catch (error) {
        errorCount++;
        console.log(`✗ Error converting record ${record._id}: ${error.message}`);
      }
    }

    console.log('\n=== Conversion Summary ===');
    console.log(`Total records processed: ${stringRecords.length}`);
    console.log(`Successfully converted: ${convertedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Step 4: Verify the conversion
    console.log('\n=== Verification ===');
    const remainingStrings = await collection.countDocuments({ 
      project_id: { $type: 'string' } 
    });
    const objectIds = await collection.countDocuments({ 
      project_id: { $type: 'objectId' } 
    });
    
    console.log(`Records still with string project_id: ${remainingStrings}`);
    console.log(`Records with ObjectId project_id: ${objectIds}`);

    if (remainingStrings === 0) {
      console.log('✅ All project_id fields successfully converted to ObjectId!');
    } else {
      console.log(`⚠️  ${remainingStrings} records still have string project_id`);
    }

  } catch (error) {
    console.error('Error during conversion:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the conversion
convertProjectIdToObjectId();