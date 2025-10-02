import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testFrontendEndpoint() {
  try {
    // Test the exact endpoint the frontend is using
    const projectId = '68da6edf579af093415f639e'; // Palghar DFCC Project
    console.log(`🔄 Testing frontend endpoint: ${API_BASE_URL}/landowners2/${projectId}`);
    
    const response = await axios.get(`${API_BASE_URL}/landowners2/${projectId}`);
    console.log('✅ Frontend endpoint working:');
    console.log(`📊 Found ${response.data.data.length} records`);
    
    if (response.data.data.length > 0) {
      console.log('📝 First record details:');
      const record = response.data.data[0];
      console.log(`   ID: ${record._id}`);
      console.log(`   खातेदाराचे नांव: ${record.खातेदाराचे_नांव}`);
      console.log(`   Village: ${record.Village}`);
      console.log(`   Taluka: ${record.Taluka}`);
      console.log(`   District: ${record.District}`);
      console.log(`   Project ID: ${record.project_id}`);
    }

    console.log('\n✅ Frontend endpoint test successful!');
    
  } catch (error) {
    console.error('❌ Error testing frontend endpoint:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testFrontendEndpoint();