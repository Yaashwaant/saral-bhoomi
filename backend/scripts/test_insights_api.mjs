import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';
const ROB_PROJECT_ID = '68da854996a3d559f5005b5c';

async function testInsightsAPI() {
  try {
    console.log('Testing Insights API endpoint...\n');
    
    // Test the insights endpoint without filters
    console.log('=== Testing /api/insights/overview-kpis (no filters) ===');
    const response1 = await fetch(`${API_BASE_URL}/insights/overview-kpis`, {
      headers: {
        'demo-jwt-token': 'demo',
        'x-demo-role': 'admin',
      }
    });
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('Response (no filters):', JSON.stringify(data1, null, 2));
    } else {
      console.log('Error response (no filters):', response1.status, await response1.text());
    }
    
    console.log('\n=== Testing /api/insights/overview-kpis with ROB project filter ===');
    const response2 = await fetch(`${API_BASE_URL}/insights/overview-kpis?projectId=${ROB_PROJECT_ID}`, {
      headers: {
        'demo-jwt-token': 'demo',
        'x-demo-role': 'admin',
      }
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('Response (with ROB project filter):', JSON.stringify(data2, null, 2));
    } else {
      console.log('Error response (with ROB project filter):', response2.status, await response2.text());
    }
    
    // Test with different payment status filters
    console.log('\n=== Testing with paymentStatus=completed filter ===');
    const response3 = await fetch(`${API_BASE_URL}/insights/overview-kpis?paymentStatus=completed`, {
      headers: {
        'demo-jwt-token': 'demo',
        'x-demo-role': 'admin',
      }
    });
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log('Response (paymentStatus=completed):', JSON.stringify(data3, null, 2));
    } else {
      console.log('Error response (paymentStatus=completed):', response3.status, await response3.text());
    }
    
    console.log('\n=== Testing with village=Dongare filter ===');
    const response4 = await fetch(`${API_BASE_URL}/insights/overview-kpis?village=Dongare`, {
      headers: {
        'demo-jwt-token': 'demo',
        'x-demo-role': 'admin',
      }
    });
    
    if (response4.ok) {
      const data4 = await response4.json();
      console.log('Response (village=Dongare):', JSON.stringify(data4, null, 2));
    } else {
      console.log('Error response (village=Dongare):', response4.status, await response4.text());
    }
    
  } catch (error) {
    console.error('Error testing insights API:', error);
  }
}

testInsightsAPI();