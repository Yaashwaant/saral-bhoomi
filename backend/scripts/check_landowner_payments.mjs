import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function checkLandownerPayments() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully!');

        const db = mongoose.connection.db;
        const collection = db.collection('landownerrecords');

        console.log('\n=== Landowner Records Payment Analysis ===');
        
        // Total count
        const totalCount = await collection.countDocuments();
        console.log(`Total landowner records: ${totalCount}`);

        // Payment status distribution
        console.log('\n=== Payment Status Distribution ===');
        const paymentStatusAgg = await collection.aggregate([
            {
                $group: {
                    _id: '$payment_status',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray();

        paymentStatusAgg.forEach(status => {
            console.log(`${status._id || 'null/undefined'}: ${status.count}`);
        });

        // Check for completed payments
        const completedPayments = await collection.countDocuments({ payment_status: 'completed' });
        console.log(`\nCompleted payments: ${completedPayments}`);

        // Check for different variations of completed status
        const variations = ['completed', 'Completed', 'COMPLETED', 'paid', 'Paid', 'PAID'];
        console.log('\n=== Checking Payment Status Variations ===');
        for (const variation of variations) {
            const count = await collection.countDocuments({ payment_status: variation });
            if (count > 0) {
                console.log(`${variation}: ${count}`);
            }
        }

        // Sample completed payment records
        const sampleCompleted = await collection.findOne({ payment_status: 'completed' });
        if (sampleCompleted) {
            console.log('\n=== Sample Completed Payment Record ===');
            console.log(JSON.stringify(sampleCompleted, null, 2));
        } else {
            console.log('\nNo completed payment records found.');
            
            // Show sample records with any payment status
            console.log('\n=== Sample Records with Payment Status ===');
            const sampleWithPayment = await collection.find({ payment_status: { $exists: true } }).limit(3).toArray();
            sampleWithPayment.forEach((record, index) => {
                console.log(`\nSample ${index + 1}:`);
                console.log(`  ID: ${record._id}`);
                console.log(`  Project ID: ${record.project_id}`);
                console.log(`  Village: ${record.village}`);
                console.log(`  Payment Status: ${record.payment_status}`);
                console.log(`  KYC Status: ${record.kyc_status}`);
            });
        }

        // Check project distribution
        console.log('\n=== Project Distribution ===');
        const projectAgg = await collection.aggregate([
            {
                $group: {
                    _id: '$project_id',
                    count: { $sum: 1 },
                    completed_payments: {
                        $sum: {
                            $cond: [{ $eq: ['$payment_status', 'completed'] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray();

        console.log('Project ID -> Total Records (Completed Payments)');
        projectAgg.slice(0, 5).forEach(project => {
            console.log(`${project._id}: ${project.count} (${project.completed_payments})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB.');
    }
}

checkLandownerPayments();