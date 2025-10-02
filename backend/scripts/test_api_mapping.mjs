import fetch from 'node-fetch';

async function testAPIMapping() {
  try {
    console.log('Testing API payment status mapping...\n');
    
    // Test the /api/landowners/list endpoint
    console.log('=== Testing /api/landowners/list endpoint ===');
    const listResponse = await fetch('http://localhost:5000/api/landowners/list');
    const listData = await listResponse.json();
    
    if (listData.success && listData.records.length > 0) {
      console.log(`Found ${listData.records.length} records`);
      
      // Check first few records for payment status mapping
      const sampleRecords = listData.records.slice(0, 5);
      sampleRecords.forEach((record, index) => {
        console.log(`Record ${index + 1}:`);
        console.log(`  payment_status: ${record.payment_status}`);
        console.log(`  paymentStatus: ${record.paymentStatus}`);
        console.log(`  owner_name: ${record.owner_name || 'undefined'}`);
        console.log('---');
      });
      
      // Count payment statuses
      const paymentStatusCounts = {};
      const paymentStatusMappedCounts = {};
      
      listData.records.forEach(record => {
        const dbStatus = record.payment_status || 'undefined';
        const mappedStatus = record.paymentStatus || 'undefined';
        
        paymentStatusCounts[dbStatus] = (paymentStatusCounts[dbStatus] || 0) + 1;
        paymentStatusMappedCounts[mappedStatus] = (paymentStatusMappedCounts[mappedStatus] || 0) + 1;
      });
      
      console.log('\n=== Database payment_status distribution ===');
      Object.entries(paymentStatusCounts).forEach(([status, count]) => {
        console.log(`${status}: ${count} records`);
      });
      
      console.log('\n=== Mapped paymentStatus distribution ===');
      Object.entries(paymentStatusMappedCounts).forEach(([status, count]) => {
        console.log(`${status}: ${count} records`);
      });
      
      // Check if mapping is working correctly
      const completedCount = paymentStatusCounts['completed'] || 0;
      const successCount = paymentStatusMappedCounts['success'] || 0;
      
      console.log('\n=== Mapping Verification ===');
      console.log(`Records with payment_status="completed": ${completedCount}`);
      console.log(`Records with paymentStatus="success": ${successCount}`);
      
      if (completedCount === successCount && completedCount > 0) {
        console.log('✅ Mapping is working correctly!');
      } else if (completedCount > 0 && successCount === 0) {
        console.log('❌ Mapping is NOT working - completed records not mapped to success');
      } else {
        console.log('ℹ️  No completed records found to test mapping');
      }
      
    } else {
      console.log('No records found or API error');
      console.log(listData);
    }
    
  } catch (error) {
    console.error('Error testing API mapping:', error.message);
    console.log('Make sure the backend server is running on http://localhost:5000');
  }
}

testAPIMapping();