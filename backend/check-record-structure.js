import dotenv from 'dotenv';
import mongoose from 'mongoose';
import CompleteEnglishLandownerRecord from './models/mongo/CompleteEnglishLandownerRecord.js';

dotenv.config();

async function checkRecordStructure() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Get one record to examine its structure
        const record = await CompleteEnglishLandownerRecord.findOne();
        
        if (record) {
            console.log('Sample record structure:');
            console.log(JSON.stringify(record, null, 2));
            
            // Check if there's a projectId field
            console.log('\nProjectId field value:', record.projectId);
            console.log('ProjectId field type:', typeof record.projectId);
            
            // Check all field names
            console.log('\nAll field names:');
            console.log(Object.keys(record.toObject()));
        } else {
            console.log('No records found');
        }

        // Count total records
        const totalCount = await CompleteEnglishLandownerRecord.countDocuments();
        console.log(`\nTotal records in collection: ${totalCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkRecordStructure();