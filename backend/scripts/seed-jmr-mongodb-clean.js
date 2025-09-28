import { connectMongoDBAtlas } from '../config/database.js';
import JMRRecord from '../models/mongo/JMRRecord.js';
import Project from '../models/mongo/Project.js';
import User from '../models/mongo/User.js';

// Comprehensive JMR seed data
const comprehensiveJMRData = [
  {
    survey_number: '45/A',
    owner_id: 'OWNER-001',
    landowner_name: 'रामदास गोविंद पाटील',
    father_name: 'गोविंद पाटील',
    plot_area: 2.5,
    land_classification: 'बागायती',
    revenue_village: 'शिवाजीनगर',
    irrigation_type: 'नालेने',
    crop_type: 'भात',
    
    reference_number: 'REF-2024-001',
    file_number: 'FILE-001',
    khata_number: 'खता-45',
    khasra_number: 'खसरा-45/A',
    mutation_number: 'म्युटेशन-001',
    land_record_number: 'LR-2024-001',
    
    boundary_north: 'सरकारी रस्ता',
    boundary_south: 'नाला',
    boundary_east: 'लक्ष्मण पाटील यांची जमीन',
    boundary_west: 'सरकारी जंगल',
    
    acquisition_date: new Date('2024-01-15'),
    possession_date: new Date('2024-02-01'),
    verification_date: new Date('2024-01-20'),
    measurement_date: new Date('2024-01-10'),
    
    surveyor_name: 'सर्वेक्षक अनिल शर्मा',
    witness_1: 'सुनील पाटील',
    witness_2: 'राजेंद्र देशपांडे',
    measured_area: 2.5,
    
    compensation_amount: 5000000,
    structure_compensation: 150000,
    tree_compensation: 75000,
    well_compensation: 50000,
    
    old_survey_number: '45',
    new_survey_number: '45/A',
    gat_number: 'गट-12',
    cts_number: 'CTS-34',
    area_per_712: 2.5,
    acquired_area: 2.5,
    land_type: 'agricultural',
    land_category: 'बागायती',
    approved_rate: 2000000,
    market_value: 5000000,
    factor: 1.2,
    land_compensation: 6000000,
    
    buildings_count: 1,
    buildings_amount: 150000,
    forest_trees_count: 0,
    forest_trees_amount: 0,
    fruit_trees_count: 15,
    fruit_trees_amount: 75000,
    wells_count: 1,
    wells_amount: 50000,
    total_structures: 275000,
    total_with_structures: 6275000,
    
    solatium: 6275000,
    determined_compensation: 12550000,
    additional_25: 3137500,
    total_compensation: 15687500,
    deduction: 0,
    final_amount: 15687500,
    
    tribal_classification: 'non-tribal',
    category: 'general',
    status: 'approved',
    
    village: 'शिवाजीनगर',
    taluka: 'हवेली',
    district: 'पुणे',
    
    approval_authority: 'जिल्हाधिकारी, पुणे',
    gazette_notification: 'गॅझेट-2024-001',
    documents: [
      {
        name: 'measurement_report.pdf',
        url: '/uploads/measurement_report.pdf',
        type: 'measurement',
        uploaded_at: new Date()
      },
      {
        name: 'compensation_calculation.xlsx',
        url: '/uploads/compensation_calculation.xlsx',
        type: 'calculation',
        uploaded_at: new Date()
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
        department: 'भूमी अधिग्रहण विभाग',
        phone: '9876543210',
        is_active: true
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
    
    console.log(`✅ Sample project created/updated: ${project.projectName}`);
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
    console.log(`- Project: ${project.projectName}`);
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
      project: project.projectName,
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