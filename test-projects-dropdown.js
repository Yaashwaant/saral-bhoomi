import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testProjectsAndRecords() {
  try {
    console.log('🔄 Testing projects endpoint...');
    
    // Test fetching projects
    const projectsResponse = await axios.get(`${API_BASE_URL}/api/projects`);
    console.log('✅ Projects fetched successfully:');
    console.log('📊 Full response structure:', Object.keys(projectsResponse.data));
    
    const projects = Array.isArray(projectsResponse.data) ? projectsResponse.data : projectsResponse.data.data || [];
    console.log(`📊 Found ${projects.length} projects`);
    
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.projectName || project.name} (${project._id || project.id})`);
      console.log(`   Scheme: ${project.schemeName}`);
      console.log(`   Location: ${project.district}, ${project.taluka}`);
      console.log(`   Status: ${project.status}`);
      console.log('');
    });

    // Test fetching records for the first project
    if (projects.length > 0) {
      const firstProject = projects[0];
      console.log(`🔄 Testing records for project: ${firstProject.projectName}`);
      
      try {
        const recordsResponse = await axios.get(`${API_BASE_URL}/api/landowners2/${firstProject._id}`);
        console.log('✅ Records fetched successfully:');
        console.log(`📊 Found ${recordsResponse.data.data.length} records`);
        
        if (recordsResponse.data.data.length > 0) {
          console.log('📝 Sample record fields:');
          const sampleRecord = recordsResponse.data.data[0];
          const fields = Object.keys(sampleRecord).slice(0, 5);
          fields.forEach(field => {
            console.log(`   ${field}: ${sampleRecord[field]}`);
          });
        }
      } catch (error) {
        console.log('❌ Error fetching records:', error.response?.data || error.message);
      }
    }

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.response?.data || error.message);
  }
}

testProjectsAndRecords();