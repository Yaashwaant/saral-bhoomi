import sequelize from './config/database.js';
import { User, Project, LandownerRecord } from './models/index.js';

const initDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('✅ Database tables created successfully!');
    
    // Create demo data
    console.log('🌱 Seeding demo data...');
    
    // Create demo users
    const demoUsers = await User.bulkCreate([
      {
        name: 'Demo Officer',
        email: 'officer@saral.gov.in',
        password: 'password123',
        role: 'officer',
        department: 'Land Acquisition',
        phone: '9876543210',
        isActive: true
      },
      {
        name: 'Demo Agent',
        email: 'agent@saral.gov.in',
        password: 'password123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543211',
        isActive: true
      }
    ]);
    
    // Create demo projects
    const demoProjects = await Project.bulkCreate([
      {
        projectName: 'Mumbai-Nagpur Expressway',
        pmisCode: 'PMIS001',
        schemeName: 'Bharatmala Pariyojana',
        landRequired: 150.5,
        landAvailable: 120.3,
        landToBeAcquired: 30.2,
        type: 'greenfield',
        stage3A: 'approved',
        stage3D: 'pending',
        corrigendum: 'pending',
        award: 'pending',
        description: 'High-speed expressway connecting Mumbai to Nagpur',
        district: 'नागपूर',
        taluka: 'नागपूर',
        villages: ['महुली', 'गडगे नगर', 'कामठी'],
        estimatedCost: 150000000000.00,
        allocatedBudget: 120000000000.00,
        currency: 'INR',
        startDate: new Date('2024-01-01'),
        expectedCompletion: new Date('2026-12-31'),
        stakeholders: ['NHAI', 'Maharashtra PWD', 'Central Government'],
        documents: [],
        isActive: true,
        createdBy: demoUsers[0].id,
        assignedOfficers: [demoUsers[0].id],
        assignedAgents: [demoUsers[1].id]
      },
      {
        projectName: 'Pune Metro Extension',
        pmisCode: 'PMIS002',
        schemeName: 'Metro Rail Project',
        landRequired: 45.2,
        landAvailable: 35.8,
        landToBeAcquired: 9.4,
        type: 'brownfield',
        stage3A: 'pending',
        stage3D: 'pending',
        corrigendum: 'pending',
        award: 'pending',
        description: 'Extension of Pune Metro Line 3',
        district: 'पुणे',
        taluka: 'पुणे',
        villages: ['कोथरूड', 'बावधन', 'सुंदरनगर'],
        estimatedCost: 25000000000.00,
        allocatedBudget: 20000000000.00,
        currency: 'INR',
        startDate: new Date('2024-06-01'),
        expectedCompletion: new Date('2027-06-30'),
        stakeholders: ['Pune Metro Rail Corporation', 'Maharashtra Government'],
        documents: [],
        isActive: true,
        createdBy: demoUsers[0].id,
        assignedOfficers: [demoUsers[0].id],
        assignedAgents: [demoUsers[1].id]
      }
    ]);
    
    // Create demo landowner records
    const landowner1 = await LandownerRecord.create({
      project_id: demoProjects[0].id,
      खातेदाराचे_नांव: 'राम कृष्ण पाटील',
      सर्वे_नं: '123/1',
      क्षेत्र: '2.5',
      संपादित_क्षेत्र: '2.5',
      दर: '2500000',
      संरचना_झाडे_विहिरी_रक्कम: '500000',
      एकूण_मोबदला: '3000000',
      सोलेशियम_100: '300000',
      अंतिम_रक्कम: '3300000',
      village: 'महुली',
      taluka: 'नागपूर',
      district: 'नागपूर',
      kycStatus: 'approved',
      paymentStatus: 'pending',
      noticeGenerated: true,
      noticeNumber: 'NOTICE-001',
      noticeDate: new Date(),
      documentsUploaded: true,
      isActive: true,
      createdBy: demoUsers[0].id
    });

    const landowner2 = await LandownerRecord.create({
      project_id: demoProjects[0].id,
      खातेदाराचे_नांव: 'सुनीता देवी शर्मा',
      सर्वे_नं: '124/2',
      क्षेत्र: '1.8',
      संपादित_क्षेत्र: '1.8',
      दर: '2500000',
      संरचना_झाडे_विहिरी_रक्कम: '300000',
      एकूण_मोबदला: '1800000',
      सोलेशियम_100: '180000',
      अंतिम_रक्कम: '1980000',
      village: 'महुली',
      taluka: 'नागपूर',
      district: 'नागपूर',
      kycStatus: 'pending',
      paymentStatus: 'pending',
      noticeGenerated: false,
      documentsUploaded: false,
      isActive: true,
      createdBy: demoUsers[0].id
    });

    const demoLandowners = [landowner1, landowner2];
    
    console.log('✅ Demo data seeded successfully!');
    console.log(`📊 Created ${demoUsers.length} users, ${demoProjects.length} projects, ${demoLandowners.length} landowner records`);
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
};

// Run initialization
initDatabase().then((success) => {
  if (success) {
    console.log('🎉 Database initialization completed successfully!');
    process.exit(0);
  } else {
    console.log('💥 Database initialization failed!');
    process.exit(1);
  }
});
