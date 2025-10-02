import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

async function testProjectNumbersDetailed() {
  try {
    console.log('🔍 Detailed investigation of project number issues...\n');
    
    // Get all projects
    const projectsResponse = await axios.get(`${API_BASE_URL}/api/projects`);
    const projects = projectsResponse.data.data;
    
    console.log(`📊 Found ${projects.length} projects:`);
    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. Project: ${project.schemeName}`);
      console.log(`   ID: ${project.id}`);
      console.log(`   Type: ${project.type}`);
      console.log(`   Status: ${project.status?.overall}`);
      
      // Check for projectNumber field
      if (project.projectNumber) {
        console.log(`   Project Number: ${project.projectNumber}`);
      } else {
        console.log(`   ⚠️  Missing projectNumber field`);
      }
    });
    
    // Test creating a record with minimal required fields
    console.log('\n🔍 Testing record creation with minimal required fields...');
    const minimalRecord = {
      अ_क्र: "9999",
      खातेदाराचे_नांव: "Test Landowner",
      project_id: projects[0].id // Use the actual project ID
    };
    
    try {
      const createResponse = await axios.post(`${API_BASE_URL}/api/landowners2`, minimalRecord, {
        headers: {
          'Authorization': 'Bearer demo-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Minimal record created successfully:', createResponse.data);
    } catch (error) {
      console.log('❌ Minimal record creation failed:');
      console.log('   Error message:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('   Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
      if (error.response?.data?.stack) {
        console.log('   Stack trace:', error.response?.data?.stack);
      }
    }
    
    // Test with more fields
    console.log('\n🔍 Testing record creation with more fields...');
    const detailedRecord = {
      अ_क्र: "9998",
      खातेदाराचे_नांव: "Test Landowner Detailed",
      Village: "Test Village",
      Taluka: "Test Taluka", 
      District: "Test District",
      project_id: projects[0].id,
      survey_number: "123",
      area: 100,
      land_classification: "Agricultural"
    };
    
    try {
      const createResponse = await axios.post(`${API_BASE_URL}/api/landowners2`, detailedRecord, {
        headers: {
          'Authorization': 'Bearer demo-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Detailed record created successfully:', createResponse.data);
    } catch (error) {
      console.log('❌ Detailed record creation failed:');
      console.log('   Error message:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('   Validation errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
    }
    
    // Check what fields are actually required by examining existing records
    console.log('\n🔍 Examining existing record structure...');
    try {
      const recordsResponse = await axios.get(`${API_BASE_URL}/api/landowners2/68da6edf579af093415f639e`);
      const records = recordsResponse.data.data;
      if (records.length > 0) {
        const firstRecord = records[0];
        console.log('   Existing record fields:');
        Object.keys(firstRecord).forEach(key => {
          console.log(`     ${key}: ${firstRecord[key]}`);
        });
      }
    } catch (error) {
      console.log('❌ Could not fetch existing records:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error in detailed project numbers test:', error.message);
  }
}

testProjectNumbersDetailed();