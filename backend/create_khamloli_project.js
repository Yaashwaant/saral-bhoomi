import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';

dotenv.config();

// Khamloli project data
const khamloliProjectData = {
  projectName: 'Khamloli - Mumbai Vadodara Project',
  projectNumber: 'KHAML-MV-2024',
  district: 'Palghar',
  taluka: 'Vasai',
  village: 'Khamloli',
  landRequired: 285.75, // hectares
  projectType: 'Bullet Train',
  status: 'active',
  description: 'Mumbai Vadodara Bullet Train Project - Khamloli Section',
  budget: 450, // crores
  startDate: new Date('2024-01-01'),
  expectedCompletionDate: new Date('2026-12-31'),
  landAcquisitionStatus: {
    notificationIssued: 'pending',
    objectionsReceived: 'pending',
    awardsAnnounced: 'pending',
    compensationPaid: 'pending',
    possessionTaken: 'pending'
  },
  landDetails: {
    totalLandRequired: 285.75,
    landAvailable: 0,
    landAcquired: 0,
    landInProcess: 0,
    landRemaining: 285.75
  },
  ownerDetails: {
    totalOwners: 0,
    ownersContacted: 0,
    ownersAgreed: 0,
    ownersDisputed: 0
  },
  compensationDetails: {
    totalCompensation: 0,
    compensationPaid: 0,
    compensationPending: 0,
    averageCompensationPerHectare: 0
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

async function createKhamloliProject() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Check if project already exists
    const existingProject = await Project.findOne({ 
      projectName: 'Khamloli - Mumbai Vadodara Project' 
    });
    
    if (existingProject) {
      console.log('Khamloli project already exists:', existingProject.projectName);
      console.log('Project ID:', existingProject._id);
      return existingProject;
    }

    // Create new project
    const project = new Project(khamloliProjectData);
    const savedProject = await project.save();
    
    console.log('Khamloli project created successfully!');
    console.log('Project ID:', savedProject._id);
    console.log('Project Name:', savedProject.projectName);
    console.log('Location:', `${savedProject.district} - ${savedProject.taluka} - ${savedProject.village}`);
    
    return savedProject;
    
  } catch (error) {
    console.error('Error creating Khamloli project:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createKhamloliProject()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });