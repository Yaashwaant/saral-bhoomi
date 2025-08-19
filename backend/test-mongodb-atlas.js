import { connectMongoDBAtlas } from './config/mongodb-atlas.js';
import LandownerRecord from './models/mongo/LandownerRecord.js';
import Project from './models/mongo/Project.js';

async function testMongoAtlas() {
  try {
    console.log('☁️ Testing MongoDB Atlas connection...');
    
    const connected = await connectMongoDBAtlas();
    if (connected) {
      console.log('✅ Connection successful! Now creating test data...');
      
      // First create a test project
      const testProject = new Project({
        projectName: 'Test Project',
        schemeName: 'Test Scheme',
        landRequired: 10.0,
        landAvailable: 5.0,
        landToBeAcquired: 5.0,
        type: 'road',
        district: 'Test District',
        taluka: 'Test Taluka',
        villages: ['Test Village'],
        estimatedCost: 1000000,
        allocatedBudget: 800000,
        startDate: new Date('2024-01-01'),
        expectedCompletion: new Date('2024-12-31'),
        status: 'active'
      });
      
      await testProject.save();
      console.log('✅ Test project created successfully!');
      
      // Create a test landowner record with the project_id
      const testRecord = new LandownerRecord({
        project_id: testProject._id, // Add the required project_id
        survey_number: "TEST-001", // Use a unique survey number
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
      const savedRecord = await LandownerRecord.findOne({ survey_number: "TEST-001" });
      console.log('✅ Record retrieved from database:', savedRecord.landowner_name);
      
      // Clean up test data
      await LandownerRecord.deleteOne({ _id: testRecord._id });
      await Project.deleteOne({ _id: testProject._id });
      console.log('🧹 Test data cleaned up');
      
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
