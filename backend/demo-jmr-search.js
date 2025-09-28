import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Demo script to test JMR search functionality
async function demonstrateJMRSearch() {
  console.log('🔍 JMR Search Functionality Demonstration');
  console.log('='.repeat(50));

  try {
    // Test 1: Get all JMR records (basic listing)
    console.log('\n1️⃣  Getting all JMR records...');
    const allRecords = await axios.get(`${API_BASE_URL}/jmr`);
    console.log(`✅ Found ${allRecords.data.total} total JMR records`);
    console.log(`📋 Showing page ${allRecords.data.pagination.page} of ${allRecords.data.pagination.pages}`);
    
    // Display first few records
    allRecords.data.data.slice(0, 2).forEach((record, index) => {
      console.log(`   ${index + 1}. Survey: ${record.survey_number}, Owner: ${record.owner_name}, Village: ${record.village}`);
    });

    // Test 2: Search by survey number
    console.log('\n2️⃣  Searching by survey number "123"...');
    const surveySearch = await axios.get(`${API_BASE_URL}/jmr?search=123`);
    console.log(`✅ Found ${surveySearch.data.total} records matching survey "123"`);
    surveySearch.data.data.forEach((record, index) => {
      console.log(`   ${index + 1}. Survey: ${record.survey_number}, Owner: ${record.owner_name}`);
    });

    // Test 3: Search by owner name
    console.log('\n3️⃣  Searching by owner name "राज"...');
    const ownerSearch = await axios.get(`${API_BASE_URL}/jmr?search=राज`);
    console.log(`✅ Found ${ownerSearch.data.total} records matching owner "राज"`);
    ownerSearch.data.data.forEach((record, index) => {
      console.log(`   ${index + 1}. Owner: ${record.owner_name}, Survey: ${record.survey_number}`);
    });

    // Test 4: Filter by district
    console.log('\n4️⃣  Filtering by district "पुणे"...');
    const districtFilter = await axios.get(`${API_BASE_URL}/jmr?district=पुणे`);
    console.log(`✅ Found ${districtFilter.data.total} records in district "पुणे"`);
    districtFilter.data.data.forEach((record, index) => {
      console.log(`   ${index + 1}. District: ${record.district}, Taluka: ${record.taluka}, Village: ${record.village}`);
    });

    // Test 5: Filter by taluka
    console.log('\n5️⃣  Filtering by taluka "हवेली"...');
    const talukaFilter = await axios.get(`${API_BASE_URL}/jmr?taluka=हवेली`);
    console.log(`✅ Found ${talukaFilter.data.total} records in taluka "हवेली"`);
    talukaFilter.data.data.forEach((record, index) => {
      console.log(`   ${index + 1}. Taluka: ${record.taluka}, Village: ${record.village}`);
    });

    // Test 6: Filter by village
    console.log('\n6️⃣  Filtering by village "शिवाजीनगर"...');
    const villageFilter = await axios.get(`${API_BASE_URL}/jmr?village=शिवाजीनगर`);
    console.log(`✅ Found ${villageFilter.data.total} records in village "शिवाजीनगर"`);
    villageFilter.data.data.forEach((record, index) => {
      console.log(`   ${index + 1}. Village: ${record.village}, Owner: ${record.owner_name}`);
    });

    // Test 7: Filter by status
    console.log('\n7️⃣  Filtering by status "approved"...');
    const statusFilter = await axios.get(`${API_BASE_URL}/jmr?status=approved`);
    console.log(`✅ Found ${statusFilter.data.total} records with status "approved"`);
    statusFilter.data.data.forEach((record, index) => {
      console.log(`   ${index + 1}. Status: ${record.status}, Survey: ${record.survey_number}`);
    });

    // Test 8: Combined filters
    console.log('\n8️⃣  Combined search - District "पुणे" + Status "submitted"...');
    const combinedFilter = await axios.get(`${API_BASE_URL}/jmr?district=पुणे&status=submitted`);
    console.log(`✅ Found ${combinedFilter.data.total} records in पुणे district with submitted status`);
    combinedFilter.data.data.forEach((record, index) => {
      console.log(`   ${index + 1}. District: ${record.district}, Status: ${record.status}, Survey: ${record.survey_number}`);
    });

    // Test 9: Pagination
    console.log('\n9️⃣  Testing pagination (page 1, limit 2)...');
    const paginationTest = await axios.get(`${API_BASE_URL}/jmr?page=1&limit=2`);
    console.log(`✅ Page 1: Showing ${paginationTest.data.count} records out of ${paginationTest.data.total} total`);
    console.log(`📄 Pagination: Page ${paginationTest.data.pagination.page} of ${paginationTest.data.pagination.pages}`);

    // Test 10: Get single record by ID
    if (allRecords.data.data.length > 0) {
      const firstRecordId = allRecords.data.data[0]._id;
      console.log(`\n🔟 Getting single record by ID: ${firstRecordId}...`);
      const singleRecord = await axios.get(`${API_BASE_URL}/jmr/${firstRecordId}`);
      console.log(`✅ Record found:`);
      console.log(`   Survey: ${singleRecord.data.data.survey_number}`);
      console.log(`   Owner: ${singleRecord.data.data.owner_name}`);
      console.log(`   Village: ${singleRecord.data.data.village}`);
      console.log(`   Total Compensation: ₹${singleRecord.data.data.total_compensation}`);
    }

    console.log('\n🎉 JMR Search Demonstration Complete!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error during JMR search demonstration:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the demonstration
demonstrateJMRSearch();