// Debug script to investigate integrity mismatches
// Run this from root directory: node debug_integrity_script.js

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

async function debugIntegrityForSurvey(surveyNumber) {
    try {
        console.log(`\n🔍 Debugging integrity for survey: ${surveyNumber}`);
        console.log('=' + '='.repeat(50));
        
        // 1. Get blockchain search results
        const searchResponse = await fetch(`${API_BASE_URL}/blockchain/search/${surveyNumber}`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log('\n📊 Search Results:');
            console.log('- Exists in Database:', searchData.existsInDatabase);
            console.log('- Exists on Blockchain:', searchData.existsOnBlockchain);
            console.log('- Overall Status:', searchData.overallStatus);
            console.log('- Status Message:', searchData.statusMessage);
        }
        
        // 2. Get detailed integrity verification
        const integrityResponse = await fetch(`${API_BASE_URL}/blockchain/verify-integrity/${surveyNumber}`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        if (integrityResponse.ok) {
            const integrityData = await integrityResponse.json();
            console.log('\n🔒 Integrity Verification:');
            console.log('- Is Valid:', integrityData.isValid);
            console.log('- Reason:', integrityData.reason);
            
            if (integrityData.data_integrity) {
                console.log('\n📋 Data Integrity by Section:');
                for (const [section, details] of Object.entries(integrityData.data_integrity)) {
                    console.log(`\n  ${section}:`);
                    console.log(`    - Is Valid: ${details.isValid}`);
                    console.log(`    - Stored Hash: ${details.storedHash || 'null'}`);
                    console.log(`    - Current Hash: ${details.currentHash || 'null'}`);
                    console.log(`    - Comparison Source: ${details.comparisonSource}`);
                    console.log(`    - Last Updated: ${details.lastUpdated || 'null'}`);
                    
                    if (!details.isValid) {
                        console.log(`    ❌ MISMATCH DETECTED in ${section}!`);
                    }
                }
            }
            
            if (integrityData.chain_integrity) {
                console.log('\n⛓️ Chain Integrity:');
                console.log('- Is Valid:', integrityData.chain_integrity.isValid);
                console.log('- Reason:', integrityData.chain_integrity.reason);
            }
        }
        
        // 3. Get complete survey data
        const surveyDataResponse = await fetch(`${API_BASE_URL}/blockchain/survey-complete-data/${surveyNumber}`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        if (surveyDataResponse.ok) {
            const surveyData = await surveyDataResponse.json();
            console.log('\n📄 Complete Survey Data Summary:');
            if (surveyData.data && surveyData.data.summary) {
                for (const [section, summary] of Object.entries(surveyData.data.summary)) {
                    console.log(`  ${section}: has_data=${summary.has_data}, record_count=${summary.record_count}`);
                }
            }
        }
        
    } catch (error) {
        console.error(`❌ Error debugging survey ${surveyNumber}:`, error);
    }
}

async function getAllSurveysAndDebug() {
    try {
        console.log('🚀 Starting Integrity Debug Analysis');
        console.log('=====================================');
        
        // Get surveys with blockchain status
        const surveysResponse = await fetch(`${API_BASE_URL}/blockchain/surveys-with-status?limit=10`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        if (surveysResponse.ok) {
            const surveysData = await surveysResponse.json();
            console.log(`\n📋 Found ${surveysData.data.length} surveys with blockchain status`);
            
            // Debug first few surveys
            for (let i = 0; i < Math.min(5, surveysData.data.length); i++) {
                const survey = surveysData.data[i];
                await debugIntegrityForSurvey(survey.survey_number);
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log('\n🎯 Debug Analysis Complete!');
        console.log('\n💡 Common reasons for "Compromised" status:');
        console.log('1. Hash algorithm mismatch between old and new blockchain entries');
        console.log('2. Data structure changes in database vs blockchain storage');
        console.log('3. Missing fields in blockchain entries vs current database state');
        console.log('4. ObjectId serialization differences');
        console.log('5. Date/timestamp formatting differences');
        
    } catch (error) {
        console.error('❌ Error in debug analysis:', error);
    }
}

// Run the debug analysis
getAllSurveysAndDebug().catch(console.error);