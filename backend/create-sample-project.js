import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

// Import the MongoDB Project model
import Project from './models/Project.js';

const createSampleProject = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Check if projects already exist
    const existingProjects = await Project.find({});
    console.log(`📊 Found ${existingProjects.length} existing projects`);
    
    if (existingProjects.length > 0) {
      console.log('📋 Existing projects:');
      existingProjects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.projectName} (${project.projectNumber})`);
      });
    }
    
    // Create a sample project if none exist
    if (existingProjects.length === 0) {
      console.log('🌱 Creating sample project...');
      
      const sampleProject = new Project({
        projectName: 'Sample Land Acquisition Project',
        projectNumber: 'SAMPLE-2024-001',
        schemeName: 'Infrastructure Development Scheme',
        landRequired: 100.50,
        landAvailable: 75.25,
        landToBeAcquired: 25.25,
        type: 'greenfield',
        district: 'Pune',
        taluka: 'Mulshi',
        villages: ['Sample Village', 'Test Village'],
        estimatedCost: 5000000,
        allocatedBudget: 4500000,
        currency: 'INR',
        startDate: new Date('2024-01-01'),
        expectedCompletion: new Date('2024-12-31'),
        description: 'Sample project for testing JMR functionality',
        createdBy: new mongoose.Types.ObjectId(), // Temporary ObjectId
        isActive: true
      });
      
      await sampleProject.save();
      console.log('✅ Sample project created successfully!');
      console.log(`   Project Name: ${sampleProject.projectName}`);
      console.log(`   Project Number: ${sampleProject.projectNumber}`);
      console.log(`   Project ID: ${sampleProject._id}`);
    } else {
      console.log('ℹ️  Projects already exist, skipping creation');
    }
    
    // List all projects
    const allProjects = await Project.find({});
    console.log(`\n📋 Total projects in database: ${allProjects.length}`);
    
    allProjects.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.projectName}`);
      console.log(`     ID: ${project._id}`);
      console.log(`     Project Number: ${project.projectNumber}`);
      console.log(`     District: ${project.district}`);
      console.log(`     Taluka: ${project.taluka}`);
      console.log(`     Villages: ${project.villages.join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error creating sample project:', error.message);
    if (error.code === 11000) {
      console.log('⚠️  Duplicate key error - project with this PMIS code already exists');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script
createSampleProject();