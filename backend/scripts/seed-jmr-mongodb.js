import mongoose from 'mongoose';
import { connectMongoDBAtlas } from '../config/database.js';
import JMRRecord from '../models/mongo/JMRRecord.js';
import Project from '../models/mongo/Project.js';
import User from '../models/mongo/User.js';

// Comprehensive JMR Seed Data for MongoDB
const comprehensiveJMRData = [
  {
    survey_number: '42/A',
    owner_id: 'OWNER-001',
    landowner_name: 'रामराव पांडुरंग पाटील',
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
    acquisition_date: new Date('2024-01-15'),
    possession_date: new Date('2024-02-01'),
    verification_date: new Date('2024-01-20'),
    measurement_date: new Date('2024-01-10'),
    
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
    land_type: 'agricultural',
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
    tribal_classification: 'non-tribal',
    category: 'general',
    status: 'approved',
    
    // Location Details
    village: 'शिवाजीनगर',
    taluka: 'हवेली',
    district: 'पुणे',
    
    // Additional Info
    approval_authority: 'जिल्हाधिकारी, पुणे',
    gazette_notification: 'गॅझेट-2024-001',
    documents: [
      {
        name: 'measurement_report.pdf',
        url: '/uploads/measurement_report.pdf',
        type: 'measurement',
        uploaded_at: new Date('2024-09-28T09:34:44.292Z')
      },
      {
        name: 'compensation_calculation.xlsx',
        url: '/uploads/compensation_calculation.xlsx',
        type: 'calculation',
        uploaded_at: new Date('2024-09-28T09:34:44.292Z')
      }
    ],
    remarks: 'सर्व मोजमाप पूर्ण झाले आहे. मालकासह दोन साक्षीदार उपस्थित होते.',
    
    structure_details: [
      { type: 'घर', description: 'इंटपाट्टी घर', area: 50, value: 150000 }
    ],
    tree_details: [
      { type: 'आंबा', count: 6, age: 10, value: 30000 },
      { type: 'जांभूळ', count: 9, age: 8, value: 45000 }
    ],
    well_details: [
      { depth: 30, diameter: 6, construction_type: 'सिमेंट', value: 50000 }
    ]
  },
  {
    survey_number: '156/B',
    owner_id: 'OWNER-002',
    landowner_name: 'सुरेश गणपत देशमुख, अनिल गणपत देशमुख',
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
    
    acquisition_date: new Date('2024-01-20'),
    possession_date: new Date('2024-02-05'),
    verification_date: new Date('2024-01-25'),
    measurement_date: new Date('2024-01-15'),
    
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
    land_type: 'agricultural',
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
    
    tribal_classification: 'non-tribal',
    category: 'general',
    status: 'submitted',
    
    village: 'किरकटवाडी',
    taluka: 'मुळशी',
    district: 'पुणे',
    
    approval_authority: 'जिल्हाधिकारी, पुणे',
    gazette_notification: 'गॅझेट-2024-002',
    documents: [
      { name: 'joint_measurement.pdf', url: '/uploads/joint_measurement.pdf', type: 'measurement', uploaded_at: new Date() },
      { name: 'tree_count_report.pdf', url: '/uploads/tree_count_report.pdf', type: 'trees', uploaded_at: new Date() }
    ],
    remarks: 'संयुक्त मालकी. दोन्ही भावांनी एकत्रित मोजमापास उपस्थिती दिली.',
    
    structure_details: [
      { type: 'शेड', description: 'उसाचा शेड', area: 80, value: 120000 },
      { type: 'स्टोअर', description: 'साहित्य स्टोअर', area: 20, value: 80000 }
    ],
    tree_details: [
      { type: 'केळ', count: 10, age: 5, value: 50000 },
      { type: 'पेरू', count: 15, age: 7, value: 75000 }
    ],
    well_details: [
      { depth: 35, diameter: 7, construction_type: 'सिमेंट', value: 75000 }
    ]
  },
  {
    survey_number: '89/C',
    owner_id: 'OWNER-003',
    landowner_name: 'सीताबाई रामराव पाटील',
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
    
    acquisition_date: new Date('2024-02-01'),
    possession_date: new Date('2024-02-15'),
    verification_date: new Date('2024-02-05'),
    measurement_date: new Date('2024-01-28'),
    
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
    land_type: 'agricultural',
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
    
    tribal_classification: 'non-tribal',
    category: 'general',
    status: 'submitted',
    
    village: 'लोणीकंद',
    taluka: 'हवेली',
    district: 'पुणे',
    
    approval_authority: 'जिल्हाधिकारी, पुणे',
    gazette_notification: 'गॅझेट-2024-003',
    documents: [
      { name: 'forest_dept_noc.pdf', url: '/uploads/forest_dept_noc.pdf', type: 'approval', uploaded_at: new Date() },
      { name: 'measurement_report.pdf', url: '/uploads/measurement_report.pdf', type: 'measurement', uploaded_at: new Date() }
    ],
    remarks: 'विधवा मालक. सर्व कागदपत्रे तपासणीसह पूर्ण.',
    
    structure_details: [],
    tree_details: [
      { type: 'सागवान', count: 15, age: 15, value: 20000 },
      { type: 'बांबू', count: 5, age: 8, value: 5000 }
    ],
    well_details: []
  },
  {
    survey_number: '234/D',
    owner_id: 'OWNER-004',
    landowner_name: 'गजानन किसनराव ढोके, संजय किसनराव ढोके, प्रवीण किसनराव ढोके',
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
    
    acquisition_date: new Date('2024-01-25'),
    possession_date: new Date('2024-02-10'),
    verification_date: new Date('2024-01-30'),
    measurement_date: new Date('2024-01-20'),
    
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
    land_type: 'agricultural',
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
    
    tribal_classification: 'non-tribal',
    category: 'general',
    status: 'approved',
    
    village: 'पिंपळे सौदागर',
    taluka: 'चाकण',
    district: 'पुणे',
    
    approval_authority: 'जिल्हाधिकारी, पुणे',
    gazette_notification: 'गॅझेट-2024-004',
    documents: [
      { name: 'joint_measurement.pdf', url: '/uploads/joint_measurement.pdf', type: 'measurement', uploaded_at: new Date() },
      { name: 'tree_count_report.pdf', url: '/uploads/tree_count_report.pdf', type: 'trees', uploaded_at: new Date() },
      { name: 'building_assessment.pdf', url: '/uploads/building_assessment.pdf', type: 'structures', uploaded_at: new Date() }
    ],
    remarks: 'तीन बंधूंची संयुक्त मालकी. सर्व बंधूंनी स्वाक्षरी केली आहे.',
    
    structure_details: [
      { type: 'घर', description: 'जुनी वाडी', area: 120, value: 200000 },
      { type: 'गोठा', description: 'गुरांचा गोठा', area: 60, value: 60000 },
      { type: 'शेड', description: 'साहित्य शेड', area: 40, value: 40000 }
    ],
    tree_details: [
      { type: 'केळ', count: 12, age: 6, value: 60000 },
      { type: 'आंबा', count: 8, age: 12, value: 40000 },
      { type: 'चिकू', count: 10, age: 8, value: 50000 }
    ],
    well_details: [
      { depth: 40, diameter: 8, construction_type: 'सिमेंट', value: 60000 },
      { depth: 25, diameter: 6, construction_type: 'सिमेंट', value: 40000 }
    ]
  }
];

async function createSampleProject() {
  try {
    const project = await Project.findOne({ projectName: 'पुणे मेट्रो प्रकल्प' });
    if (!project) {
      return await Project.create({
        projectName: 'पुणे मेट्रो प्रकल्प',
        schemeName: 'पुणे मेट्रो योजना',
        landRequired: 12.5,
        landAvailable: 8.0,
        landToBeAcquired: 4.5,
        type: 'railway',
        description: 'पुणे शहरातील मेट्रो रेल्वे प्रकल्प',
        district: 'पुणे',
        taluka: 'हवेली',
        villages: ['शिवाजीनगर', 'किरकटवाडी', 'लोणीकंद', 'पिंपळे सौदागर'],
        estimatedCost: 10000000000,
        allocatedBudget: 8000000000,
        currency: 'INR',
        startDate: new Date('2024-01-01'),
        expectedCompletion: new Date('2026-12-31'),
        status: {
          overall: 'active',
          stage3A: 'approved',
          stage3D: 'approved',
          corrigendum: 'pending',
          award: 'pending'
        },
        progress: 25,
        isActive: true
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
    const officer = await User.findOne({ email: 'officer@example.com' });
    if (!officer) {
      return await User.create({
        name: 'राम गोविंद पवार',
        email: 'officer@example.com',
        password: 'password123',
        role: 'officer',
        phone: '9876543210',
        district: 'पुणे',
        taluka: 'हवेली',
        status: 'active',
        department: 'भूमी अधिग्रहण विभाग',
        designation: 'अधिकारी'
      });
    }
    return officer;
  } catch (error) {
    console.error('Error creating sample officer:', error);
    throw error;
  }
}

async function seedJMRMongoDB() {
  try {
    console.log('🌱 Starting comprehensive JMR data seeding for MongoDB...');
    console.log('📍 Current working directory:', process.cwd());
    
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    const connected = await connectMongoDBAtlas();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }
    console.log('✅ MongoDB connected successfully');
    
    // Create sample project and officer if they don't exist
    const project = await createSampleProject();
    const officer = await createSampleOfficer();
    
    console.log(`✅ Sample project created/updated: ${project.name}`);
    console.log(`✅ Sample officer created/updated: ${officer.name}`);
    
    // Update all records with correct project_id and officer_id
    const updatedData = comprehensiveJMRData.map(record => ({
      ...record,
      project_id: project._id,
      officer_id: officer._id,
      approved_by: officer._id,
      approved_at: record.status === 'approved' ? new Date() : null
    }));
    
    // Delete existing JMR records for this project to avoid duplicates
    await JMRRecord.deleteMany({ project_id: project._id });
    console.log('🗑️  Cleared existing JMR records for this project');
    
    // Create new JMR records
    const createdRecords = await JMRRecord.insertMany(updatedData);
    
    console.log(`✅ Successfully seeded ${createdRecords.length} JMR records`);
    
    // Display summary
    console.log('\n📊 JMR Data Summary:');
    console.log(`- Total Records: ${createdRecords.length}`);
    console.log(`- Project: ${project.name}`);
    console.log(`- Surveyor: ${officer.name}`);
    
    // Calculate total compensation
    const totalCompensation = createdRecords.reduce((sum, record) => 
      sum + (record.final_amount || 0), 0);
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
    
    // Village breakdown
    const villageBreakdown = createdRecords.reduce((acc, record) => {
      acc[record.village] = (acc[record.village] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n🏘️  Village Breakdown:');
    Object.entries(villageBreakdown).forEach(([village, count]) => {
      console.log(`- ${village}: ${count} records`);
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

// Run the seeding
seedJMRMongoDB()
  .then((result) => {
    console.log('\n✅ Seeding process completed:', result);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });

export { seedJMRMongoDB, comprehensiveJMRData };