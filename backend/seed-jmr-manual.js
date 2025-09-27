// Seed script for JMR records with manual entry fields and multiple landowners
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EnhancedJMRRecord from './models/mongo/EnhancedJMRRecord.js';

dotenv.config({ path: './.env' });

// Connect to MongoDB using the same configuration as other scripts
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Sample JMR records with manual entry fields and multiple landowners\n const jmrSeedData = [\n  {\n    serial_number: 'JMR-2024-001',\n    landowner_name: 'रामराव पांडुरंग पाटील',\n    father_husband_name: 'पांडुरंग पाटील',\n    new_survey_number: '42/A',\n    village: 'शिवाजीनगर',\n    taluka: 'हवेली',\n    district: 'पुणे',\n    land_classification: 'शेती',\n    land_category: 'शेती',\n    total_area_village_record: 3.0,\n    acquired_area_sqm_hectare: 2.5,\n    acquired_area: 2.5,\n    area_hectares: 2.5,\n    area_unit: 'hectare',\n    approved_rate_per_hectare: 10000000,\n    market_value_acquired_area: 25000000,\n    section_26_compensation: 25000000,\n    total_compensation_amount: 45000000,\n    solatium_100_percent: 22500000,\n    determined_compensation: 45000000,\n    total_final_compensation: 45000000,\n    final_payable_amount: 45000000,\n    status: 'approved',\n    data_format: 'manual_entry',\n    remarks: 'सर्व मोजमाप पूर्ण झाले आहे. मालकासह दोन साक्षीदार उपस्थित होते.',\n    project_id: new mongoose.Types.ObjectId('000000000000000000000001'),\n    officer_id: new mongoose.Types.ObjectId('000000000000000000000002'),\n    measurement_date: new Date()\n  },\n  {\n    serial_number: 'JMR-2024-002',\n    landowner_name: 'सुरेश गणपत देशमुख, अनिल गणपत देशमुख',\n    father_husband_name: 'गणपत देशमुख',\n    new_survey_number: '156/B',\n    village: 'किरकटवाडी',\n    taluka: 'मुळशी',\n    district: 'पुणे',\n    land_classification: 'बागायती',\n    land_category: 'बागायती',\n    total_area_village_record: 4.5,\n    acquired_area_sqm_hectare: 3.75,\n    acquired_area: 3.75,\n    area_hectares: 3.75,\n    area_unit: 'hectare',\n    approved_rate_per_hectare: 20000000,\n    market_value_acquired_area: 75000000,\n    section_26_compensation: 75000000,\n    total_compensation_amount: 90000000,\n    solatium_100_percent: 45000000,\n    determined_compensation: 90000000,\n    total_final_compensation: 90000000,\n    final_payable_amount: 90000000,\n    status: 'under_review',\n    data_format: 'manual_entry',\n    remarks: 'संयुक्त मालकी. दोन्ही भावांनी एकत्रित मोजमापास उपस्थिती दिली.',\n    project_id: new mongoose.Types.ObjectId('000000000000000000000001'),\n    officer_id: new mongoose.Types.ObjectId('000000000000000000000002'),\n    measurement_date: new Date()\n  },\n  {\n    serial_number: 'JMR-2024-003',\n    landowner_name: 'सीताबाई रामराव पाटील',\n    father_husband_name: 'रामराव पाटील',\n    new_survey_number: '89/C',\n    village: 'लोणीकंद',\n    taluka: 'हवेली',\n    district: 'पुणे',\n    land_classification: 'वन जमीन',\n    land_category: 'वन जमीन',\n    total_area_village_record: 2.0,\n    acquired_area_sqm_hectare: 1.25,\n    acquired_area: 1.25,\n    area_hectares: 1.25,\n    area_unit: 'hectare',\n    approved_rate_per_hectare: 15000000,\n    market_value_acquired_area: 18750000,\n    section_26_compensation: 18750000,\n    total_compensation_amount: 25000000,\n    solatium_100_percent: 12500000,\n    determined_compensation: 25000000,\n    total_final_compensation: 25000000,\n    final_payable_amount: 25000000,\n    status: 'pending',\n    data_format: 'manual_entry',\n    remarks: 'विधवा मालक. सर्व कागदपत्रे तपासणीसह पूर्ण.',\n    project_id: new mongoose.Types.ObjectId('000000000000000000000001'),\n    officer_id: new mongoose.Types.ObjectId('000000000000000000000002'),\n    measurement_date: new Date()\n  },\n  {\n    serial_number: 'JMR-2024-004',\n    landowner_name: 'गजानन किसनराव ढोके, संजय किसनराव ढोके, प्रवीण किसनराव ढोके',\n    father_husband_name: 'किसनराव ढोके',\n    new_survey_number: '234/D',\n    village: 'पिंपळे सौदागर',\n    taluka: 'चाकण',\n    district: 'पुणे',\n    land_classification: 'शेती',\n    land_category: 'शेती',\n    total_area_village_record: 6.0,\n    acquired_area_sqm_hectare: 5.0,\n    acquired_area: 5.0,\n    area_hectares: 5.0,\n    area_unit: 'hectare',\n    approved_rate_per_hectare: 20000000,\n    market_value_acquired_area: 100000000,\n    section_26_compensation: 100000000,\n    total_compensation_amount: 120000000,\n    solatium_100_percent: 60000000,\n    determined_compensation: 120000000,\n    total_final_compensation: 120000000,\n    final_payable_amount: 120000000,\n    status: 'approved',\n    data_format: 'manual_entry',\n    remarks: 'तीन बंधूंची संयुक्त मालकी. सर्व बंधूंनी स्वाक्षरी केली आहे.',\n    project_id: new mongoose.Types.ObjectId('000000000000000000000001'),\n    officer_id: new mongoose.Types.ObjectId('000000000000000000000002'),\n    measurement_date: new Date()\n  }\n];\n\nasync function seedJMRRecords() {
  try {
    await connectDB();
    
    console.log('🌱 Starting JMR records seeding with manual entry fields...');
    
    // Check if JMR records already exist
    const existingRecords = await EnhancedJMRRecord.find({ 
      serial_number: { $in: jmrSeedData.map(record => record.serial_number) }
    });
    
    if (existingRecords.length > 0) {
      console.log(`${existingRecords.length} JMR records already exist. Skipping seed.`);
      console.log('Existing records:');
      existingRecords.forEach(record => {
        console.log(`- ${record.serial_number}: ${record.landowner_name} (${record.village})`);
      });
      process.exit(0);
    }
    
    // Create JMR records
    const createdRecords = await EnhancedJMRRecord.insertMany(jmrSeedData);
    
    console.log('\n=== JMR Records Created Successfully ===');
    console.log(`Created ${createdRecords.length} JMR records:`);
    
    createdRecords.forEach(record => {
      console.log(`\n📋 ${record.serial_number}`);
      console.log(`   Owner: ${record.landowner_name}`);
      console.log(`   Location: ${record.village}, ${record.taluka}, ${record.district}`);
      console.log(`   Area: ${record.acquired_area} hectares`);
      console.log(`   Compensation: ₹${record.final_payable_amount.toLocaleString('hi-IN')}`);
      console.log(`   Status: ${record.status}`);
      
      if (record.landowner_name.includes(',')) {
        const owners = record.landowner_name.split(',').map(name => name.trim());
        console.log(`   👥 Multiple Owners: ${owners.length} (${owners.join(', ')})`);
      }
    });
    
    console.log('\n=== Summary ===');
    const totalCompensation = createdRecords.reduce((sum, record) => sum + record.final_payable_amount, 0);
    const totalArea = createdRecords.reduce((sum, record) => sum + record.acquired_area, 0);
    const multipleOwnerRecords = createdRecords.filter(record => record.landowner_name.includes(',')).length;
    
    console.log(`Total Records: ${createdRecords.length}`);
    console.log(`Total Area Acquired: ${totalArea.toFixed(2)} hectares`);
    console.log(`Total Compensation: ₹${totalCompensation.toLocaleString('hi-IN')}`);
    console.log(`Records with Multiple Owners: ${multipleOwnerRecords}`);
    
    console.log('\n=== Features Demonstrated ===');
    console.log('✅ Manual entry fields support');
    console.log('✅ Multiple landowner names (khatedaraje naav)');
    console.log('✅ Basic survey and location details');
    console.log('✅ Compensation calculations');
    console.log('✅ Status management');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding JMR records:', error);
    process.exit(1);
  }


// Run the seeding function
seedJMRRecords();