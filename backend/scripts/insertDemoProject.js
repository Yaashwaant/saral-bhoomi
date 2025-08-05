import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import User from '../models/User.js';

dotenv.config({ path: '../config.env' });

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const user = await User.findOne({ role: { $in: ['officer', 'admin'] } });
  if (!user) {
    console.error('No officer or admin user found. Please create one first.');
    process.exit(1);
  }

  const existing = await Project.findOne({ pmisCode: 'DEMO-001' });
  if (existing) {
    console.log('Demo project already exists:', existing._id);
    process.exit(0);
  }

  const demoProject = await Project.create({
    projectName: 'Demo Land Acquisition Project',
    pmisCode: 'DEMO-001',
    schemeName: 'Demo Scheme',
    landRequired: 10,
    landAvailable: 2,
    landToBeAcquired: 8,
    type: 'greenfield',
    description: 'This is a demo project for testing CSV upload and notice generation.',
    location: {
      district: 'Demo District',
      taluka: 'Demo Taluka',
      villages: ['Demo Village 1', 'Demo Village 2']
    },
    budget: {
      estimatedCost: 10000000,
      allocatedBudget: 8000000,
      currency: 'INR'
    },
    timeline: {
      startDate: new Date('2023-01-01'),
      expectedCompletion: new Date('2024-12-31'),
      actualCompletion: null
    },
    stakeholders: [
      { name: 'Demo Stakeholder', role: 'Owner', contact: '1234567890', email: 'demo@demo.com' }
    ],
    isActive: true,
    createdBy: user._id,
    assignedOfficers: [],
    assignedAgents: []
  });
  console.log('Demo project created:', demoProject._id);
  process.exit(0);
};

run();