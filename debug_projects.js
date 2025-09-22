// Debug script to check projects and upload status
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

async function main() {
    try {
        console.log('🔍 Debugging Projects and Upload System');
        console.log('======================================');
        
        // Get projects
        const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            console.log('\n📋 Projects:');
            projectsData.data.forEach((project, index) => {
                console.log(`  ${index + 1}. ${project.name || 'Unnamed'} (ID: ${project._id})`);
            });
            
            if (projectsData.data.length > 0) {
                const projectId = projectsData.data[0]._id;
                console.log(`\n🎯 Using project ID: ${projectId}`);
                
                // Check existing landowner records
                const landownersResponse = await fetch(`${API_BASE_URL}/landowners/${projectId}`, {
                    headers: {
                        'Authorization': 'Bearer demo-jwt-token',
                        'x-demo-role': 'officer'
                    }
                });
                
                if (landownersResponse.ok) {
                    const landownersData = await landownersResponse.json();
                    console.log(`\n📊 Existing landowner records: ${landownersData.data.length}`);
                    
                    if (landownersData.data.length > 0) {
                        console.log('\n🔍 Sample records:');
                        landownersData.data.slice(0, 3).forEach((record, index) => {
                            console.log(`  ${index + 1}. ${record.landowner_name} - Survey: ${record.survey_number}`);
                        });
                    }
                }
                
                // Check template download
                console.log('\n📄 Testing CSV template download...');
                const templateResponse = await fetch(`${API_BASE_URL}/csv/template`, {
                    headers: {
                        'Authorization': 'Bearer demo-jwt-token',
                        'x-demo-role': 'officer'
                    }
                });
                
                if (templateResponse.ok) {
                    console.log('✅ CSV template endpoint is working');
                } else {
                    console.log('❌ CSV template endpoint failed');
                }
                
                return projectId;
            }
        } else {
            console.log('❌ Failed to get projects');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main().catch(console.error);