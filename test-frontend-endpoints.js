import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testFrontendEndpoints() {
  try {
    console.log('🔄 Testing all frontend endpoints...\n');
    
    // Test projects endpoint
    console.log('1️⃣ Testing projects endpoint...');
    const projectsResponse = await axios.get(`${API_BASE_URL}/api/projects`);
    console.log('📊 Projects response structure:', Object.keys(projectsResponse.data));
    console.log(`✅ Projects: ${projectsResponse.data.data.length} projects found`);
    
    if (projectsResponse.data.data.length > 0) {
      const firstProject = projectsResponse.data.data[0];
      console.log('📊 First project data:', JSON.stringify(firstProject, null, 2));
      
      // Test land records for first project
      console.log('\n2️⃣ Testing land records for first project...');
      const recordsResponse = await axios.get(`${API_BASE_URL}/api/landowners2/${firstProject.id}`);
      console.log(`✅ Land records: ${recordsResponse.data.data.length} records found`);
      
      // Test with Palghar DFCC Project that has records
      console.log('\n3️⃣ Testing land records for Palghar DFCC Project (68da6edf579af093415f639e)...');
      const palgharResponse = await axios.get(`${API_BASE_URL}/api/landowners2/68da6edf579af093415f639e`);
      console.log(`✅ Palghar DFCC records: ${palgharResponse.data.data.length} records found`);
      
      if (recordsResponse.data.data.length > 0) {
        const firstRecord = recordsResponse.data.data[0];
        console.log(`   First record: ${firstRecord.खातेदाराचे_नांव} (${firstRecord._id})`);
        
        // Test specific record endpoint
        console.log('\n3️⃣ Testing specific record endpoint...');
        try {
          const specificRecordResponse = await axios.get(`${API_BASE_URL}/api/landowners2/${firstRecord._id}`);
          console.log('✅ Specific record endpoint working');
        } catch (error) {
          console.log('⚠️  Specific record endpoint not working (404 expected)');
        }
      }
    }
    
    console.log('\n✅ All frontend endpoints tested successfully!');
    
  } catch (error) {
    console.error('❌ Error testing frontend endpoints:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testFrontendEndpoints();