import mongoose from 'mongoose';
import crypto from 'crypto';

// MongoDB connection string from config.env
const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

// 🔧 Data cleaning function for consistent hash generation
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

// 🔧 Generate consistent hash
function generateConsistentHash(data) {
  try {
    const cleanData = cleanDataForSerialization(data);
    const dataString = JSON.stringify(cleanData, Object.keys(cleanData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  } catch (error) {
    console.error('❌ Error generating hash:', error);
    return null;
  }
}

async function cleanAndReseedDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const client = new mongoose.mongo.MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('saral_bhoomi');
    console.log('✅ Connected to MongoDB');

    // 🧹 STEP 1: CLEAN ALL BLOCKCHAIN DATA
    console.log('\n🧹 STEP 1: Cleaning all blockchain data...');
    
    const collectionsToClean = [
      'blockchainledgers',
      'jmrrecords', 
      'landownerrecords',
      'notices',
      'payments',
      'awards'
    ];

    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        if (count > 0) {
          await collection.deleteMany({});
          console.log(`✅ Cleaned ${collectionName}: ${count} documents removed`);
        } else {
          console.log(`ℹ️  ${collectionName}: Already empty`);
        }
      } catch (error) {
        console.error(`❌ Error cleaning ${collectionName}:`, error);
      }
    }

    // 🌱 STEP 2: CREATE FRESH DEMO DATA
    console.log('\n🌱 STEP 2: Creating fresh demo data...');
    
    // Create JMR records
    const jmrRecords = [
      {
        survey_number: '123/1',
        measured_area: 2.5,
        land_type: 'Agricultural',
        village: 'Demo Village 1',
        taluka: 'Demo Taluka',
        district: 'Demo District',
        is_active: true,
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        survey_number: '123/2',
        measured_area: 3.0,
        land_type: 'Residential',
        village: 'Demo Village 2',
        taluka: 'Demo Taluka',
        district: 'Demo District',
        is_active: true,
        created_at: new Date('2024-01-02'),
        updated_at: new Date('2024-01-02')
      },
      {
        survey_number: '124/1',
        measured_area: 1.8,
        land_type: 'Commercial',
        village: 'Demo Village 3',
        taluka: 'Demo Taluka',
        district: 'Demo District',
        is_active: true,
        created_at: new Date('2024-01-03'),
        updated_at: new Date('2024-01-03')
      }
    ];

    const jmrCollection = db.collection('jmrrecords');
    const jmrResult = await jmrCollection.insertMany(jmrRecords);
    console.log(`✅ Created ${jmrRecords.length} JMR records`);

    // Create landowner records
    const landownerRecords = [
      {
        survey_number: '123/1',
        owner_name: 'Demo Owner 1',
        contact_number: '9876543210',
        address: 'Demo Address 1',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01')
      },
      {
        survey_number: '123/2',
        owner_name: 'Demo Owner 2',
        contact_number: '9876543211',
        address: 'Demo Address 2',
        created_at: new Date('2024-01-02'),
        updated_at: new Date('2024-01-02')
      },
      {
        survey_number: '124/1',
        owner_name: 'Demo Owner 3',
        contact_number: '9876543212',
        address: 'Demo Address 3',
        created_at: new Date('2024-01-03'),
        updated_at: new Date('2024-01-03')
      }
    ];

    const landownerCollection = db.collection('landownerrecords');
    const landownerResult = await landownerCollection.insertMany(landownerRecords);
    console.log(`✅ Created ${landownerRecords.length} landowner records`);

    // 🧱 STEP 3: CREATE BLOCKCHAIN BLOCKS WITH CONSISTENT HASHING
    console.log('\n🧱 STEP 3: Creating blockchain blocks with consistent hashing...');
    
    const blockchainCollection = db.collection('blockchainledgers');
    
    for (let i = 0; i < jmrRecords.length; i++) {
      const jmrRecord = jmrRecords[i];
      const landownerRecord = landownerRecords[i];
      const surveyNumber = jmrRecord.survey_number;
      
      console.log(`\n🔍 Creating blockchain block for survey: ${surveyNumber}`);
      
      // Generate consistent hash for JMR data
      const jmrHash = generateConsistentHash(jmrRecord);
      console.log(`   JMR Hash: ${jmrHash}`);
      
      // Generate consistent hash for landowner data
      const landownerHash = generateConsistentHash(landownerRecord);
      console.log(`   Landowner Hash: ${landownerHash}`);
      
      // Create blockchain block
      const blockId = `BLOCK_${surveyNumber}_${Date.now()}_${i}`;
      const timestamp = new Date('2024-01-01T10:00:00Z'); // Fixed timestamp for consistency
      
      const blockchainEntry = {
        block_id: blockId,
        survey_number: surveyNumber,
        event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN',
        officer_id: 'demo-officer',
        project_id: 'demo-project',
        survey_data: {
          jmr: { 
            data: jmrRecord, 
            hash: jmrHash, 
            last_updated: timestamp, 
            status: 'created' 
          },
          landowner: { 
            data: landownerRecord, 
            hash: landownerHash, 
            last_updated: timestamp, 
            status: 'created' 
          },
          notice: { data: null, hash: null, last_updated: null, status: 'not_created' },
          payment: { data: null, hash: null, last_updated: null, status: 'not_created' },
          award: { data: null, hash: null, last_updated: null, status: 'not_created' }
        },
        timeline_history: [{
          action: 'SURVEY_CREATED_ON_BLOCKCHAIN',
          timestamp: timestamp,
          officer_id: 'demo-officer',
          data_hash: jmrHash,
          previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          metadata: { event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN', project_id: 'demo-project' },
          remarks: `Survey ${surveyNumber} registered on blockchain via clean reseed`
        }],
        metadata: { 
          event_type: 'SURVEY_CREATED_ON_BLOCKCHAIN', 
          project_id: 'demo-project',
          source: 'clean_reseed_script',
          created_at: timestamp,
          updated_at: timestamp
        },
        remarks: `Survey ${surveyNumber} created on blockchain via clean reseed`,
        timestamp: timestamp,
        previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: i + 1,
        is_valid: true
      };

      // Generate main block hash (excluding current timestamp)
      const blockDataForHash = {
        block_id: blockchainEntry.block_id,
        survey_number: blockchainEntry.survey_number,
        event_type: blockchainEntry.event_type,
        officer_id: blockchainEntry.officer_id,
        project_id: blockchainEntry.project_id,
        survey_data: blockchainEntry.survey_data,
        timeline_history: blockchainEntry.timeline_history,
        metadata: blockchainEntry.metadata,
        remarks: blockchainEntry.remarks,
        // timestamp: blockchainEntry.timestamp, // ← EXCLUDED for consistency
        previous_hash: blockchainEntry.previous_hash,
        nonce: blockchainEntry.nonce
      };
      
      const blockHash = generateConsistentHash(blockDataForHash);
      blockchainEntry.current_hash = blockHash;
      
      console.log(`   Block Hash: ${blockHash}`);
      
      // Insert blockchain entry
      const result = await blockchainCollection.insertOne(blockchainEntry);
      console.log(`   ✅ Blockchain block created: ${result.insertedId}`);
    }

    // 🔍 STEP 4: VERIFY HASH CONSISTENCY
    console.log('\n🔍 STEP 4: Verifying hash consistency...');
    
    const allBlocks = await blockchainCollection.find({}).toArray();
    console.log(`📊 Total blockchain blocks: ${allBlocks.length}`);
    
    for (const block of allBlocks) {
      console.log(`\n🔍 Verifying block: ${block.survey_number}`);
      
      // Verify JMR hash
      if (block.survey_data.jmr && block.survey_data.jmr.data) {
        const currentJmrHash = generateConsistentHash(block.survey_data.jmr.data);
        const storedJmrHash = block.survey_data.jmr.hash;
        
        if (currentJmrHash === storedJmrHash) {
          console.log(`   ✅ JMR Hash: VERIFIED`);
        } else {
          console.log(`   ❌ JMR Hash: MISMATCH`);
          console.log(`      Stored: ${storedJmrHash}`);
          console.log(`      Current: ${currentJmrHash}`);
        }
      }
      
      // Verify landowner hash
      if (block.survey_data.landowner && block.survey_data.landowner.data) {
        const currentLandownerHash = generateConsistentHash(block.survey_data.landowner.data);
        const storedLandownerHash = block.survey_data.landowner.hash;
        
        if (currentLandownerHash === storedLandownerHash) {
          console.log(`   ✅ Landowner Hash: VERIFIED`);
        } else {
          console.log(`   ❌ Landowner Hash: MISMATCH`);
          console.log(`      Stored: ${storedLandownerHash}`);
          console.log(`      Current: ${currentLandownerHash}`);
        }
      }
      
      // Verify main block hash
      const blockDataForHash = {
        block_id: block.block_id,
        survey_number: block.survey_number,
        event_type: block.event_type,
        officer_id: block.officer_id,
        project_id: block.project_id,
        survey_data: block.survey_data,
        timeline_history: block.timeline_history,
        metadata: block.metadata,
        remarks: block.remarks,
        // timestamp: block.timestamp, // ← EXCLUDED for consistency
        previous_hash: block.previous_hash,
        nonce: block.nonce
      };
      
      const currentBlockHash = generateConsistentHash(blockDataForHash);
      const storedBlockHash = block.current_hash;
      
      if (currentBlockHash === storedBlockHash) {
        console.log(`   ✅ Block Hash: VERIFIED`);
      } else {
        console.log(`   ❌ Block Hash: MISMATCH`);
        console.log(`      Stored: ${storedBlockHash}`);
        console.log(`      Current: ${currentBlockHash}`);
      }
    }

    console.log('\n🎉 Database cleanup and reseeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - JMR Records: ${jmrRecords.length}`);
    console.log(`   - Landowner Records: ${landownerRecords.length}`);
    console.log(`   - Blockchain Blocks: ${allBlocks.length}`);
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error during cleanup and reseeding:', error);
  }
}

// Run the script
cleanAndReseedDatabase();
