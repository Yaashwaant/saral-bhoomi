import SurveyDataAggregationService from './services/surveyDataAggregationService.js';
import mongoose from 'mongoose';

// MongoDB connection string from config.env
const MONGODB_URI = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function testSurveyAggregation() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    console.log('🧪 Testing Survey Data Aggregation Service...\n');
    
    const surveyService = new SurveyDataAggregationService();
    
    // Test 1: Get complete survey data for a specific survey
    console.log('📊 Test 1: Getting complete survey data for SY-2024-DEMO-001');
    const surveyData = await surveyService.getCompleteSurveyData('SY-2024-DEMO-001');
    
    console.log('Survey Data Summary:');
    for (const [sectionName, sectionData] of Object.entries(surveyData)) {
      console.log(`  ${sectionName}: ${sectionData.status} ${sectionData.data ? '(has data)' : '(no data)'}`);
      if (sectionData.data) {
        console.log(`    Hash: ${sectionData.hash}`);
        console.log(`    Last Updated: ${sectionData.last_updated}`);
      }
    }
    
    console.log('\n📊 Test 2: Getting all surveys with blockchain status');
    const allSurveys = await surveyService.getAllSurveysWithBlockchainStatus();
    console.log(`Found ${allSurveys.length} surveys`);
    
    // Show first 5 surveys
    allSurveys.slice(0, 5).forEach(survey => {
      console.log(`\n  Survey: ${survey.survey_number}`);
      console.log(`    Blockchain: ${survey.exists_on_blockchain ? 'Yes' : 'No'}`);
      console.log(`    Sections with data: ${survey.sections_with_data}/${survey.total_sections}`);
      if (survey.blockchain_block_id) {
        console.log(`    Block ID: ${survey.blockchain_block_id}`);
        console.log(`    Hash: ${survey.blockchain_hash}`);
      }
    });
    
    console.log('\n✅ Survey aggregation tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

testSurveyAggregation();
