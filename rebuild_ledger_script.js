// Script to rebuild blockchain ledger with consistent hashing
// Run this from root directory: node rebuild_ledger_script.js

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

async function rebuildBlockchainLedger() {
    try {
        console.log('🔄 Starting Blockchain Ledger Rebuild...');
        console.log('=========================================');
        
        // Step 1: Get all survey numbers first
        const surveysResponse = await fetch(`${API_BASE_URL}/blockchain/surveys-with-status?limit=100`, {
            headers: {
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            }
        });
        
        let surveyNumbers = [];
        if (surveysResponse.ok) {
            const surveysData = await surveysResponse.json();
            surveyNumbers = surveysData.data.map(s => s.survey_number);
            console.log(`📋 Found ${surveyNumbers.length} surveys to rebuild`);
        }
        
        // Step 2: Rebuild the ledger with current data and hash algorithms
        console.log('\n🔧 Rebuilding ledger with current data...');
        
        const rebuildResponse = await fetch(`${API_BASE_URL}/blockchain/rebuild-ledger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            },
            body: JSON.stringify({
                officer_id: 'demo-officer',
                project_id: 'demo-project',
                survey_numbers: surveyNumbers // Specify exact surveys to rebuild
            })
        });
        
        if (rebuildResponse.ok) {
            const result = await rebuildResponse.json();
            console.log('\n✅ Ledger rebuild completed successfully!');
            console.log('📊 Results:');
            console.log(`- Total Surveys: ${result.total_surveys}`);
            console.log(`- Successfully Rebuilt: ${result.rebuilt}`);
            console.log(`- Failed: ${result.failed}`);
            console.log(`- Deleted Old Blocks: ${result.deleted_blocks}`);
            
            if (result.failed > 0) {
                console.log('\n❌ Failed surveys:');
                result.results.filter(r => !r.success).forEach(r => {
                    console.log(`  - ${r.survey_number}: ${r.error}`);
                });
            }
            
            return result;
        } else {
            const error = await rebuildResponse.text();
            console.error('❌ Rebuild failed:', error);
            return null;
        }
    } catch (error) {
        console.error('❌ Error during rebuild:', error);
        return null;
    }
}

async function verifyRebuildSuccess() {
    try {
        console.log('\n🔍 Verifying rebuild success...');
        
        // Test a few surveys to make sure they're now verified
        const testSurveys = ['67', '125/1', '124/1', '123/2', '123/1'];
        
        for (const surveyNumber of testSurveys) {
            try {
                const integrityResponse = await fetch(`${API_BASE_URL}/blockchain/verify-integrity/${surveyNumber}`, {
                    headers: {
                        'Authorization': 'Bearer demo-jwt-token',
                        'x-demo-role': 'officer'
                    }
                });
                
                if (integrityResponse.ok) {
                    const integrityData = await integrityResponse.json();
                    const status = integrityData.isValid ? '✅ Verified' : '❌ Still Compromised';
                    console.log(`  ${surveyNumber}: ${status}`);
                    
                    if (!integrityData.isValid) {
                        console.log(`    Reason: ${integrityData.reason}`);
                    }
                } else {
                    console.log(`  ${surveyNumber}: ⚠️ Could not verify`);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.log(`  ${surveyNumber}: ❌ Error - ${error.message}`);
            }
        }
    } catch (error) {
        console.error('❌ Error during verification:', error);
    }
}

async function main() {
    console.log('🚀 Blockchain Integrity Fix Tool');
    console.log('================================');
    console.log('This tool will rebuild the blockchain ledger with consistent hashing');
    console.log('to fix "Compromised" status issues.\n');
    
    // Step 1: Rebuild the ledger
    const rebuildResult = await rebuildBlockchainLedger();
    
    if (rebuildResult && rebuildResult.rebuilt > 0) {
        // Step 2: Verify the fix worked
        await verifyRebuildSuccess();
        
        console.log('\n🎉 Blockchain Ledger Rebuild Complete!');
        console.log('💡 Your records should now show as "Verified" instead of "Compromised"');
        console.log('🔄 Please refresh your Land Records page to see the updated status');
    } else {
        console.log('\n❌ Rebuild failed. Please check the backend logs for more details.');
    }
}

main().catch(console.error);