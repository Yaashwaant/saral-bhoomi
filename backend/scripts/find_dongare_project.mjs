import mongoose from 'mongoose';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';

// Connect to MongoDB
await mongoose.connect('mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster');
console.log('Connected to MongoDB');

try {
    // Find Dongare records - try different search patterns
    console.log('Searching for Dongare records...');
    
    const dongareRecords1 = await MongoLandownerRecord.find({
        village: { $regex: /dongare/i },
        is_active: true
    });
    console.log(`Found ${dongareRecords1.length} records with village containing 'dongare'`);
    
    const dongareRecords2 = await MongoLandownerRecord.find({
        village: 'dongare',
        is_active: true
    });
    console.log(`Found ${dongareRecords2.length} records with village exactly 'dongare'`);
    
    const dongareRecords3 = await MongoLandownerRecord.find({
        landowner_name: { $regex: /dongare/i },
        is_active: true
    });
    console.log(`Found ${dongareRecords3.length} records with landowner_name containing 'dongare'`);
    
    // Check all unique villages
    const allRecords = await MongoLandownerRecord.find({ is_active: true });
    const uniqueVillages = [...new Set(allRecords.map(record => record.village))];
    console.log('\nAll unique villages in database:');
    uniqueVillages.forEach(village => console.log(`  - ${village}`));
    
    // Use the first search result
    const dongareRecords = dongareRecords1;
    
    console.log(`Found ${dongareRecords.length} Dongare records`);
    
    if (dongareRecords.length > 0) {
        // Get unique project IDs
        const projectIds = [...new Set(dongareRecords.map(record => record.project_id?.toString()))];
        console.log('Project IDs for Dongare records:', projectIds);
        
        // Get project details
        for (const projectId of projectIds) {
            if (projectId) {
                const project = await MongoProject.findById(projectId);
                console.log(`\nProject ${projectId}:`);
                console.log('  Name:', project?.name || 'Unknown');
                console.log('  Project Number:', project?.projectNumber || 'Unknown');
                
                // Count records in this project
                const recordCount = dongareRecords.filter(r => r.project_id?.toString() === projectId).length;
                console.log('  Dongare records:', recordCount);
                
                // Check payment status distribution
                const projectDongareRecords = dongareRecords.filter(r => r.project_id?.toString() === projectId);
                const statusCounts = {};
                projectDongareRecords.forEach(record => {
                    const status = record.payment_status || 'unknown';
                    statusCounts[status] = (statusCounts[status] || 0) + 1;
                });
                console.log('  Payment status distribution:', statusCounts);
            }
        }
    }
    
} catch (error) {
    console.error('Error:', error);
} finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
}