import { connectMongoDBAtlas } from './config/mongodb-atlas.js';
import LandownerRecord from './models/mongo/LandownerRecord.js';

async function testMongoAtlas() {
  try {
    console.log('☁️ Testing MongoDB Atlas connection...');
    
    const connected = await connectMongoDBAtlas();
    if (connected) {
      console.log('✅ Connection successful! Now creating test data...');
      
      // Create a test landowner record
      const testRecord = new LandownerRecord({
        survey_number: "123/1",
        landowner_name: "राम कृष्ण पाटील",
        area: 2.5,
        village: "महुली",
        taluka: "नागपूर",
        district: "नागपूर",
        rate: 2500000,
        total_compensation: 3000000,
        solatium: 300000,
        final_amount: 3300000,
        kyc_status: "approved",
        payment_status: "pending"
      });
      
      await testRecord.save();
      console.log('✅ Test landowner record created successfully!');
      console.log(`📊 Record ID: ${testRecord._id}`);
      
      // Verify the record was saved
      const savedRecord = await LandownerRecord.findOne({ survey_number: "123/1" });
      console.log('✅ Record retrieved from database:', savedRecord.landowner_name);
      
      console.log('🎉 MongoDB Atlas is working perfectly!');
      console.log('🚀 Your database and collections are now set up');
      
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testMongoAtlas();
