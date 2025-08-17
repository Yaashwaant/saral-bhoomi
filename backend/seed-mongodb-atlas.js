import { connectMongoDBAtlas } from './config/mongodb-atlas.js';
import User from './models/mongo/User.js';
import Project from './models/mongo/Project.js';
import LandownerRecord from './models/mongo/LandownerRecord.js';
import bcrypt from 'bcryptjs';

async function seedMongoDBAtlas() {
  try {
    console.log('🌱 Starting MongoDB Atlas seeding process...');
    
    // Connect to MongoDB Atlas
    const connected = await connectMongoDBAtlas();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB Atlas');
      return;
    }
    
    console.log('✅ Connected to MongoDB Atlas. Starting data seeding...');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await LandownerRecord.deleteMany({});
    console.log('✅ Existing data cleared');
    
    // Create Admin User
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@saralbhoomi.gov.in',
      password: hashedPassword,
      role: 'admin',
      department: 'IT Department',
      phone: '+91-9876543210'
    });
    await adminUser.save();
    console.log('✅ Admin user created:', adminUser.email);
    
    // Create Officer User
    console.log('👮 Creating officer user...');
    const officerPassword = await bcrypt.hash('officer123', 12);
    const officerUser = new User({
      name: 'Land Acquisition Officer',
      email: 'officer@saralbhoomi.gov.in',
      password: officerPassword,
      role: 'officer',
      department: 'Land Acquisition Department',
      phone: '+91-9876543211'
    });
    await officerUser.save();
    console.log('✅ Officer user created:', officerUser.email);

    // Create Field Officer User
    console.log('👷 Creating field officer user...');
    const fieldOfficerPassword = await bcrypt.hash('field123', 12);
    const fieldOfficerUser = new User({
      name: 'Rajesh Patil - Field Officer',
      email: 'field.officer@saralbhoomi.gov.in',
      password: fieldOfficerPassword,
      role: 'field_officer',
      department: 'Field Operations Department',
      phone: '+91-9876543216'
    });
    await fieldOfficerUser.save();
    console.log('✅ Field Officer user created:', fieldOfficerUser.email);
    
    // Create Project
    console.log('🏗️ Creating demo project...');
    const demoProject = new Project({
      projectName: 'Nagpur-Mumbai Expressway Phase 1',
      schemeName: 'Bharat Mala Pariyojana',
      landRequired: 150.5,
      landAvailable: 45.2,
      landToBeAcquired: 105.3,
      type: 'road',
      district: 'नागपूर',
      taluka: 'नागपूर',
      villages: ['महुली', 'काटोल', 'सावनेर'],
      estimatedCost: 2500000000,
      allocatedBudget: 2000000000,
      startDate: new Date('2024-01-01'),
      expectedCompletion: new Date('2026-12-31'),
      status: 'active',
      createdBy: adminUser._id,
      description: 'Six-lane expressway connecting Nagpur to Mumbai via major cities',
      progress: 35
    });
    await demoProject.save();
    console.log('✅ Demo project created:', demoProject.projectName);
    
    // Create Landowner Records
    console.log('👥 Creating landowner records...');
    const landownerRecords = [
      {
        survey_number: "123/1",
        landowner_name: "राम कृष्ण पाटील",
        area: 2.5,
        acquired_area: 2.0,
        rate: 2500000,
        total_compensation: 3000000,
        solatium: 300000,
        final_amount: 3300000,
        village: "महुली",
        taluka: "नागपूर",
        district: "नागपूर",
        contact_phone: "+91-9876543212",
        contact_email: "ram.patil@email.com",
        kyc_status: "approved",
        payment_status: "completed",
        is_tribal: false,
        is_active: true
      },
      {
        survey_number: "123/2",
        landowner_name: "सुनीता देवी शर्मा",
        area: 1.8,
        acquired_area: 1.5,
        rate: 2200000,
        total_compensation: 2640000,
        solatium: 264000,
        final_amount: 2904000,
        village: "महुली",
        taluka: "नागपूर",
        district: "नागपूर",
        contact_phone: "+91-9876543213",
        contact_email: "sunita.sharma@email.com",
        kyc_status: "approved",
        payment_status: "initiated",
        is_tribal: false,
        is_active: true
      },
      {
        survey_number: "124/1",
        landowner_name: "अजय सिंह ठाकुर",
        area: 3.2,
        acquired_area: 2.8,
        rate: 2800000,
        total_compensation: 3360000,
        solatium: 336000,
        final_amount: 3696000,
        village: "काटोल",
        taluka: "नागपूर",
        district: "नागपूर",
        contact_phone: "+91-9876543214",
        contact_email: "ajay.thakur@email.com",
        kyc_status: "assigned",
        payment_status: "pending",
        is_tribal: true,
        is_active: true
      },
      {
        survey_number: "125/1",
        landowner_name: "मीना बाई वर्मा",
        area: 1.5,
        acquired_area: 1.2,
        rate: 2000000,
        total_compensation: 2400000,
        solatium: 240000,
        final_amount: 2640000,
        village: "सावनेर",
        taluka: "नागपूर",
        district: "नागपूर",
        contact_phone: "+91-9876543215",
        contact_email: "meena.verma@email.com",
        kyc_status: "assigned",
        payment_status: "pending",
        is_tribal: false,
        is_active: true
      }
    ];
    
    for (const recordData of landownerRecords) {
      const record = new LandownerRecord({
        ...recordData,
        project_id: demoProject._id
      });
      await record.save();
      console.log(`✅ Landowner record created: ${record.landowner_name} (${record.survey_number})`);
    }
    
    console.log('\n🎉 MongoDB Atlas seeding completed successfully!');
    console.log('\n📊 Summary of created data:');
    console.log(`👤 Users: ${await User.countDocuments()}`);
    console.log(`🏗️ Projects: ${await Project.countDocuments()}`);
    console.log(`👥 Landowner Records: ${await LandownerRecord.countDocuments()}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('Admin: admin@saralbhoomi.gov.in / admin123');
    console.log('Officer: officer@saralbhoomi.gov.in / officer123');
    console.log('Field Officer: field.officer@saralbhoomi.gov.in / field123');
    
    console.log('\n🚀 Your MongoDB Atlas database is now ready for development!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    process.exit(0);
  }
}

seedMongoDBAtlas();
