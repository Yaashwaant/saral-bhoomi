import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

// Demo JWT token for testing
const DEMO_TOKEN = 'demo-jwt-token';

async function testBlockchainIntegrityAPIs() {
  try {
    console.log('🧪 Testing Blockchain Integrity API Endpoints...\n');

    // Test 1: Get blockchain status
    console.log('🔍 Test 1: GET /api/blockchain/status');
    try {
      const statusResponse = await fetch(`${API_BASE_URL}/blockchain/status`, {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
          'x-demo-role': 'officer'
        }
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log('   ✅ Status API: SUCCESS');
        console.log(`      Network: ${statusData.network || 'N/A'}`);
        console.log(`      Connected: ${statusData.connected || 'N/A'}`);
        console.log(`      Block Height: ${statusData.blockHeight || 'N/A'}`);
      } else {
        console.log(`   ❌ Status API: FAILED (${statusResponse.status})`);
        const errorText = await statusResponse.text();
        console.log(`      Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Status API: ERROR - ${error.message}`);
    }

    // Test 2: Search for survey on blockchain
    console.log('\n🔍 Test 2: GET /api/blockchain/search/123/1');
    try {
      const searchResponse = await fetch(`${API_BASE_URL}/blockchain/search/123/1`, {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
          'x-demo-role': 'officer'
        }
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('   ✅ Search API: SUCCESS');
        console.log(`      Found: ${searchData.found || 'N/A'}`);
        console.log(`      Survey Number: ${searchData.survey_number || 'N/A'}`);
        if (searchData.block) {
          console.log(`      Block ID: ${searchData.block.block_id || 'N/A'}`);
          console.log(`      Event Type: ${searchData.block.event_type || 'N/A'}`);
        }
      } else {
        console.log(`   ❌ Search API: FAILED (${searchResponse.status})`);
        const errorText = await searchResponse.text();
        console.log(`      Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Search API: ERROR - ${error.message}`);
    }

    // Test 3: Verify survey integrity
    console.log('\n🔍 Test 3: GET /api/blockchain/verify-integrity/123/1');
    try {
      const integrityResponse = await fetch(`${API_BASE_URL}/blockchain/verify-integrity/123/1`, {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
          'x-demo-role': 'officer'
        }
      });
      
      if (integrityResponse.ok) {
        const integrityData = await integrityResponse.json();
        console.log('   ✅ Integrity API: SUCCESS');
        console.log(`      Is Valid: ${integrityData.isValid || 'N/A'}`);
        console.log(`      Reason: ${integrityData.reason || 'N/A'}`);
        console.log(`      Survey Number: ${integrityData.survey_number || 'N/A'}`);
        
        if (integrityData.data_integrity) {
          console.log('      Data Integrity:');
          for (const [section, status] of Object.entries(integrityData.data_integrity)) {
            console.log(`         ${section}: ${status.isValid ? '✅' : '❌'} (${status.isValid ? 'VERIFIED' : 'MISMATCH'})`);
          }
        }
      } else {
        console.log(`   ❌ Integrity API: FAILED (${integrityResponse.status})`);
        const errorText = await integrityResponse.text();
        console.log(`      Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Integrity API: ERROR - ${error.message}`);
    }

    // Test 4: Get survey timeline
    console.log('\n🔍 Test 4: GET /api/blockchain/timeline/123/1');
    try {
      const timelineResponse = await fetch(`${API_BASE_URL}/blockchain/timeline/123/1`, {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
          'x-demo-role': 'officer'
        }
      });
      
      if (timelineResponse.ok) {
        const timelineData = await timelineResponse.json();
        console.log('   ✅ Timeline API: SUCCESS');
        console.log(`      Survey Number: ${timelineData.survey_number || 'N/A'}`);
        console.log(`      Timeline Entries: ${timelineData.timeline?.length || 0}`);
        
        if (timelineData.timeline && timelineData.timeline.length > 0) {
          console.log('      Timeline Details:');
          timelineData.timeline.forEach((entry, index) => {
            console.log(`         ${index + 1}. ${entry.action || 'N/A'} - ${entry.timestamp || 'N/A'}`);
          });
        }
      } else {
        console.log(`   ❌ Timeline API: FAILED (${timelineResponse.status})`);
        const errorText = await timelineResponse.text();
        console.log(`      Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Timeline API: ERROR - ${error.message}`);
    }

    // Test 5: Get all surveys with blockchain status
    console.log('\n🔍 Test 5: GET /api/blockchain/surveys-with-complete-status');
    try {
      const surveysResponse = await fetch(`${API_BASE_URL}/blockchain/surveys-with-complete-status`, {
        headers: {
          'Authorization': `Bearer ${DEMO_TOKEN}`,
          'x-demo-role': 'officer'
        }
      });
      
      if (surveysResponse.ok) {
        const surveysData = await surveysResponse.json();
        console.log('   ✅ Surveys Status API: SUCCESS');
        console.log(`      Total Surveys: ${surveysData.surveys?.length || 0}`);
        
        if (surveysData.surveys && surveysData.surveys.length > 0) {
          console.log('      Survey Statuses:');
          surveysData.surveys.forEach((survey, index) => {
            console.log(`         ${index + 1}. ${survey.survey_number || 'N/A'}: ${survey.blockchain_status || 'N/A'}`);
          });
        }
      } else {
        console.log(`   ❌ Surveys Status API: FAILED (${surveysResponse.status})`);
        const errorText = await surveysResponse.text();
        console.log(`      Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Surveys Status API: ERROR - ${error.message}`);
    }

    console.log('\n🎉 API Testing Completed!');

  } catch (error) {
    console.error('❌ Error during API testing:', error);
  }
}

// Run the test
testBlockchainIntegrityAPIs();
