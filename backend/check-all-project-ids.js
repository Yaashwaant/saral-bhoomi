import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function checkAllProjectIds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Use the raw collection to avoid schema validation issues
        const db = mongoose.connection.db;
        const collection = db.collection('landownerrecords_english_complete');

        // Get all distinct project_id values
        const distinctProjectIds = await collection.distinct('project_id');
        console.log('Distinct project_id values:', distinctProjectIds);

        // Count records for each project_id
        for (const projectId of distinctProjectIds) {
            const count = await collection.countDocuments({ project_id: projectId });
            console.log(`Project ID "${projectId}" (type: ${typeof projectId}): ${count} records`);
        }

        // Get a few sample records to see their project_id values
        const sampleRecords = await collection.find({}).limit(3).toArray();
        console.log('\nSample records project_id values:');
        sampleRecords.forEach((record, index) => {
            console.log(`Record ${index + 1}: project_id = "${record.project_id}" (type: ${typeof record.project_id})`);
        });

        // Total count
        const totalCount = await collection.countDocuments();
        console.log(`\nTotal records in collection: ${totalCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkAllProjectIds();