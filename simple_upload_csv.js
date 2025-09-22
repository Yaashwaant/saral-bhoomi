// Simplified CSV upload script
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const API_BASE_URL = 'http://localhost:5000/api';
const CSV_FILE_PATH = 'd:\\Desk_backup\\bhoomi saral mvp\\new_saral_bhoomi\\saral-bhoomi\\Chandrapada New 20.01.23-.csv';

async function main() {
    try {
        console.log('🚀 Simple CSV Upload Tool');
        console.log('=========================');
        
        // Get existing projects
        console.log('🔍 Getting existing projects...');
        const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        if (!projectsResponse.ok) {
            throw new Error('Failed to get projects');
        }
        
        const projectsData = await projectsResponse.json();
        console.log(`📋 Found ${projectsData.data.length} projects`);
        
        // Use the first project or create a demo one
        let projectId;
        if (projectsData.data.length > 0) {
            projectId = projectsData.data[0]._id;
            console.log(`✅ Using existing project: ${projectsData.data[0].name}`);
        } else {
            // Create a simple demo project
            console.log('🆕 Creating demo project...');
            const createResponse = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer demo-jwt-token',
                    'x-demo-role': 'officer'
                },
                body: JSON.stringify({
                    name: 'Chandrapada Railway Project',
                    description: 'Railway land acquisition project',
                    location: 'Chandrapada, Vasai, Palghar',
                    status: 'active'
                })
            });
            
            if (createResponse.ok) {
                const newProject = await createResponse.json();
                projectId = newProject.data._id;
                console.log(`✅ Created project: ${newProject.data.name}`);
            } else {
                throw new Error('Failed to create project');
            }
        }
        
        // Check if file exists
        if (!fs.existsSync(CSV_FILE_PATH)) {
            throw new Error(`CSV file not found at: ${CSV_FILE_PATH}`);
        }
        
        console.log('📄 Preparing CSV upload...');
        
        // Create form data
        const formData = new FormData();
        formData.append('file', fs.createReadStream(CSV_FILE_PATH), {
            filename: 'Chandrapada-New-20.01.23.csv',
            contentType: 'text/csv; charset=utf-8'
        });
        formData.append('overwrite', 'true');
        
        console.log(`🚀 Uploading CSV to project: ${projectId}`);
        
        // Upload CSV
        const uploadResponse = await fetch(`${API_BASE_URL}/csv/upload/${projectId}`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            },
            body: formData
        });
        
        if (uploadResponse.ok) {
            const result = await uploadResponse.json();
            console.log('\n✅ Upload Successful!');
            console.log('📊 Results:');
            console.log(`- Records processed: ${result.total || 'N/A'}`);
            console.log(`- Successfully uploaded: ${result.uploaded || 'N/A'}`);
            console.log(`- Errors: ${result.errors ? result.errors.length : 0}`);
            
            if (result.errors && result.errors.length > 0) {
                console.log('\n⚠️ Some errors occurred:');
                result.errors.slice(0, 3).forEach((error, index) => {
                    console.log(`  ${index + 1}. ${error}`);
                });
            }
            
            console.log('\n🎉 CSV data has been uploaded to the database!');
            console.log('💡 You can now view the records in the Land Records Manager');
            
        } else {
            const errorText = await uploadResponse.text();
            console.error('❌ Upload failed:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n🔧 Make sure:');
        console.log('1. Backend server is running on port 5000');
        console.log('2. CSV file exists at the specified path');
    }
}

main().catch(console.error);