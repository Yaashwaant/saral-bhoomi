// Test API endpoints to understand the correct format
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

async function testAPIEndpoints() {
    try {
        console.log('🧪 Testing API Endpoints');
        console.log('========================');
        
        // Test 1: Check if we can get existing landowners
        console.log('\n1. Testing GET /api/landowners/list...');
        const listResponse = await fetch(`${API_BASE_URL}/landowners/list`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        if (listResponse.ok) {
            const listData = await listResponse.json();
            console.log(`✅ Found ${listData.records?.length || 0} existing records`);
            
            if (listData.records && listData.records.length > 0) {
                console.log('📋 Sample existing record structure:');
                console.log(JSON.stringify(listData.records[0], null, 2));
            }
        } else {
            console.log('❌ List endpoint failed');
        }
        
        // Test 2: Try to create a simple record
        console.log('\n2. Testing POST /api/landowners with minimal data...');
        const simpleRecord = {
            project_id: 'demo-project',
            survey_number: 'TEST001',
            landowner_name: 'Test Landowner',
            area: 1.0,
            village: 'Test Village',
            taluka: 'Test Taluka',
            district: 'Test District'
        };
        
        const createResponse = await fetch(`${API_BASE_URL}/landowners`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            },
            body: JSON.stringify(simpleRecord)
        });
        
        if (createResponse.ok) {
            const createData = await createResponse.json();
            console.log('✅ Simple record created successfully');
            console.log('📄 Response:', JSON.stringify(createData, null, 2));
        } else {
            const errorText = await createResponse.text();
            console.log('❌ Simple record creation failed:');
            console.log(errorText);
        }
        
        // Test 3: Check the CSV upload status endpoint
        console.log('\n3. Testing GET /api/csv/status/demo-project...');
        const statusResponse = await fetch(`${API_BASE_URL}/csv/status/demo-project`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log('✅ CSV status endpoint working');
            console.log('📊 Status:', JSON.stringify(statusData, null, 2));
        } else {
            console.log('❌ CSV status endpoint failed');
        }
        
        // Test 4: Check landowners by project
        console.log('\n4. Testing GET /api/landowners/demo-project...');
        const projectResponse = await fetch(`${API_BASE_URL}/landowners/demo-project`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            console.log(`✅ Found ${projectData.data?.length || 0} records for demo-project`);
        } else {
            const errorText = await projectResponse.text();
            console.log('❌ Project landowners endpoint failed:');
            console.log(errorText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAPIEndpoints().catch(console.error);