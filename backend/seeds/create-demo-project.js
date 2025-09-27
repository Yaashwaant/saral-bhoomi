import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

async function createDemoProject() {
  try {
    await connectDB();

    // Demo project data
    const demoProject = {
      projectName: 'Demo Land Acquisition Project',
      schemeName: 'Highway Expansion',
      landRequired: 100,
      landAvailable: 20,
      landToBeAcquired: 80,
      type: 'greenfield',
      district: 'Pune',
      taluka: 'Haveli',
      villages: ['Village1', 'Village2'],
      estimatedCost: 10000000,
      allocatedBudget: 5000000,
      startDate: new Date(),
      expectedCompletion: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      createdBy: '000000000000000000000000' // Placeholder, will update later
    };

    const createdProject = await Project.create(demoProject);
    console.log('Demo project created successfully!');
    console.log('Project ID:', createdProject._id.toString());
    console.log('Project Number:', createdProject.projectNumber);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating demo project:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createDemoProject();