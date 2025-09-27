import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/saral_bhoomi';

console.log('=== Ghol Village Data Verification ===');
console.log('Using MongoDB URI:', MONGODB_URI);

try {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Dynamic import to avoid model registration issues
  const { default: EnhancedJMRRecord } = await import('./models/mongo/EnhancedJMRRecord.js');
  
  const total = await EnhancedJMRRecord.countDocuments();
  console.log('Total EnhancedJMRRecord documents:', total);
  
  const gholRecords = await EnhancedJMRRecord.find({ village: 'घोळ' });
  console.log('Ghol village records:', gholRecords.length);
  
  if (gholRecords.length > 0) {
    console.log('\nFirst record sample:');
    console.log('- Village:', gholRecords[0].village);
    console.log('- Landowner:', gholRecords[0].landowner_name);
    console.log('- Acquired area:', gholRecords[0].acquired_area);
    console.log('- Final payable:', gholRecords[0].final_payable_amount);
    console.log('- Section 26 compensation:', gholRecords[0].section_26_compensation);
    console.log('- Measurement date:', gholRecords[0].measurement_date);
  }
  
  console.log('\n=== All Ghol Records ===');
  gholRecords.forEach((record, index) => {
    console.log(`${index + 1}. ${record.landowner_name} - Area: ${record.acquired_area} hectares - Compensation: ₹${record.final_payable_amount}`);
  });
  
  await mongoose.disconnect();
  console.log('\nVerification completed successfully!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}