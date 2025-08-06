// Quick test for agent assignment functionality
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

async function testAgentAssignment() {
  console.log('🧪 Testing Agent Assignment API');
  console.log('='.repeat(50));
  
  try {
    // 1. Get available agents
    console.log('\n1. Getting available agents...');
    const agentsResponse = await fetch(`${API_BASE}/agents/available`);
    const agentsResult = await agentsResponse.json();
    
    if (!agentsResult.success || agentsResult.count === 0) {
      throw new Error('No agents available');
    }
    
    const agent = agentsResult.data[0];
    console.log('✅ Agent found:', agent.name, agent._id);

    // 2. Get a landowner record to test with
    console.log('\n2. Getting landowner records...');
    const recordsResponse = await fetch(`${API_BASE}/csv/project/689259fb67a15f847090b30d?limit=1`);
    const recordsResult = await recordsResponse.json();
    
    if (!recordsResult.success || recordsResult.count === 0) {
      throw new Error('No landowner records available');
    }
    
    const record = recordsResult.data[0];
    console.log('✅ Record found:', record.खातेदाराचे_नांव, record._id);

    // 3. Test agent assignment
    console.log('\n3. Testing agent assignment...');
    const assignResponse = await fetch(`${API_BASE}/agents/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        landownerId: record._id,
        agentId: agent._id,
        noticeData: {
          noticeNumber: `TEST-${Date.now()}`,
          noticeDate: new Date(),
          noticeContent: 'Test notice for agent assignment verification'
        }
      })
    });

    console.log('📡 Response status:', assignResponse.status);
    const assignResult = await assignResponse.json();
    console.log('📥 Response data:', assignResult);

    if (assignResult.success) {
      console.log('✅ Agent assignment SUCCESSFUL!');
      console.log(`   ${record.खातेदाराचे_नांव} → ${agent.name}`);
    } else {
      console.log('❌ Agent assignment FAILED:', assignResult.message);
    }

    // 4. Verify the assignment worked
    console.log('\n4. Verifying assignment...');
    const verifyResponse = await fetch(`${API_BASE}/agents/assigned-with-notices?agentId=${agent._id}`);
    const verifyResult = await verifyResponse.json();
    
    if (verifyResult.success && verifyResult.count > 0) {
      const assignedRecord = verifyResult.data.find(r => r._id === record._id);
      if (assignedRecord) {
        console.log('✅ Assignment verified in agent portal');
        console.log(`   KYC Status: ${assignedRecord.kycStatus}`);
      } else {
        console.log('⚠️  Record not found in assigned records');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testAgentAssignment();