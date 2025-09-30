import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function checkAllCollections() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully!');

        // Get all collections
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log('\n=== All Collections in Database ===');
        console.log(`Total collections: ${collections.length}`);
        
        for (const collection of collections) {
            const collectionName = collection.name;
            const count = await db.collection(collectionName).countDocuments();
            console.log(`${collectionName}: ${count} documents`);
            
            // If collection has documents and name contains 'payment' or similar, show sample
            if (count > 0 && (collectionName.toLowerCase().includes('payment') || 
                              collectionName.toLowerCase().includes('landowner') ||
                              collectionName.toLowerCase().includes('record'))) {
                console.log(`  Sample document from ${collectionName}:`);
                const sample = await db.collection(collectionName).findOne();
                console.log('  ', JSON.stringify(sample, null, 2).substring(0, 300) + '...');
            }
        }

        // Check for any collections that might contain payment status
        console.log('\n=== Searching for Payment-related Data ===');
        for (const collection of collections) {
            if (collection.name.toLowerCase().includes('landowner') || 
                collection.name.toLowerCase().includes('record') ||
                collection.name.toLowerCase().includes('project')) {
                
                const collectionName = collection.name;
                const sampleWithPayment = await db.collection(collectionName).findOne({
                    $or: [
                        { payment_status: { $exists: true } },
                        { paymentStatus: { $exists: true } },
                        { status: 'completed' },
                        { status: 'paid' }
                    ]
                });
                
                if (sampleWithPayment) {
                    console.log(`Found payment-related data in ${collectionName}:`);
                    console.log('  ', JSON.stringify(sampleWithPayment, null, 2).substring(0, 400) + '...');
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB.');
    }
}

checkAllCollections();