import mongoose from 'mongoose';
import crypto from 'crypto';

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

// 🔧 Data cleaning function (same as in services)
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

// 🔧 Generate consistent hash (same as in services)
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

async function testIntegrityVerification() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const client = new mongoose.mongo.MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('saral_bhoomi');
    console.log('✅ Connected to MongoDB');

    // 🔍 STEP 1: Get all blockchain blocks
    console.log('\n🔍 STEP 1: Analyzing blockchain blocks...');
    const blockchainCollection = db.collection('blockchainledgers');
    const allBlocks = await blockchainCollection.find({}).toArray();
    console.log(`📊 Total blockchain blocks: ${allBlocks.length}`);

    // 🔍 STEP 2: Test hash generation consistency
    console.log('\n🔍 STEP 2: Testing hash generation consistency...');
    
    for (const block of allBlocks) {
      console.log(`\n🔍 Testing block: ${block.survey_number}`);
      
      // Test 1: JMR Data Hash Consistency
      if (block.survey_data.jmr && block.survey_data.jmr.data) {
        console.log(`   📋 Testing JMR data hash...`);
        
        const storedJmrHash = block.survey_data.jmr.hash;
        const currentJmrHash = generateConsistentHash(block.survey_data.jmr.data);
        
        if (storedJmrHash === currentJmrHash) {
          console.log(`      ✅ JMR Hash: VERIFIED (${storedJmrHash.substring(0, 16)}...)`);
        } else {
          console.log(`      ❌ JMR Hash: MISMATCH DETECTED!`);
          console.log(`         Stored:  ${storedJmrHash}`);
          console.log(`         Current: ${currentJmrHash}`);
          
          // Debug: Show what's different
          console.log(`         🔍 Debug: Data structure analysis`);
          const originalData = block.survey_data.jmr.data;
          const cleanedData = cleanDataForSerialization(originalData);
          console.log(`            Original keys: ${Object.keys(originalData).join(', ')}`);
          console.log(`            Cleaned keys: ${Object.keys(cleanedData).join(', ')}`);
        }
      }
      
      // Test 2: Landowner Data Hash Consistency
      if (block.survey_data.landowner && block.survey_data.landowner.data) {
        console.log(`   📋 Testing landowner data hash...`);
        
        const storedLandownerHash = block.survey_data.landowner.hash;
        const currentLandownerHash = generateConsistentHash(block.survey_data.landowner.data);
        
        if (storedLandownerHash === currentLandownerHash) {
          console.log(`      ✅ Landowner Hash: VERIFIED (${storedLandownerHash.substring(0, 16)}...)`);
        } else {
          console.log(`      ❌ Landowner Hash: MISMATCH DETECTED!`);
          console.log(`         Stored:  ${storedLandownerHash}`);
          console.log(`         Current: ${currentLandownerHash}`);
          
          // Debug: Show what's different
          console.log(`         🔍 Debug: Data structure analysis`);
          const originalData = block.survey_data.landowner.data;
          const cleanedData = cleanDataForSerialization(originalData);
          console.log(`            Original keys: ${Object.keys(originalData).join(', ')}`);
          console.log(`            Cleaned keys: ${Object.keys(cleanedData).join(', ')}`);
        }
      }
      
      // Test 3: Main Block Hash Consistency
      console.log(`   📋 Testing main block hash...`);
      
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
      
      const storedBlockHash = block.current_hash;
      const currentBlockHash = generateConsistentHash(blockDataForHash);
      
      if (storedBlockHash === currentBlockHash) {
        console.log(`      ✅ Block Hash: VERIFIED (${storedBlockHash.substring(0, 16)}...)`);
      } else {
        console.log(`      ❌ Block Hash: MISMATCH DETECTED!`);
        console.log(`         Stored:  ${storedBlockHash}`);
        console.log(`         Current: ${currentBlockHash}`);
        
        // Debug: Show what's different
        console.log(`         🔍 Debug: Block data analysis`);
        console.log(`            Block ID: ${block.block_id}`);
        console.log(`            Survey Number: ${block.survey_number}`);
        console.log(`            Event Type: ${block.event_type}`);
        console.log(`            Officer ID: ${block.officer_id}`);
        console.log(`            Project ID: ${block.project_id}`);
        console.log(`            Nonce: ${block.nonce}`);
      }
    }

    // 🔍 STEP 3: Test data integrity over time
    console.log('\n🔍 STEP 3: Testing data integrity over time...');
    
    for (const block of allBlocks) {
      console.log(`\n⏰ Testing time-based integrity for: ${block.survey_number}`);
      
      // Simulate multiple hash generations (like multiple API calls)
      const hashes = [];
      for (let i = 0; i < 5; i++) {
        if (block.survey_data.jmr && block.survey_data.jmr.data) {
          const hash = generateConsistentHash(block.survey_data.jmr.data);
          hashes.push(hash);
        }
      }
      
      // Check if all hashes are identical
      const uniqueHashes = new Set(hashes);
      if (uniqueHashes.size === 1) {
        console.log(`   ✅ JMR Hash: STABLE (${hashes[0].substring(0, 16)}...)`);
      } else {
        console.log(`   ❌ JMR Hash: UNSTABLE - ${uniqueHashes.size} different hashes generated!`);
        console.log(`      Hashes: ${Array.from(uniqueHashes).map(h => h.substring(0, 16) + '...').join(', ')}`);
      }
    }

    // 🔍 STEP 4: Test with different data cleaning approaches
    console.log('\n🔍 STEP 4: Testing different data cleaning approaches...');
    
    if (allBlocks.length > 0) {
      const testBlock = allBlocks[0];
      if (testBlock.survey_data.jmr && testBlock.survey_data.jmr.data) {
        const testData = testBlock.survey_data.jmr.data;
        
        console.log(`\n🔬 Testing different cleaning approaches for: ${testBlock.survey_number}`);
        
        // Approach 1: Our current method (exclude timestamp)
        const hash1 = generateConsistentHash(testData);
        console.log(`   Approach 1 (exclude timestamp): ${hash1.substring(0, 16)}...`);
        
        // Approach 2: Include timestamp
        const hash2 = crypto.createHash('sha256').update(JSON.stringify(testData)).digest('hex');
        console.log(`   Approach 2 (include timestamp): ${hash2.substring(0, 16)}...`);
        
        // Approach 3: Only exclude _id and __v
        const cleaned3 = { ...testData };
        delete cleaned3._id;
        delete cleaned3.__v;
        const hash3 = crypto.createHash('sha256').update(JSON.stringify(cleaned3)).digest('hex');
        console.log(`   Approach 3 (exclude _id, __v only): ${hash3.substring(0, 16)}...`);
        
        if (hash1 === hash2) {
          console.log(`   ⚠️  Warning: Including timestamp doesn't change hash - data might not have timestamp`);
        } else {
          console.log(`   ✅ Confirmed: Excluding timestamp prevents hash changes`);
        }
      }
    }

    console.log('\n🎉 Integrity verification testing completed!');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error during integrity testing:', error);
  }
}

// Run the test
testIntegrityVerification();
