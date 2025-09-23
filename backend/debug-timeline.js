import { MongoClient } from 'mongodb';

// MongoDB connection string from config.env
const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function debugTimeline() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('saral_bhoomi');
    const blockchainCollection = db.collection('blockchainledgers');
    
    console.log('✅ Connected to MongoDB');
    
    // Find the blockchain entry for SY-2024-DEMO-001
    const entry = await blockchainCollection.findOne({
      survey_number: 'SY-2024-DEMO-001'
    });
    
    if (entry) {
      console.log('\n📊 Found blockchain entry:');
      console.log('Survey Number:', entry.survey_number);
      console.log('Event Type:', entry.event_type);
      console.log('Block ID:', entry.block_id);
      console.log('Timeline History Length:', entry.timeline_history ? entry.timeline_history.length : 'No timeline_history field');
      
      if (entry.timeline_history && entry.timeline_history.length > 0) {
        console.log('\n📅 Timeline History:');
        entry.timeline_history.forEach((item, index) => {
          console.log(`  ${index + 1}. Action: ${item.action}, Timestamp: ${item.timestamp}`);
        });
      }
      
      // Check all fields
      console.log('\n🔍 All fields in the document:');
      Object.keys(entry).forEach(key => {
        console.log(`  ${key}: ${typeof entry[key]} - ${JSON.stringify(entry[key]).substring(0, 100)}...`);
      });
    } else {
      console.log('❌ No blockchain entry found for SY-2024-DEMO-001');
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugTimeline();
