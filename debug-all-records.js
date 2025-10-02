// Debug script to check all records without filters
const API_BASE_URL = 'http://localhost:5000/api';
const testProjectId = '68da6edf579af093415f639e'; // Railway Overbridge project

async function debugAllRecords() {
  console.log('🔍 Debugging all landrecords2 data...');
  
  try {
    // Test 1: Get all records without is_active filter
    console.log('📡 Testing: /api/landowners2/list (no project filter)');
    const response1 = await fetch(`${API_BASE_URL}/landowners2/list`);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Total records in landrecords2:', data1.count);
      
      // Show all project_ids
      const projectIds = data1.records.map(r => r.project_id);
      const uniqueProjectIds = [...new Set(projectIds)];
      console.log('📋 Unique project_ids found:', uniqueProjectIds);
      
      // Count by project
      const projectCounts = {};
      data1.records.forEach(record => {
        const pid = record.project_id;
        projectCounts[pid] = (projectCounts[pid] || 0) + 1;
      });
      console.log('📊 Records by project:');
      Object.entries(projectCounts).forEach(([pid, count]) => {
        console.log(`  - ${pid}: ${count} records`);
      });
    }
    
    // Test 2: Check if records exist for Railway Overbridge project
    console.log('\n📡 Testing: Direct MongoDB query simulation');
    
    // Let's try to find records with string project_id
    console.log('🔍 Looking for records with project_id as string...');
    
    // Test 3: Try different variations of the project_id
    const testQueries = [
      '68da6edf579af093415f639e',  // Original string
      '68da6edf579af093415f639e',  // As ObjectId string
    ];
    
    for (const pid of testQueries) {
      console.log(`\nTesting with project_id: ${pid}`);
      const response = await fetch(`${API_BASE_URL}/landowners2/${pid}`);
      console.log(`  Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  Found: ${data.count} records`);
      } else {
        const error = await response.text();
        console.log(`  Error: ${error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

debugAllRecords();