import { MongoClient } from 'mongodb';
import crypto from 'crypto';

// MongoDB connection string from config.env
const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

// 🔧 ADD: Data cleaning function for consistent hash generation
function cleanDataForSerialization(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => cleanDataForSerialization(item));
  }

  // Handle objects
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    // Skip internal Mongoose fields
    if (key.startsWith('__') || key === '_id') {
      continue;
    }

    // 🔧 EXCLUDE current timestamps that change on every check
    if (key === 'timestamp' && value instanceof Date) {
      continue;
    }

    // Handle dates - convert to ISO strings for consistent hashing
    if (value instanceof Date) {
      cleaned[key] = value.toISOString();
    }
    // Handle nested objects
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = cleanDataForSerialization(value);
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      cleaned[key] = cleanDataForSerialization(value);
    }
    // Handle primitive values
    else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

async function testBlockchainCreation() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('saral_bhoomi');
    const blockchainCollection = db.collection('blockchainledgers');
    const jmrCollection = db.collection('jmrrecords');
    
    console.log('✅ Connected to MongoDB');
    
    // Get all JMR records
    const jmrRecords = await jmrCollection.find({}).toArray();
    console.log(`📊 Found ${jmrRecords.length} JMR records`);
    
    // Create blockchain entries for each
    for (const record of jmrRecords) {
      const surveyNumber = record.survey_number;
      console.log(`\n🔍 Processing survey: ${surveyNumber}`);
      
      // Check if blockchain entry already exists
      const existingBlock = await blockchainCollection.findOne({ 
        survey_number: surveyNumber,
        event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN'
      });
      
      if (existingBlock) {
        console.log(`⏭️  Blockchain entry already exists for ${surveyNumber}`);
        continue;
      }
      
      // Create blockchain entry
      const blockId = `BLOCK_${surveyNumber}_${Date.now()}`;
      const timestamp = new Date();
      
      // 🔧 FIX: Use consistent data cleaning for hash generation
      const cleanData = cleanDataForSerialization(record);
      const dataHash = crypto.createHash('sha256').update(JSON.stringify(cleanData, Object.keys(cleanData).sort())).digest('hex');
      
      const blockchainEntry = {
        block_id: blockId,
        survey_number: surveyNumber,
        event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN',
        officer_id: 'demo-officer',
        project_id: 'demo-project',
        survey_data: {
          jmr: { 
            data: record, 
            hash: dataHash, 
            last_updated: timestamp, 
            status: 'created' 
          },
          notice: { data: null, hash: null, last_updated: null, status: 'not_created' },
          payment: { data: null, hash: null, last_updated: null, status: 'not_created' },
          award: { data: null, hash: null, last_updated: null, status: 'not_created' },
          landowner: { data: null, hash: null, last_updated: null, status: 'not_created' }
        },
        timeline_history: [{
          action: 'SURVEY_CREATED_ON_BLOCKCHAIN',
          timestamp: timestamp,
          officer_id: 'demo-officer',
          data_hash: dataHash,
          previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          metadata: { event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN', project_id: 'demo-project' },
          remarks: `Survey ${surveyNumber} registered on blockchain via bulk sync`
        }],
        metadata: { 
          event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN', 
          project_id: 'demo-project',
          source: 'bulk_sync_script'
        },
        remarks: `Survey ${surveyNumber} created on blockchain via bulk sync`,
        timestamp: timestamp,
        previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        current_hash: dataHash,
        nonce: Math.floor(Math.random() * 1000000),
        is_valid: true,
        created_at: timestamp,
        updated_at: timestamp
      };
      
      // Insert blockchain entry
      const result = await blockchainCollection.insertOne(blockchainEntry);
      console.log(`✅ Created blockchain entry for ${surveyNumber}: ${result.insertedId}`);
    }
    
    console.log('\n🎉 Bulk blockchain creation completed!');
    
    // Show final count
    const totalBlockchainEntries = await blockchainCollection.countDocuments();
    console.log(`📊 Total blockchain entries: ${totalBlockchainEntries}`);
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBlockchainCreation();
