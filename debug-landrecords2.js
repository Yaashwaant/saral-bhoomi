// Debug script for landrecords2 API
const API_BASE_URL = 'http://localhost:5000/api';
const testProjectId = '68da6edf579af093415f639e'; // Railway Overbridge project

async function debugLandrecords2() {
  console.log('🔍 Debugging landrecords2 for Railway Overbridge project...');
  
  try {
    console.log(`📡 Testing: ${API_BASE_URL}/landowners2/${testProjectId}`);
    const response = await fetch(`${API_BASE_URL}/landowners2/${testProjectId}`);
    
    console.log('✅ Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Response data structure:');
      console.log('- count:', data.count);
      console.log('- data length:', data.data?.length);
      console.log('- has data array:', Array.isArray(data.data));
      console.log('- first record:', data.data?.[0]);
      
      if (data.data && data.data.length > 0) {
        console.log('✅ Found', data.count, 'land records');
        console.log('📋 Sample record:', {
          id: data.data[0].id,
          अ_क्र: data.data[0].अ_क्र,
          खातेदाराचे_नांव: data.data[0].खातेदाराचे_नांव,
          Village: data.data[0].Village,
          project_id: data.data[0].project_id
        });
      } else {
        console.log('❌ No data found despite count being', data.count);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

debugLandrecords2();