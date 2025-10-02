import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testProjectNumbers() {
  try {
    console.log('🔍 Investigating project number issues...\n');
    
    // Get all projects
    const projectsResponse = await axios.get(`${API_BASE_URL}/api/projects`);
    const projects = projectsResponse.data.data;
    
    console.log(`📊 Found ${projects.length} projects:`);
    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. Project: ${project.schemeName}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Type: ${project.type}`);
      console.log(`   District: ${project.district}`);
      console.log(`   Taluka: ${project.taluka}`);
      console.log(`   Villages: ${project.villages?.join(', ')}`);
      console.log(`   Status: ${project.status?.overall}`);
      
      // Check for projectNumber field
      if (project.projectNumber) {
        console.log(`   Project Number: ${project.projectNumber}`);
      } else {
        console.log(`   ⚠️  Missing projectNumber field`);
      }
      
      // Check for other potential project identifier fields
      if (project.projectName) console.log(`   Project Name: ${project.projectName}`);
      if (project.schemeName) console.log(`   Scheme Name: ${project.schemeName}`);
    });
    
    // Test land records for each project
    console.log('\n🔍 Testing land records for each project...');
    for (const project of projects) {
      try {
        const recordsResponse = await axios.get(`${API_BASE_URL}/api/landowners2/${project.id}`);
        const records = recordsResponse.data.data;
        console.log(`\n✅ ${project.schemeName}: ${records.length} records`);
        
        if (records.length > 0) {
          const firstRecord = records[0];
          console.log(`   First record: ${firstRecord.खातेदाराचे_नांव}`);
          console.log(`   Village: ${firstRecord.Village}`);
          console.log(`   Project ID in record: ${firstRecord.project_id}`);
          
          // Check if project_id matches the project id
          if (firstRecord.project_id !== project.id) {
            console.log(`   ⚠️  Mismatch: Project ID ${project.id} vs Record project_id ${firstRecord.project_id}`);
          }
        }
      } catch (error) {
        console.log(`\n❌ ${project.schemeName}: Error fetching records - ${error.response?.data?.message || error.message}`);
      }
    }
    
    // Test creating a simple record with correct project reference
    console.log('\n🔍 Testing record creation with proper project reference...');
    const testRecord = {
      अ_क्र: "9999",
      खातेदाराचे_नांव: "Test Landowner",
      Village: "Test Village",
      Taluka: "Test Taluka", 
      District: "Test District",
      project_id: projects[0].id // Use the actual project ID
    };
    
    try {
      const createResponse = await axios.post(`${API_BASE_URL}/api/landowners2`, testRecord, {
        headers: {
          'Authorization': 'Bearer demo-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Record created successfully:', createResponse.data);
    } catch (error) {
      console.log('❌ Record creation failed:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('Validation errors:', error.response.data.errors);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in project numbers test:', error.message);
  }
}

testProjectNumbers();