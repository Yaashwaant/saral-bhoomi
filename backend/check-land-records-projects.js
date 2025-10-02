import dotenv from 'dotenv';
import mongoose from 'mongoose';
import CompleteEnglishLandownerRecord from './models/mongo/CompleteEnglishLandownerRecord.js';

dotenv.config();

async function checkLandRecordsProjects() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Get all unique project IDs from the completeenglishlandownerrecords collection
        const projectCounts = await CompleteEnglishLandownerRecord.aggregate([
            {
                $group: {
                    _id: "$projectId",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        console.log('\nProject IDs with land records:');
        console.log('=====================================');
        
        for (const project of projectCounts) {
            console.log(`Project ID: ${project._id}`);
            console.log(`Record Count: ${project.count}`);
            console.log('---');
        }

        // Check if the test project ID exists
        const testProjectId = '68da6edf579af093415f639e';
        const testProjectCount = await CompleteEnglishLandownerRecord.countDocuments({ projectId: testProjectId });
        console.log(`\nTest Project ID (${testProjectId}) has ${testProjectCount} records`);

        // Check the current frontend project ID
        const frontendProjectId = '68dd247bc3ea8f3610d24f73';
        const frontendProjectCount = await CompleteEnglishLandownerRecord.countDocuments({ projectId: frontendProjectId });
        console.log(`Frontend Project ID (${frontendProjectId}) has ${frontendProjectCount} records`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkLandRecordsProjects();