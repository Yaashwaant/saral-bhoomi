import fetch from 'node-fetch';

console.log('Testing API endpoint...');

try {
    const response = await fetch('http://localhost:5000/api/landowners/68da854996a3d559f5005b5c');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Data count:', data.count);
    console.log('Data length:', data.data?.length);
    
    // Find Dongare records - check all village values
    console.log('\nChecking village values:');
    const uniqueVillages = [...new Set(data.data?.map(record => record.village))];
    console.log('Unique villages:', uniqueVillages);
    
    const dongareRecords = data.data?.filter(record => 
        record.village && record.village.toLowerCase().includes('dongare')
    ) || [];
    
    console.log('Dongare records found:', dongareRecords.length);
    
    if (data.data?.length > 0) {
        console.log('\nFirst record sample:');
        const firstRecord = data.data[0];
        console.log('Village:', firstRecord.village);
        console.log('Payment Status (DB):', firstRecord.payment_status);
        console.log('Payment Status (API):', firstRecord.paymentStatus);
        console.log('Project ID:', firstRecord.project_id);
        
        // Check for completed payments in all records
        const completedPayments = data.data.filter(record => 
            record.paymentStatus === 'success'
        );
        console.log('\nCompleted payments (paymentStatus === "success"):', completedPayments.length);
        
        // Check for completed in DB
        const completedInDB = data.data.filter(record => 
            record.payment_status === 'completed'
        );
        console.log('Completed in DB (payment_status === "completed"):', completedInDB.length);
        
        if (completedPayments.length > 0) {
            console.log('\nFirst completed payment:');
            console.log('Village:', completedPayments[0].village);
            console.log('Payment Status (DB):', completedPayments[0].payment_status);
            console.log('Payment Status (API):', completedPayments[0].paymentStatus);
        }
    }
    
} catch (error) {
    console.error('Error:', error.message);
}