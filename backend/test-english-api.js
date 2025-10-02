import axios from 'axios';

async function testEnglishAPI() {
  try {
    console.log('Testing English API endpoints...');
    
    // Test list endpoint
    const listResponse = await axios.get('http://localhost:5000/api/landowners2-english/list');
    console.log('List endpoint status:', listResponse.status);
    console.log('Success:', listResponse.data.success);
    console.log('Data count:', listResponse.data.data?.length || 0);
    
    // Show first record fields if available
    if (listResponse.data.data && listResponse.data.data.length > 0) {
      console.log('\nFirst record fields:');
      const firstRecord = listResponse.data.data[0];
      Object.keys(firstRecord).forEach(key => {
        console.log(`  ${key}: ${typeof firstRecord[key]}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testEnglishAPI();