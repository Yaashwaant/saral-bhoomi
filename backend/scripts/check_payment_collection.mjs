import mongoose from 'mongoose';
import MongoPayment from '../models/mongo/Payment.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function checkPaymentCollection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!\n');

    // Check if Payment collection exists and has data
    console.log('=== Checking Payment Collection ===');
    const totalPayments = await MongoPayment.countDocuments();
    console.log(`Total Payment documents: ${totalPayments}`);

    if (totalPayments > 0) {
      // Get sample payment records
      const samplePayments = await MongoPayment.find().limit(5);
      console.log('\nSample Payment records:');
      samplePayments.forEach((payment, index) => {
        console.log(`Payment ${index + 1}:`);
        console.log(`  _id: ${payment._id}`);
        console.log(`  survey_number: ${payment.survey_number}`);
        console.log(`  payment_status: ${payment.payment_status}`);
        console.log(`  amount: ${payment.amount}`);
        console.log(`  payment_date: ${payment.payment_date}`);
        console.log(`  project_id: ${payment.project_id}`);
        console.log('---');
      });

      // Check payment status distribution
      const statusCounts = await MongoPayment.aggregate([
        {
          $group: {
            _id: '$payment_status',
            count: { $sum: 1 }
          }
        }
      ]);
      console.log('\nPayment status distribution:');
      statusCounts.forEach(status => {
        console.log(`  ${status._id}: ${status.count}`);
      });

      // Check for completed payments specifically
      const completedPayments = await MongoPayment.countDocuments({ payment_status: 'completed' });
      console.log(`\nCompleted payments: ${completedPayments}`);

      // Check for other possible status values
      const allStatuses = await MongoPayment.distinct('payment_status');
      console.log(`\nAll payment status values: ${JSON.stringify(allStatuses)}`);

    } else {
      console.log('No Payment documents found in the collection.');
      
      // Check if the collection exists at all
      const collections = await mongoose.connection.db.listCollections().toArray();
      const paymentCollection = collections.find(col => col.name === 'payments');
      
      if (paymentCollection) {
        console.log('Payment collection exists but is empty.');
      } else {
        console.log('Payment collection does not exist.');
        console.log('Available collections:');
        collections.forEach(col => console.log(`  - ${col.name}`));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

checkPaymentCollection();