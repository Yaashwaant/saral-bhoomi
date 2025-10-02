import dotenv from 'dotenv';
import mongoose from 'mongoose';
import CompleteEnglishLandownerRecord from './models/mongo/CompleteEnglishLandownerRecord.js';

dotenv.config();

async function debugRecordStructure() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // Get one record to see its structure
        const sampleRecord = await CompleteEnglishLandownerRecord.findOne({ projectId: null });
        
        if (sampleRecord) {
            console.log('\nSample record structure:');
            console.log('=====================================');
            console.log('ID field:', sampleRecord._id);
            console.log('ID type:', typeof sampleRecord._id);
            console.log('ID toString:', sampleRecord._id.toString());
            console.log('\nFull record keys:');
            console.log(Object.keys(sampleRecord.toObject()));
            console.log('\nFirst few fields:');
            const recordObj = sampleRecord.toObject();
            Object.keys(recordObj).slice(0, 10).forEach(key => {
                console.log(`${key}:`, recordObj[key], `(${typeof recordObj[key]})`);
            });
        } else {
            console.log('No records found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

debugRecordStructure();