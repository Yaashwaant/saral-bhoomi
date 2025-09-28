import { Sequelize } from 'sequelize';
import JMRRecord from '../models/JMRRecord.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

// Comprehensive JMR Seed Data for Testing
const comprehensiveJMRData = [
  {
    // Basic Land Information
    survey_number: '42/A',
    project_id: 1,
    landowner_id: 'LAND-001',
    landowner_name: 'रामराव पांडुरंग पाटील',
    sub_division_number: '42',
    survey_sub_number: 'A',
    owner_id: 'OWNER-001',
    owner_name: 'रामराव पांडुरंग पाटील',
    father_name: 'पांडुरंग पाटील',
    plot_area: 2.5,
    land_classification: 'शेती',
    revenue_village: 'शिवाजीनगर',
    irrigation_type: 'कोरडवाहू',
    crop_type: 'ज्वारी',
    
    // Revenue Records
    reference_number: 'REF-2024-001',
    file_number: 'FILE-001',
    khata_number: 'खता-42',
    khasra_number: 'खसरा-42/A',
    mutation_number: 'म्युटेशन-001',
    land_record_number: 'LR-2024-001',
    
    // Boundaries
    boundary_north: 'श्रीमंत पाटील यांची जमीन',
    boundary_south: 'बाळासाहेब शिंदे यांची जमीन',
    boundary_east: 'सरकारी रस्ता',
    boundary_west: 'नाला',
    
    // Dates
    acquisition_date: '2024-01-15',
    possession_date: '2024-02-01',
    verification_date: '2024-01-20',
    date_of_measurement: '2024-01-10',
    
    // Survey Details
    surveyor_name: 'सर्वेक्षक अनिल शर्मा',
    witness_1: 'गजानन राऊत',
    witness_2: 'सुरेश पवार',
    measured_area: 2.5,
    
    // Compensation Details
    compensation_amount: 2500000,
    structure_compensation: 150000,
    tree_compensation: 75000,
    well_compensation: 50000,
    
    // Land Details
    old_survey_number: '42',
    new_survey_number: '42/A',
    gat_number: 'गट-12',
    cts_number: 'CTS-45',
    area_per_712: 2.5,
    acquired_area: 2.5,
    land_type: 'Agricultural',
    land_category: 'शेती',
    approved_rate: 1000000,
    market_value: 2500000,
    factor: 1.2,
    land_compensation: 3000000,
    
    // Structures and Trees
    buildings_count: 1,
    buildings_amount: 150000,
    forest_trees_count: 15,
    forest_trees_amount: 45000,
    fruit_trees_count: 6,
    fruit_trees_amount: 30000,
    wells_count: 1,
    wells_amount: 50000,
    total_structures: 275000,
    total_with_structures: 3275000,
    
    // Final Compensation
    solatium: 3275000,
    determined_compensation: 6550000,
    additional_25: 1637500,
    total_compensation: 8187500,
    deduction: 0,
    final_amount: 8187500,
    
    // Status and Classification
    tribal_classification: false,
    category: 'सामान्य',
    status: 'approved',
    
    // Location Details
    village_name: 'शिवाजीनगर',
    taluka_name: 'हवेली',
    district_name: 'पुणे',
    
    // Additional Info
    approval_authority: 'जिल्हाधिकारी, पुणे',
    gazette_notification: 'गॅझेट-2024-001',
    attachments: JSON.stringify(['measurement_report.pdf', 'compensation_calculation.xlsx']),
    notes: 'सर्व मोजमाप पूर्ण झाले आहे. मालकासह दोन साक्षीदार उपस्थित होते.',
    remarks: 'मालकाने मोजमापास संमती दिली आहे. सर्व कागदपत्रे पूर्ण.',
    officer_id: 1
  },
  {
    survey_number: '156/B',
    project_id: 1,
    landowner_id: 'LAND-002',
    landowner_name: 'सुरेश गणपत देशमुख, अनिल गणपत देशमुख',
    sub_division_number: '156',
    survey_sub_number: 'B',
    owner_id: 'OWNER-002',
    owner_name: 'सुरेश गणपत देशमुख',
    father_name: 'गणपत देशमुख',
    plot_area: 3.75,
    land_classification: 'बागायती',
    revenue_village: 'किरकटवाडी',
    irrigation_type: 'पाणलोट',
    crop_type: 'उस',
    
    reference_number: 'REF-2024-002',
    file_number: 'FILE-002',
    khata_number: 'खता-156',
    khasra_number: 'खसरा-156/B',
    mutation_number: 'म्युटेशन-002',
    land_record_number: 'LR-2024-002',
    
    boundary_north: 'सरकारी रस्ता',
    boundary_south: 'नाला',
    boundary_east: 'रामदास पाटील यांची जमीन',
    boundary_west: 'शिवाजी कदम यांची जमीन',
    
    acquisition_date: '2024-01-20',
    possession_date: '2024-02-05',
    verification_date: '2024-01-25',
    date_of_measurement: '2024-01-15',
    
    surveyor_name: 'सर्वेक्षक प्रिया देशपांडे',
    witness_1: 'राजेंद्र शिंदे',
    witness_2: 'संजय पवार',
    measured_area: 3.75,
    
    compensation_amount: 7500000,
    structure_compensation: 200000,
    tree_compensation: 125000,
    well_compensation: 75000,
    
    old_survey_number: '156',
    new_survey_number: '156/B',
    gat_number: 'गट-28',
    cts_number: 'CTS-89',
    area_per_712: 3.75,
    acquired_area: 3.75,
    land_type: 'Agricultural',
    land_category: 'बागायती',
    approved_rate: 2000000,
    market_value: 7500000,
    factor: 1.2,
    land_compensation: 9000000,
    
    buildings_count: 2,
    buildings_amount: 200000,
    forest_trees_count: 25,
    forest_trees_amount: 75000,
    fruit_trees_count: 10,
    fruit_trees_amount: 50000,
    wells_count: 1,
    wells_amount: 75000,
    total_structures: 400000,
    total_with_structures: 9400000,
    
    solatium: 9400000,
    determined_compensation: 18800000,
    additional_25: 4700000,
    total_compensation: 23500000,
    deduction: 0,
    final_amount: 23500000,
    
    tribal_classification: false,
    category: 'सामान्य',
    status: 'under_review',
    
    village_name: 'किरकटवाडी',
    taluka_name: 'मुळशी',
    district_name: 'पुणे',
    
    approval_authority: 'जिल्हाधिकारी, पुणे',
    gazette_notification: 'गॅझेट-2024-002',
    attachments: JSON.stringify(['joint_measurement.pdf', 'tree_count_report.pdf']),
    notes: 'संयुक्त मालकी. दोन्ही भावांनी एकत्रित मोजमापास उपस्थिती दिली.',
    remarks: 'दोन मालक असल्यामुळे निकालपत्रे स्वतंत्र करणे आवश्यक.',
    officer_id: 1
  },
  {
    survey_number: '89/C',
    project_id: 1,
    landowner_id: 'LAND-003',
    landowner_name: 'सीताबाई रामराव पाटील',
    sub_division_number: '89',
    survey_sub_number: 'C',
    owner_id: 'OWNER-003',
    owner_name: 'सीताबाई रामराव पाटील',
    father_name: 'रामराव पाटील',
    plot_area: 1.25,
    land_classification: 'वन जमीन',
    revenue_village: 'लोणीकंद',
    irrigation_type: 'कोरडवाहू',
    crop_type: 'ज्वारी',
    
    reference_number: 'REF-2024-003',
    file_number: 'FILE-003',
    khata_number: 'खता-89',
    khasra_number: 'खसरा-89/C',
    mutation_number: 'म्युटेशन-003',
    land_record_number: 'LR-2024-003',
    
    boundary_north: 'सरकारी जंगल',
    boundary_south: 'नाला',
    boundary_east: 'शेतकरी सोसायटी जमीन',
    boundary_west: 'रस्ता',
    
    acquisition_date: '2024-02-01',
    possession_date: '2024-02-15',
    verification_date: '2024-02-05',
    date_of_measurement: '2024-01-28',
    
    surveyor_name: 'सर्वेक्षक स्मिता जोशी',
    witness_1: 'सुनीता देशपांडे',
    witness_2: 'अनिता पवार',
    measured_area: 1.25,
    
    compensation_amount: 1875000,
    structure_compensation: 50000,
    tree_compensation: 25000,
    well_compensation: 0,
    
    old_survey_number: '89',
    new_survey_number: '89/C',
    gat_number: 'गट-15',
    cts_number: 'CTS-23',
    area_per_712: 1.25,
    acquired_area: 1.25,
    land_type: 'Agricultural',
    land_category: 'वन जमीन',
    approved_rate: 1500000,
    market_value: 1875000,
    factor: 1.2,
    land_compensation: 2250000,
    
    buildings_count: 0,
    buildings_amount: 0,
    forest_trees_count: 20,
    forest_trees_amount: 25000,
    fruit_trees_count: 0,
    fruit_trees_amount: 0,
    wells_count: 0,
    wells_amount: 0,
    total_structures: 75000,
    total_with_structures: 2325000,
    
    solatium: 2325000,
    determined_compensation: 4650000,
    additional_25: 1162500,
    total_compensation: 5812500,
    deduction: 0,
    final_amount: 5812500,
    
    tribal_classification: false,
    category: 'विधवा',
    status: 'pending',
    
    village_name: 'लोणीकंद',
    taluka_name: 'हवेली',
    district_name: 'पुणे',
    
    approval_authority: 'जिल्हाधिकारी, पुणे',
    gazette_notification: 'गॅझेट-2024-003',
    attachments: JSON.stringify(['forest_dept_noc.pdf', 'measurement_report.pdf']),
    notes: 'विधवा मालक. सर्व कागदपत्रे तपासणीसह पूर्ण.',
    remarks: 'विधवा मालक असल्यामुळे विशेष लक्ष देणे आवश्यक.',
    officer_id: 1
  },
  {
    survey_number: '234/D',
    project_id: 1,
    landowner_id: 'LAND-004',
    landowner_name: 'गजानन किसनराव ढोके, संजय किसनराव ढोके, प्रवीण किसनराव ढोके',
    sub_division_number: '234',
    survey_sub_number: 'D',
    owner_id: 'OWNER-004',
    owner_name: 'गजानन किसनराव ढोके',
    father_name: 'किसनराव ढोके',
    plot_area: 5.0,
    land_classification: 'शेती',
    revenue_village: 'पिंपळे सौदागर',
    irrigation_type: 'पाणलोट',
    crop_type: 'उस',
    
    reference_number: 'REF-2024-004',
    file_number: 'FILE-004',
    khata_number: 'खता-234',
    khasra_number: 'खसरा-234/D',
    mutation_number: 'म्युटेशन-004',
    land_record_number: 'LR-2024-004',
    
    boundary_north: 'सरकारी रस्ता',
    boundary_south: 'नाला',
    boundary_east: 'शिवाजी कदम यांची जमीन',
    boundary_west: 'सरकारी जंगल',
    
    acquisition_date: '2024-01-25',
    possession_date: '2024-02-10',
    verification_date: '2024-01-30',
    date_of_measurement: '2024-01-20',
    
    surveyor_name: 'सर्वेक्षक राजेंद्र पाटील',
    witness_1: 'सुरेश कदम',
    witness_2: 'राजेंद्र ढोके',
    measured_area: 5.0,
    
    compensation_amount: 10000000,
    structure_compensation: 300000,
    tree_compensation: 150000,
    well_compensation: 100000,
    
    old_survey_number: '234',
    new_survey_number: '234/D',
    gat_number: 'गट-45',
    cts_number: 'CTS-156',
    area_per_712: 5.0,
    acquired_area: 5.0,
    land_type: 'Agricultural',
    land_category: 'शेती',
    approved_rate: 2000000,
    market_value: 10000000,
    factor: 1.2,
    land_compensation: 12000000,
    
    buildings_count: 3,
    buildings_amount: 300000,
    forest_trees_count: 30,
    forest_trees_amount: 90000,
    fruit_trees_count: 12,
    fruit_trees_amount: 60000,
    wells_count: 2,
    wells_amount: 100000,
    total_structures: 550000,
    total_with_structures: 12550000,
    
    solatium: 12550000,
    determined_compensation: 25100000,
    additional_25: 6275000,
    total_compensation: 31375000,
    deduction: 0,
    final_amount: 31375000,
    
    tribal_classification: false,
    category: 'सामान्य',
    status: 'approved',
    
    village_name: 'पिंपळे सौदागर',
    taluka_name: 'चाकण',
    district_name: 'पुणे',
    
    approval_authority: 'जिल्हाधिकारी, पुणे',
    gazette_notification: 'गॅझेट-2024-004',
    attachments: JSON.stringify(['joint_measurement.pdf', 'tree_count_report.pdf', 'building_assessment.pdf']),
    notes: 'तीन बंधूंची संयुक्त मालकी. सर्व बंधूंनी स्वाक्षरी केली आहे.',
    remarks: 'संयुक्त मालकी असल्यामुळे सर्व मालकांच्या स्वाक्षऱ्या घेणे आवश्यक.',
    officer_id: 1
  }
];

async function createSampleProject() {
  try {
    const project = await Project.findOne({ where: { name: 'पुणे मेट्रो प्रकल्प' } });
    if (!project) {
      return await Project.create({
        name: 'पुणे मेट्रो प्रकल्प',
        description: 'पुणे शहरातील मेट्रो रेल्वे प्रकल्प',
        district: 'पुणे',
        taluka: 'हवेली',
        village: 'शिवाजीनगर',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2026-12-31'
      });
    }
    return project;
  } catch (error) {
    console.error('Error creating sample project:', error);
    throw error;
  }
}

async function createSampleOfficer() {
  try {
    const officer = await User.findOne({ where: { email: 'surveyor@bhoomi.com' } });
    if (!officer) {
      return await User.create({
        name: 'सर्वेक्षक अनिल शर्मा',
        email: 'surveyor@bhoomi.com',
        password: 'password123',
        role: 'surveyor',
        phone: '9876543210',
        district: 'पुणे',
        taluka: 'हवेली',
        status: 'active'
      });
    }
    return officer;
  } catch (error) {
    console.error('Error creating sample officer:', error);
    throw error;
  }
}

async function seedJMRComprehensive() {
  try {
    console.log('🌱 Starting comprehensive JMR data seeding...');
    
    // Create sample project and officer if they don't exist
    const project = await createSampleProject();
    const officer = await createSampleOfficer();
    
    console.log(`✅ Sample project created/updated: ${project.name}`);
    console.log(`✅ Sample officer created/updated: ${officer.name}`);
    
    // Update all records with correct project_id and officer_id
    const updatedData = comprehensiveJMRData.map(record => ({
      ...record,
      project_id: project.id,
      officer_id: officer.id
    }));
    
    // Delete existing JMR records for this project to avoid duplicates
    await JMRRecord.destroy({ where: { project_id: project.id } });
    console.log('🗑️  Cleared existing JMR records for this project');
    
    // Create new JMR records
    const createdRecords = await JMRRecord.bulkCreate(updatedData);
    
    console.log(`✅ Successfully seeded ${createdRecords.length} JMR records`);
    
    // Display summary
    console.log('\n📊 JMR Data Summary:');
    console.log(`- Total Records: ${createdRecords.length}`);
    console.log(`- Project: ${project.name}`);
    console.log(`- Surveyor: ${officer.name}`);
    
    // Calculate total compensation
    const totalCompensation = createdRecords.reduce((sum, record) => 
      sum + parseFloat(record.final_amount), 0);
    console.log(`- Total Compensation: ₹${totalCompensation.toLocaleString('en-IN')}`);
    
    // Status breakdown
    const statusBreakdown = createdRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📋 Status Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} records`);
    });
    
    console.log('\n🎉 JMR data seeding completed successfully!');
    
    return {
      success: true,
      recordsCreated: createdRecords.length,
      project: project.name,
      officer: officer.name,
      totalCompensation: totalCompensation
    };
    
  } catch (error) {
    console.error('❌ Error seeding JMR data:', error);
    throw error;
  }
}

// Run the seeding if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite:./database.sqlite', {
    logging: false
  });
  
  sequelize.authenticate()
    .then(() => {
      console.log('📡 Database connection established successfully');
      return seedJMRComprehensive();
    })
    .then((result) => {
      console.log('\n✅ Seeding process completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedJMRComprehensive, comprehensiveJMRData };