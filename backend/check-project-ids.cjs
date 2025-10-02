const axios = require('axios');

async function checkProjectIds() {
  try {
    console.log('Fetching project IDs from dashboard data...\n');
    
    const response = await axios.get('http://localhost:5000/api/landowners2-english/list');
    const data = response.data;
    
    if (data.success) {
      const activeRecords = data.records.filter(r => r.is_active);
      const projectIds = [...new Set(activeRecords.map(r => r.project_id))];
      
      console.log('Unique project_id values in dashboard data:');
      projectIds.forEach((id, index) => {
        console.log(`${index + 1}. ${id}`);
      });
      console.log(`\nTotal unique project IDs: ${projectIds.length}`);
      console.log(`Total active records: ${activeRecords.length}`);
      
      // Show distribution of records per project
      console.log('\nRecords per project:');
      const projectCounts = {};
      activeRecords.forEach(r => {
        projectCounts[r.project_id] = (projectCounts[r.project_id] || 0) + 1;
      });
      
      Object.entries(projectCounts).forEach(([id, count]) => {
        console.log(`  ${id}: ${count} records`);
      });
      
    } else {
      console.error('Failed to fetch data:', data.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProjectIds();