import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testSpecificProject() {
  try {
    // Test with the project we know has records
    const projectId = '68da6edf579af093415f639e'; // Palghar DFCC Project
    console.log(`🔄 Testing records for project ID: ${projectId}`);
    
    const recordsResponse = await axios.get(`${API_BASE_URL}/api/landowners2/${projectId}`);
    console.log('✅ Records fetched successfully:');
    console.log(`📊 Found ${recordsResponse.data.data.length} records`);
    
    if (recordsResponse.data.data.length > 0) {
      console.log('📝 Sample record:');
      const sampleRecord = recordsResponse.data.data[0];
      console.log(`   ID: ${sampleRecord._id}`);
      console.log(`   खातेदाराचे नांव: ${sampleRecord.खातेदाराचे_नांव}`);
      console.log(`   Village: ${sampleRecord.Village}`);
      console.log(`   Project ID: ${sampleRecord.project_id}`);
    }

    // Test fetching a specific record by ID
    if (recordsResponse.data.data.length > 0) {
      const recordId = recordsResponse.data.data[0]._id;
      console.log(`\n🔄 Testing specific record fetch: ${recordId}`);
      
      const specificResponse = await axios.get(`${API_BASE_URL}/api/landowners2/${recordId}`);
      console.log('✅ Specific record fetched successfully');
      console.log(`   खातेदाराचे नांव: ${specificResponse.data.data.खातेदाराचे_नांव}`);
    }

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testSpecificProject();