import dotenv from 'dotenv';
import mongoose from 'mongoose';
import CompleteEnglishLandownerRecord from './models/mongo/CompleteEnglishLandownerRecord.js';

dotenv.config();

async function checkProjectIdValues() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Get distinct project_id values
        const distinctProjectIds = await CompleteEnglishLandownerRecord.distinct('project_id');
        console.log('Distinct project_id values:', distinctProjectIds);

        // Count records for each project_id
        for (const projectId of distinctProjectIds) {
            const count = await CompleteEnglishLandownerRecord.countDocuments({ project_id: projectId });
            console.log(`Project ID "${projectId}": ${count} records`);
        }

        // Check for records with undefined/null project_id
        const undefinedCount = await CompleteEnglishLandownerRecord.countDocuments({ 
            $or: [
                { project_id: { $exists: false } }, 
                { project_id: null }, 
                { project_id: undefined },
                { project_id: "" }
            ] 
        });
        console.log(`Records with undefined/null/empty project_id: ${undefinedCount}`);

        // Get a sample record to see its project_id value
        const sampleRecord = await CompleteEnglishLandownerRecord.findOne();
        console.log('\nSample record project_id:', sampleRecord?.project_id);
        console.log('Sample record project_id type:', typeof sampleRecord?.project_id);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkProjectIdValues();