import dotenv from 'dotenv';
import mongoose from 'mongoose';
import CompleteEnglishLandownerRecord from './models/mongo/CompleteEnglishLandownerRecord.js';

dotenv.config();

async function fixProjectIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Convert the frontend project ID string to ObjectId
        const frontendProjectId = new mongoose.Types.ObjectId('68dd247bc3ea8f3610d24f73');
        
        // Update all records with null/undefined project_id to use the frontend project ID
        const result = await CompleteEnglishLandownerRecord.updateMany(
            { $or: [{ project_id: { $exists: false } }, { project_id: null }] },
            { $set: { project_id: frontendProjectId } }
        );

        console.log(`Updated ${result.modifiedCount} records with project ID: ${frontendProjectId}`);

        // Verify the update
        const count = await CompleteEnglishLandownerRecord.countDocuments({ project_id: frontendProjectId });
        console.log(`Total records now with project ID ${frontendProjectId}: ${count}`);

        // Check total records
        const totalCount = await CompleteEnglishLandownerRecord.countDocuments();
        console.log(`Total records in collection: ${totalCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixProjectIds();