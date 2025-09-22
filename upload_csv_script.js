// Script to upload the Chandrapada CSV file to the database
// Run this from root directory: node upload_csv_script.js

import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_BASE_URL = 'http://localhost:5000/api';
const CSV_FILE_PATH = 'd:\\Desk_backup\\bhoomi saral mvp\\new_saral_bhoomi\\saral-bhoomi\\Chandrapada New 20.01.23-.csv';

async function getOrCreateProject() {
    try {
        console.log('🔍 Checking for existing projects...');
        
        // Get all projects first
        const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        if (projectsResponse.ok) {
            const projectsData = await projectsResponse.json();
            console.log(`📋 Found ${projectsData.data.length} existing projects`);
            
            // Look for a railway project
            const railwayProject = projectsData.data.find(p => 
                p.name && (
                    p.name.includes('रेल्वे') || 
                    p.name.includes('Railway') || 
                    p.name.includes('फ्रेट कॉरीडोर') ||
                    p.name.includes('चंद्रपाडा')
                )
            );
            
            if (railwayProject) {
                console.log(`✅ Found existing railway project: ${railwayProject.name}`);
                return railwayProject._id;
            }
        }
        
        // Create new project if none found
        console.log('🆕 Creating new railway project...');
        
        const newProjectResponse = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            },
            body: JSON.stringify({
                name: 'वेस्टर्न डेडिकेटेड फ्रेट कॉरीडोर रेल्वे उड्डाणपुल प्रकल्प - चंद्रपाडा',
                description: 'Western Dedicated Freight Corridor Railway Flyover Project - Chandrapada village land acquisition',
                location: 'चंद्रपाडा, ता.वसई, जि. पालघर',
                status: 'active',
                start_date: '2023-01-20',
                estimated_end_date: '2024-12-31'
            })
        });
        
        if (newProjectResponse.ok) {
            const newProject = await newProjectResponse.json();
            console.log(`✅ Created new project: ${newProject.data.name}`);
            return newProject.data._id;
        } else {
            throw new Error('Failed to create project');
        }
    } catch (error) {
        console.error('❌ Error with project:', error);
        throw error;
    }
}

async function uploadCSVFile(projectId) {
    try {
        console.log('\n📄 Preparing CSV file upload...');
        
        // Check if file exists
        if (!fs.existsSync(CSV_FILE_PATH)) {
            throw new Error(`CSV file not found at: ${CSV_FILE_PATH}`);
        }
        
        // Get file size
        const fileStats = fs.statSync(CSV_FILE_PATH);
        console.log(`📊 File size: ${(fileStats.size / 1024).toFixed(2)} KB`);
        
        // Create form data
        const formData = new FormData();
        formData.append('file', fs.createReadStream(CSV_FILE_PATH), {
            filename: 'Chandrapada New 20.01.23-.csv',
            contentType: 'text/csv'
        });
        formData.append('overwrite', 'true');
        formData.append('assignToAgent', 'false');
        formData.append('generateNotice', 'false');
        
        console.log(`🚀 Uploading CSV to project ID: ${projectId}`);
        console.log('🔄 Starting upload...');
        
        // Upload CSV file
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
            console.log('\n✅ CSV Upload Successful!');
            console.log('📊 Upload Results:');
            console.log(`- Total records processed: ${result.total || 'N/A'}`);
            console.log(`- Successfully uploaded: ${result.uploaded || 'N/A'}`);
            console.log(`- Errors: ${result.errors ? result.errors.length : 0}`);
            
            if (result.errors && result.errors.length > 0) {
                console.log('\n⚠️ Upload Errors:');
                result.errors.slice(0, 5).forEach((error, index) => {
                    console.log(`  ${index + 1}. ${error}`);
                });
                if (result.errors.length > 5) {
                    console.log(`  ... and ${result.errors.length - 5} more errors`);
                }
            }
            
            return result;
        } else {
            const errorData = await uploadResponse.text();
            console.error('❌ Upload failed:', errorData);
            throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
    } catch (error) {
        console.error('❌ Error uploading CSV:', error);
        throw error;
    }
}

async function createBlockchainEntries(surveyNumbers) {
    try {
        if (!surveyNumbers || surveyNumbers.length === 0) {
            console.log('⚠️ No survey numbers provided for blockchain creation');
            return;
        }
        
        console.log(`\n🔗 Creating blockchain entries for ${surveyNumbers.length} surveys...`);
        
        let successful = 0;
        let failed = 0;
        
        for (const surveyNumber of surveyNumbers) {
            try {
                const blockchainResponse = await fetch(`${API_BASE_URL}/blockchain/create-or-update-survey-complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer demo-jwt-token',
                        'x-demo-role': 'officer'
                    },
                    body: JSON.stringify({
                        survey_number: surveyNumber,
                        officer_id: 'demo-officer',
                        project_id: 'railway-project',
                        remarks: `Blockchain entry for Chandrapada railway project survey ${surveyNumber}`
                    })
                });
                
                if (blockchainResponse.ok) {
                    successful++;
                } else {
                    failed++;
                    console.log(`❌ Failed to create blockchain for survey ${surveyNumber}`);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                failed++;
                console.log(`❌ Error creating blockchain for survey ${surveyNumber}:`, error.message);
            }
        }
        
        console.log(`\n✅ Blockchain creation completed:`);
        console.log(`- Successful: ${successful}`);
        console.log(`- Failed: ${failed}`);
    } catch (error) {
        console.error('❌ Error creating blockchain entries:', error);
    }
}

async function main() {
    try {
        console.log('🚀 Chandrapada CSV Upload Tool');
        console.log('==============================');
        console.log('This tool will upload the Chandrapada railway project CSV data to the database.\n');
        
        // Step 1: Get or create project
        const projectId = await getOrCreateProject();
        
        // Step 2: Upload CSV file
        const uploadResult = await uploadCSVFile(projectId);
        
        // Step 3: Create blockchain entries (if successful)
        if (uploadResult.survey_numbers && uploadResult.survey_numbers.length > 0) {
            await createBlockchainEntries(uploadResult.survey_numbers);
        }
        
        console.log('\n🎉 Upload Process Completed!');
        console.log('💡 You can now view the uploaded records in the Land Records Manager');
        console.log('🔄 Please refresh your browser to see the new data');
        
    } catch (error) {
        console.error('\n❌ Upload process failed:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Make sure the backend server is running on port 5000');
        console.log('2. Check if the CSV file path is correct');
        console.log('3. Ensure the file is not locked by another application');
    }
}

main().catch(console.error);