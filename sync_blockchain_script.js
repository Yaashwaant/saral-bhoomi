// Script to sync all records to blockchain
// Run this from the backend directory: node sync_blockchain_script.js

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000/api';

async function syncAllRecordsToBlockchain() {
    try {
        console.log('🔄 Starting blockchain synchronization...');
        
        // Option 1: Bulk sync all surveys
        const response = await fetch(`${API_BASE_URL}/blockchain/bulk-sync-all-surveys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            },
            body: JSON.stringify({
                officer_id: 'demo-officer',
                project_id: 'demo-project'
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Blockchain sync completed successfully!');
            console.log('📊 Results:', result);
            return result;
        } else {
            const error = await response.text();
            console.error('❌ Sync failed:', error);
            return null;
        }
    } catch (error) {
        console.error('❌ Error during sync:', error);
        return null;
    }
}

// Alternative: Rebuild the entire ledger with latest data
async function rebuildLedger() {
    try {
        console.log('🔄 Rebuilding blockchain ledger...');
        
        const response = await fetch(`${API_BASE_URL}/blockchain/rebuild-ledger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer demo-jwt-token',
                'x-demo-role': 'officer'
            },
            body: JSON.stringify({
                officer_id: 'demo-officer',
                project_id: 'demo-project'
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Ledger rebuild completed successfully!');
            console.log('📊 Results:', result);
            return result;
        } else {
            const error = await response.text();
            console.error('❌ Rebuild failed:', error);
            return null;
        }
    } catch (error) {
        console.error('❌ Error during rebuild:', error);
        return null;
    }
}

// Run the sync
async function main() {
    console.log('🚀 Blockchain Sync Tool');
    console.log('=====================');
    
    // Try bulk sync first
    let result = await syncAllRecordsToBlockchain();
    
    if (!result) {
        console.log('🔄 Bulk sync failed, trying ledger rebuild...');
        result = await rebuildLedger();
    }
    
    if (result) {
        console.log('🎉 Blockchain synchronization completed!');
        console.log('💡 Your records should now show as "Verified" instead of "Pending"');
    } else {
        console.log('❌ Synchronization failed. Please check the backend logs.');
    }
}

main().catch(console.error);