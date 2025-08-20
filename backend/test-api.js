// Simple API test script
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Testing Backend API Endpoints...\n');
  
  try {
    // Test 1: Projects endpoint
    console.log('1️⃣ Testing /api/projects...');
    const projectsResponse = await fetch(`${API_BASE}/projects`);
    console.log(`   Status: ${projectsResponse.status}`);
    if (projectsResponse.ok) {
      const data = await projectsResponse.json();
      console.log(`   ✅ Success: Found ${data.count || 0} projects`);
    } else {
      console.log(`   ❌ Failed: ${projectsResponse.statusText}`);
    }
    
    // Test 2: Landowners endpoint
    console.log('\n2️⃣ Testing /api/landowners/list...');
    const landownersResponse = await fetch(`${API_BASE}/landowners/list`);
    console.log(`   Status: ${landownersResponse.status}`);
    if (landownersResponse.ok) {
      const data = await landownersResponse.json();
      console.log(`   ✅ Success: Found ${data.count || 0} landowner records`);
    } else {
      console.log(`   ❌ Failed: ${landownersResponse.statusText}`);
    }
    
    // Test 3: Blockchain status endpoint
    console.log('\n3️⃣ Testing /api/blockchain/status...');
    const blockchainResponse = await fetch(`${API_BASE}/blockchain/status`);
    console.log(`   Status: ${blockchainResponse.status}`);
    if (blockchainResponse.ok) {
      const data = await blockchainResponse.json();
      console.log(`   ✅ Success: Blockchain status retrieved`);
    } else {
      console.log(`   ❌ Failed: ${blockchainResponse.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testEndpoints();
