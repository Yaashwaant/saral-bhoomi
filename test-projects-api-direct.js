import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testProjectsApiDirect() {
  try {
    console.log('🔄 Testing /api/projects endpoint directly...\n');
    
    // Test the projects API endpoint
    const response = await axios.get(`${API_BASE_URL}/api/projects`);
    
    console.log('📊 API Response Structure:');
    console.log('- Success:', response.data.success);
    console.log('- Count:', response.data.count);
    console.log('- Total:', response.data.total);
    console.log('- Data length:', response.data.data.length);
    console.log('');
    
    const projects = response.data.data;
    
    console.log('📋 All Projects in API Response:');
    projects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.projectName}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Scheme: ${project.schemeName}`);
      console.log(`   District: ${project.district}`);
      console.log(`   Taluka: ${project.taluka}`);
      console.log(`   Status: ${JSON.stringify(project.status)}`);
      console.log(`   isActive: ${project.isActive}`);
      console.log('');
    });
    
    // Specifically look for Railway Overbridge Project
    console.log('🔍 Looking for Railway Overbridge Project...');
    const railwayProject = projects.find(p => 
      p.id === '68da854996a3d559f5005b5c' || 
      p.projectName.toLowerCase().includes('railway') ||
      p.projectName.toLowerCase().includes('overbridge')
    );
    
    if (railwayProject) {
      console.log('✅ Railway Overbridge Project FOUND in API response:');
      console.log(JSON.stringify(railwayProject, null, 2));
    } else {
      console.log('❌ Railway Overbridge Project NOT FOUND in API response');
      console.log('🔍 Checking all project names for railway-related terms...');
      
      const railwayRelated = projects.filter(p => 
        p.projectName.toLowerCase().includes('railway') ||
        p.projectName.toLowerCase().includes('overbridge') ||
        p.projectName.toLowerCase().includes('rob') ||
        p.schemeName.toLowerCase().includes('railway')
      );
      
      if (railwayRelated.length > 0) {
        console.log('🔍 Found railway-related projects:');
        railwayRelated.forEach(p => {
          console.log(`- ${p.projectName} (${p.id})`);
        });
      } else {
        console.log('❌ No railway-related projects found in API response');
      }
    }
    
    // Test with specific query parameters
    console.log('\n🔄 Testing with query parameters...');
    const filteredResponse = await axios.get(`${API_BASE_URL}/api/projects?isActive=true`);
    console.log(`📊 Active projects only: ${filteredResponse.data.count} projects`);
    
    const allResponse = await axios.get(`${API_BASE_URL}/api/projects?limit=100`);
    console.log(`📊 All projects (limit 100): ${allResponse.data.count} projects`);
    
  } catch (error) {
    console.error('❌ Error testing projects API:', error.response?.data || error.message);
  }
}

testProjectsApiDirect();