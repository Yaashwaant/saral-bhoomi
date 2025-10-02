import dotenv from 'dotenv';
import mongoose from 'mongoose';
import CompleteEnglishLandownerRecord from './models/mongo/CompleteEnglishLandownerRecord.js';

dotenv.config();

async function fixProjectIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Update all records with null projectId to use the frontend project ID
        const frontendProjectId = '68dd247bc3ea8f3610d24f73';
        
        const result = await CompleteEnglishLandownerRecord.updateMany(
            { projectId: null },
            { $set: { projectId: frontendProjectId } }
        );

        console.log(`Updated ${result.modifiedCount} records with project ID: ${frontendProjectId}`);

        // Verify the update
        const count = await CompleteEnglishLandownerRecord.countDocuments({ projectId: frontendProjectId });
        console.log(`Total records now with project ID ${frontendProjectId}: ${count}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixProjectIds();