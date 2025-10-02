import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';
const ROB_PROJECT_ID = '68da854996a3d559f5005b5c';

async function testDongareAPI() {
  try {
    console.log('Testing Dongare project API endpoint...\n');
    
    // ROB Project ID from the scripts
    const robProjectId = ROB_PROJECT_ID;
    
    // Test the /api/landowners/:projectId endpoint for Dongare
    console.log(`=== Testing /api/landowners/${robProjectId} endpoint ===`);
    const projectResponse = await fetch(`http://localhost:5000/api/landowners/${robProjectId}`);
    const projectData = await projectResponse.json();
    
    console.log('API Response:', JSON.stringify(projectData, null, 2));
    
    if (projectData && projectData.success && projectData.data && projectData.data.length > 0) {
        console.log(`Found ${projectData.data.length} records for ROB project`);
        
        // Filter for Dongare village records
        const dongareRecords = projectData.data.filter(record => 
            record.village && record.village.toLowerCase().includes('dongare')
        );
      
      console.log(`Found ${dongareRecords.length} Dongare records`);
      
      if (dongareRecords.length > 0) {
        // Check first few Dongare records for payment status mapping
        const sampleRecords = dongareRecords.slice(0, 5);
        console.log('\n=== Sample Dongare Records ===');
        sampleRecords.forEach((record, index) => {
          console.log(`Record ${index + 1}:`);
          console.log(`  payment_status: ${record.payment_status}`);
          console.log(`  paymentStatus: ${record.paymentStatus}`);
          console.log(`  owner_name: ${record.owner_name || record.landowner_name || 'undefined'}`);
          console.log(`  village: ${record.village}`);
          console.log(`  final_amount: ${record.final_amount || 'undefined'}`);
          console.log('---');
        });
        
        // Count payment statuses for Dongare records
        const paymentStatusCounts = {};
        const paymentStatusMappedCounts = {};
        
        dongareRecords.forEach(record => {
          const dbStatus = record.payment_status || 'undefined';
          const mappedStatus = record.paymentStatus || 'undefined';
          
          paymentStatusCounts[dbStatus] = (paymentStatusCounts[dbStatus] || 0) + 1;
          paymentStatusMappedCounts[mappedStatus] = (paymentStatusMappedCounts[mappedStatus] || 0) + 1;
        });
        
        console.log('\n=== Dongare Database payment_status distribution ===');
        Object.entries(paymentStatusCounts).forEach(([status, count]) => {
          console.log(`${status}: ${count} records`);
        });
        
        console.log('\n=== Dongare Mapped paymentStatus distribution ===');
        Object.entries(paymentStatusMappedCounts).forEach(([status, count]) => {
          console.log(`${status}: ${count} records`);
        });
        
        // Check if mapping is working correctly for Dongare
        const completedCount = paymentStatusCounts['completed'] || 0;
        const successCount = paymentStatusMappedCounts['success'] || 0;
        
        console.log('\n=== Dongare Mapping Verification ===');
        console.log(`Dongare records with payment_status="completed": ${completedCount}`);
        console.log(`Dongare records with paymentStatus="success": ${successCount}`);
        
        if (completedCount === successCount && completedCount > 0) {
          console.log('✅ Dongare mapping is working correctly!');
        } else if (completedCount > 0 && successCount === 0) {
          console.log('❌ Dongare mapping is NOT working - completed records not mapped to success');
        } else {
          console.log('ℹ️  No completed Dongare records found to test mapping');
        }
        
        // Calculate total amounts for verification
        const totalFinalAmount = dongareRecords.reduce((sum, record) => {
          return sum + (parseFloat(record.final_amount) || 0);
        }, 0);
        
        console.log(`\n=== Dongare Financial Summary ===`);
        console.log(`Total Dongare records: ${dongareRecords.length}`);
        console.log(`Total final amount: ₹${totalFinalAmount.toLocaleString('en-IN')}`);
        
      } else {
        console.log('No Dongare records found in the project');
      }
      
    } else {
      console.log('No records found for ROB project or API error');
      console.log(projectData);
    }
    
  } catch (error) {
    console.error('Error testing Dongare API:', error.message);
    console.log('Make sure the backend server is running on http://localhost:5000');
  }
}

testDongareAPI();