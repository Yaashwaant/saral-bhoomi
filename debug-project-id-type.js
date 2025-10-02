// Debug script to check project_id data types
const API_BASE_URL = 'http://localhost:5000/api';

async function debugProjectIdTypes() {
  console.log('🔍 Debugging project_id data types...');
  
  try {
    // First, let's get the list of all records to see the data structure
    console.log('📡 Testing: /api/landowners2/list');
    const response = await fetch(`${API_BASE_URL}/landowners2/list`);
    
    console.log('✅ Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Total records found:', data.count);
      
      if (data.records && data.records.length > 0) {
        // Check first few records for project_id types
        console.log('🔍 Checking project_id types in first 5 records:');
        data.records.slice(0, 5).forEach((record, index) => {
          console.log(`Record ${index + 1}:`);
          console.log('  - project_id:', record.project_id);
          console.log('  - project_id type:', typeof record.project_id);
          console.log('  - Village:', record.Village);
          console.log('  - अ_क्र:', record.अ_क्र);
          console.log('  - खातेदाराचे_नांव:', record.खातेदाराचे_नांव);
          console.log('---');
        });
        
        // Count records by project_id
        const projectCounts = {};
        data.records.forEach(record => {
          const pid = record.project_id;
          projectCounts[pid] = (projectCounts[pid] || 0) + 1;
        });
        
        console.log('📈 Records by project_id:');
        Object.entries(projectCounts).forEach(([pid, count]) => {
          console.log(`  - ${pid}: ${count} records`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

debugProjectIdTypes();