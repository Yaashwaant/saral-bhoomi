import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testSimpleCreate() {
  try {
    const projectId = '68da6edf579af093415f639e'; // Palghar DFCC Project
    
    // Minimal record with just required fields
    const simpleRecord = {
      अ_क्र: '12345',
      खातेदाराचे_नांव: 'टेस्ट खातेदार',
      Village: 'टेस्ट गाव',
      Taluka: 'टेस्ट तालुका',
      District: 'पालघर',
      project_id: projectId
    };
    
    console.log(`🔄 Testing simple POST endpoint: ${API_BASE_URL}/api/landowners2`);
    console.log('📤 Sending minimal data:', JSON.stringify(simpleRecord, null, 2));
    
    const response = await axios.post(`${API_BASE_URL}/api/landowners2`, simpleRecord, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-jwt-token',
        'x-demo-role': 'officer'
      }
    });
    
    console.log('✅ Simple record created successfully!');
    console.log('📊 Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error creating simple record:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testSimpleCreate();