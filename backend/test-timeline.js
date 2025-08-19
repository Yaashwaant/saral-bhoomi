import { MongoClient } from 'mongodb';

// MongoDB connection string from config.env
const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function testTimeline() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('saral_bhoomi');
    const blockchainCollection = db.collection('blockchainledgers');
    
    console.log('✅ Connected to MongoDB');
    
    // Find all blockchain entries for SY-2024-DEMO-001
    const entries = await blockchainCollection.find({
      survey_number: 'SY-2024-DEMO-001'
    }).toArray();
    
    console.log(`\n📊 Found ${entries.length} blockchain entries for SY-2024-DEMO-001`);
    
    entries.forEach((entry, index) => {
      console.log(`\n--- Entry ${index + 1} ---`);
      console.log('ID:', entry._id);
      console.log('Block ID:', entry.block_id);
      console.log('Event Type:', entry.event_type);
      console.log('Transaction Type:', entry.transaction_type);
      console.log('Timestamp:', entry.timestamp);
      console.log('Has timeline_history:', !!entry.timeline_history);
      console.log('Timeline History Length:', entry.timeline_history ? entry.timeline_history.length : 'N/A');
      
      if (entry.timeline_history && entry.timeline_history.length > 0) {
        console.log('Timeline History:');
        entry.timeline_history.forEach((item, i) => {
          console.log(`  ${i + 1}. Action: ${item.action}, Timestamp: ${item.timestamp}`);
        });
      }
    });
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTimeline();
