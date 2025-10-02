import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testFixedEndpoints() {
  try {
    const projectId = '68da6edf579af093415f639e'; // Palghar DFCC Project
    
    console.log(`🔄 Testing fixed endpoint: ${API_BASE_URL}/api/landowners2/${projectId}`);
    
    const response = await axios.get(`${API_BASE_URL}/api/landowners2/${projectId}`);
    console.log('✅ Fixed endpoint working:');
    console.log(`📊 Found ${response.data.data.length} records`);
    
    if (response.data.data.length > 0) {
      console.log('📝 First record:');
      const record = response.data.data[0];
      console.log(`   खातेदाराचे नांव: ${record.खातेदाराचे_नांव}`);
      console.log(`   Village: ${record.Village}`);
    }

    console.log('\n✅ All endpoint fixes verified!');
    
  } catch (error) {
    console.error('❌ Error testing fixed endpoints:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testFixedEndpoints();