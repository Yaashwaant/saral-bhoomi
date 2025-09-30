import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MongoProject from './models/mongo/Project.js';

// Load environment variables
dotenv.config({ path: './backend/config.env' });

async function createKhamloliMongoProject() {
  try {
    console.log('🚀 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 10000,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    console.log('✅ Connected to MongoDB Atlas');

    // Check if Khamloli project already exists in MongoProject model
    const existingProject = await MongoProject.findOne({
      $or: [
        { projectName: { $regex: /Khamloli/i } },
        { projectName: 'Khamloli - Mumbai Vadodara Project' }
      ]
    });

    if (existingProject) {
      console.log('📋 Khamloli project already exists in MongoProject model:');
      console.log(`   ID: ${existingProject._id}`);
      console.log(`   Name: ${existingProject.projectName}`);
      console.log(`   District: ${existingProject.district}`);
      console.log(`   Taluka: ${existingProject.taluka}`);
      console.log(`   Villages: ${existingProject.villages?.join(', ')}`);
      console.log(`   Created: ${existingProject.createdAt}`);
      
      // Count associated records
      const { default: JMRRecord } = await import('./models/JMRRecord.js');
      const recordCount = await JMRRecord.countDocuments({ project_id: existingProject._id });
      console.log(`   Records: ${recordCount}`);
      
      return existingProject._id;
    }

    // Create new Khamloli project in MongoProject model
    console.log('🏗️ Creating Khamloli project in MongoProject model...');
    
    const projectData = {
      projectName: 'Khamloli - Mumbai Vadodara Project',
      schemeName: 'Mumbai Vadodara Expressway',
      projectNumber: 'MUM-VAD-2024-KLM',
      landRequired: 75.5, // Estimated hectares
      type: 'greenfield',
      district: 'Palghar',
      taluka: 'Talasari',
      villages: ['Khamloli', 'Pali', 'Sakhare'],
      estimatedCost: 2500000000, // ₹250 crores
      allocatedBudget: 2000000000, // ₹200 crores
      currency: 'INR',
      status: {
        stage3A: 'approved',
        stage3D: 'pending',
        corrigendum: 'pending',
        award: 'pending'
      },
      description: 'Land acquisition for Mumbai Vadodara Expressway project in Khamloli village',
      descriptionDetails: {
        billPassedDate: new Date('2023-12-15'),
        ministry: 'Ministry of Road Transport and Highways',
        applicableLaws: ['Land Acquisition Act 2013', 'NH Act 1956'],
        projectAim: 'Construction of 6-lane expressway connecting Mumbai to Vadodara'
      },
      stakeholders: ['NHAI', 'State Government', 'Local Authorities', 'Landowners'],
      isActive: true,
      assignedOfficers: [],
      assignedAgents: [],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const newProject = new MongoProject(projectData);
    await newProject.save();

    console.log('✅ Khamloli project created successfully in MongoProject model!');
    console.log(`   ID: ${newProject._id}`);
    console.log(`   Name: ${newProject.projectName}`);
    console.log(`   District: ${newProject.district}`);
    console.log(`   Taluka: ${newProject.taluka}`);
    console.log(`   Land Required: ${newProject.landRequired} hectares`);
    console.log(`   Estimated Cost: ₹${newProject.estimatedCost.toLocaleString()}`);

    return newProject._id;

  } catch (error) {
    console.error('❌ Error creating Khamloli project:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createKhamloliMongoProject()
    .then((projectId) => {
      console.log(`\n🎉 Script completed successfully!`);
      if (projectId) {
        console.log(`   Project ID: ${projectId}`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

export default createKhamloliMongoProject;