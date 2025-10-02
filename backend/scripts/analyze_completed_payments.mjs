import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function analyzeCompletedPayments() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully!');

        const db = mongoose.connection.db;
        const collection = db.collection('landownerrecords');

        console.log('\n=== Analyzing Completed Payment Records ===');
        
        // Get completed payment records
        const completedPayments = await collection.find({ payment_status: 'completed' }).toArray();
        console.log(`Total completed payments: ${completedPayments.length}`);

        if (completedPayments.length > 0) {
            console.log('\n=== Sample Completed Payment Records ===');
            
            // Show first 3 completed payment records with all relevant fields
            completedPayments.slice(0, 3).forEach((record, index) => {
                console.log(`\n--- Sample ${index + 1} ---`);
                console.log(`ID: ${record._id}`);
                console.log(`Project ID: ${record.project_id || record.projectId}`);
                console.log(`Village: ${record.village}`);
                console.log(`Payment Status: ${record.payment_status}`);
                
                // Check all possible amount/budget fields
                console.log('\n--- Budget/Amount Fields ---');
                console.log(`final_amount: ${record.final_amount}`);
                console.log(`final_payable_amount: ${record.final_payable_amount}`);
                console.log(`total_final_compensation: ${record.total_final_compensation}`);
                console.log(`amount: ${record.amount}`);
                console.log(`compensation_amount: ${record.compensation_amount}`);
                
                // Check all possible area fields
                console.log('\n--- Area Fields ---');
                console.log(`area_acquired: ${record.area_acquired}`);
                console.log(`acquired_area: ${record.acquired_area}`);
                console.log(`area: ${record.area}`);
                console.log(`area_hectares: ${record.area_hectares}`);
                console.log(`total_area: ${record.total_area}`);
            });

            console.log('\n=== Field Analysis for All Completed Payments ===');
            
            // Analyze all amount fields
            const amountFields = ['final_amount', 'final_payable_amount', 'total_final_compensation', 'amount', 'compensation_amount'];
            console.log('\n--- Budget/Amount Field Statistics ---');
            
            for (const field of amountFields) {
                const nonZeroCount = completedPayments.filter(record => record[field] && record[field] > 0).length;
                const totalSum = completedPayments.reduce((sum, record) => sum + (record[field] || 0), 0);
                console.log(`${field}: ${nonZeroCount}/${completedPayments.length} non-zero records, Total: ₹${totalSum}`);
            }

            // Analyze all area fields
            const areaFields = ['area_acquired', 'acquired_area', 'area', 'area_hectares', 'total_area'];
            console.log('\n--- Area Field Statistics ---');
            
            for (const field of areaFields) {
                const nonZeroCount = completedPayments.filter(record => record[field] && record[field] > 0).length;
                const totalSum = completedPayments.reduce((sum, record) => sum + (record[field] || 0), 0);
                console.log(`${field}: ${nonZeroCount}/${completedPayments.length} non-zero records, Total: ${totalSum} Ha`);
            }

            // Check for any records with non-zero values
            console.log('\n=== Records with Non-Zero Values ===');
            
            const recordsWithAmount = completedPayments.filter(record => 
                (record.final_amount && record.final_amount > 0) ||
                (record.final_payable_amount && record.final_payable_amount > 0) ||
                (record.total_final_compensation && record.total_final_compensation > 0) ||
                (record.amount && record.amount > 0) ||
                (record.compensation_amount && record.compensation_amount > 0)
            );
            
            const recordsWithArea = completedPayments.filter(record => 
                (record.area_acquired && record.area_acquired > 0) ||
                (record.acquired_area && record.acquired_area > 0) ||
                (record.area && record.area > 0) ||
                (record.area_hectares && record.area_hectares > 0) ||
                (record.total_area && record.total_area > 0)
            );

            console.log(`Records with non-zero amount fields: ${recordsWithAmount.length}`);
            console.log(`Records with non-zero area fields: ${recordsWithArea.length}`);

            if (recordsWithAmount.length > 0) {
                console.log('\nSample record with non-zero amount:');
                const sample = recordsWithAmount[0];
                console.log(`  Village: ${sample.village}`);
                console.log(`  final_amount: ${sample.final_amount}`);
                console.log(`  final_payable_amount: ${sample.final_payable_amount}`);
                console.log(`  total_final_compensation: ${sample.total_final_compensation}`);
            }

            if (recordsWithArea.length > 0) {
                console.log('\nSample record with non-zero area:');
                const sample = recordsWithArea[0];
                console.log(`  Village: ${sample.village}`);
                console.log(`  area_acquired: ${sample.area_acquired}`);
                console.log(`  acquired_area: ${sample.acquired_area}`);
                console.log(`  area: ${sample.area}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB.');
    }
}

analyzeCompletedPayments();