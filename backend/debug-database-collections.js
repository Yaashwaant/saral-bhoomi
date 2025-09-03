import mongoose from 'mongoose';

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function debugDatabaseCollections() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const client = new mongoose.mongo.MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('saral_bhoomi');
    console.log('✅ Connected to MongoDB');

    // 🔍 STEP 1: List all collections
    console.log('\n🔍 STEP 1: Listing all collections...');
    const collections = await db.listCollections().toArray();
    console.log(`📊 Total collections: ${collections.length}`);
    
    for (const collection of collections) {
      console.log(`   - ${collection.name}`);
    }

    // 🔍 STEP 2: Check blockchainledgers collection
    console.log('\n🔍 STEP 2: Checking blockchainledgers collection...');
    const blockchainCollection = db.collection('blockchainledgers');
    const blockchainCount = await blockchainCollection.countDocuments();
    console.log(`   Total documents: ${blockchainCount}`);
    
    if (blockchainCount > 0) {
      const sampleBlock = await blockchainCollection.findOne({});
      console.log('   Sample document structure:');
      console.log(`      _id: ${sampleBlock._id}`);
      console.log(`      block_id: ${sampleBlock.block_id}`);
      console.log(`      survey_number: ${sampleBlock.survey_number}`);
      console.log(`      event_type: ${sampleBlock.event_type}`);
      console.log(`      current_hash: ${sampleBlock.current_hash ? 'EXISTS' : 'MISSING'}`);
      console.log(`      survey_data keys: ${Object.keys(sampleBlock.survey_data || {}).join(', ')}`);
    }

    // 🔍 STEP 3: Check jmrrecords collection
    console.log('\n🔍 STEP 3: Checking jmrrecords collection...');
    const jmrCollection = db.collection('jmrrecords');
    const jmrCount = await jmrCollection.countDocuments();
    console.log(`   Total documents: ${jmrCount}`);
    
    if (jmrCount > 0) {
      const sampleJmr = await jmrCollection.findOne({});
      console.log('   Sample document structure:');
      console.log(`      _id: ${sampleJmr._id}`);
      console.log(`      survey_number: ${sampleJmr.survey_number}`);
      console.log(`      measured_area: ${sampleJmr.measured_area}`);
      console.log(`      land_type: ${sampleJmr.land_type}`);
    }

    // 🔍 STEP 4: Check landownerrecords collection
    console.log('\n🔍 STEP 4: Checking landownerrecords collection...');
    const landownerCollection = db.collection('landownerrecords');
    const landownerCount = await landownerCollection.countDocuments();
    console.log(`   Total documents: ${landownerCount}`);
    
    if (landownerCount > 0) {
      const sampleLandowner = await landownerCollection.findOne({});
      console.log('   Sample document structure:');
      console.log(`      _id: ${sampleLandowner._id}`);
      console.log(`      survey_number: ${sampleLandowner.survey_number}`);
      console.log(`      owner_name: ${sampleLandowner.owner_name}`);
    }

    // 🔍 STEP 5: Test survey search manually
    console.log('\n🔍 STEP 5: Testing survey search manually...');
    
    // Search for survey 123/1 in blockchain
    const blockchainSearch = await blockchainCollection.findOne({ survey_number: '123/1' });
    if (blockchainSearch) {
      console.log('   ✅ Found in blockchain:');
      console.log(`      Block ID: ${blockchainSearch.block_id}`);
      console.log(`      Event Type: ${blockchainSearch.event_type}`);
      console.log(`      Current Hash: ${blockchainSearch.current_hash}`);
    } else {
      console.log('   ❌ NOT found in blockchain');
    }

    // Search for survey 123/1 in JMR
    const jmrSearch = await jmrCollection.findOne({ survey_number: '123/1' });
    if (jmrSearch) {
      console.log('   ✅ Found in JMR:');
      console.log(`      Survey Number: ${jmrSearch.survey_number}`);
      console.log(`      Measured Area: ${jmrSearch.measured_area}`);
    } else {
      console.log('   ❌ NOT found in JMR');
    }

    // Search for survey 123/1 in landowner
    const landownerSearch = await landownerCollection.findOne({ survey_number: '123/1' });
    if (landownerSearch) {
      console.log('   ✅ Found in landowner:');
      console.log(`      Survey Number: ${landownerSearch.survey_number}`);
      console.log(`      Owner Name: ${landownerSearch.owner_name}`);
    } else {
      console.log('   ❌ NOT found in landowner');
    }

    // 🔍 STEP 6: Check if there are any collection name mismatches
    console.log('\n🔍 STEP 6: Checking for collection name mismatches...');
    
    const possibleJmrNames = ['jmrrecords', 'jmr', 'jmr_records', 'jmrrecord'];
    const possibleLandownerNames = ['landownerrecords', 'landowner', 'landowner_records', 'landownerrecord'];
    
    for (const name of possibleJmrNames) {
      try {
        const collection = db.collection(name);
        const count = await collection.countDocuments();
        if (count > 0) {
          console.log(`   Found collection '${name}' with ${count} documents`);
        }
      } catch (error) {
        // Collection doesn't exist
      }
    }

    for (const name of possibleLandownerNames) {
      try {
        const collection = db.collection(name);
        const count = await collection.countDocuments();
        if (count > 0) {
          console.log(`   Found collection '${name}' with ${count} documents`);
        }
      } catch (error) {
        // Collection doesn't exist
      }
    }

    console.log('\n🎉 Database debugging completed!');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error during database debugging:', error);
  }
}

// Run the debug
debugDatabaseCollections();
