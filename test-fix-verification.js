// Test script to verify the landrecords2 API fix
const API_BASE_URL = 'http://localhost:5000/api';

async function testLandRecords2Fix() {
  console.log('🧪 Testing landrecords2 API fix...');
  
  try {
    // Test the Railway Overbridge project that has 88 records
    const projectId = '68da6edf579af093415f639e';
    console.log(`📡 Fetching records for project: ${projectId}`);
    
    const response = await fetch(`${API_BASE_URL}/landowners2/${projectId}`);
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.count} land records`);
      
      if (data.count > 0) {
        console.log('📝 First record details:');
        const firstRecord = data.data[0];
        console.log(`   - ID: ${firstRecord.id}`);
        console.log(`   - Name: ${firstRecord.खातेदाराचे_नांव}`);
        console.log(`   - Village: ${firstRecord.Village}`);
        console.log(`   - Project ID: ${firstRecord.project_id}`);
        console.log(`   - Area: ${firstRecord.गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर} hectares`);
      }
    } else {
      const error = await response.text();
      console.log(`❌ Error: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLandRecords2Fix();