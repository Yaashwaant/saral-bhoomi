import sequelize from '../config/database.js';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import User from '../models/User.js';

dotenv.config({ path: './config.env' });

const run = async () => {
  await sequelize.authenticate();

  const user = await User.findOne({ where: { role: 'officer' } });
  if (!user) {
    console.error('No officer or admin user found. Please create one first.');
    process.exit(1);
  }

  const existing = await Project.findOne({ where: { pmisCode: 'SARAL-DEMO-001' } });
  if (existing) {
    console.log('Demo project already exists:', existing.id);
    process.exit(0);
  }

  const demoProject = await Project.create({
    projectName: 'Saral Bhoomi Demo Project - Nande Taluka',
    pmisCode: 'SARAL-DEMO-001',
    schemeName: 'Land Acquisition for Infrastructure Development',
    landRequired: 15.5,
    landAvailable: 3.2,
    landToBeAcquired: 12.3,
    type: 'greenfield',
    description: 'Demo project for testing Parishisht-K CSV upload and notice generation in Nande taluka, Palghar district.',
    district: 'पालघर',
    taluka: 'नांदे',
    villages: ['गाव1', 'गाव2', 'नांदे'],
    estimatedCost: 25000000,
    allocatedBudget: 20000000,
    currency: 'INR',
    startDate: new Date('2024-01-01'),
    expectedCompletion: new Date('2025-12-31'),
    actualCompletion: null,
    stakeholders: [
      { name: 'Collector Office Palghar', role: 'Authority', contact: '02525-123456', email: 'collector@palghar.gov.in' },
      { name: 'Tehsildar Nande', role: 'Local Officer', contact: '02525-234567', email: 'tehsildar@nande.gov.in' }
    ],
    isActive: true,
    createdBy: user.id,
    assignedOfficers: [],
    assignedAgents: []
  });
  console.log('Demo project created:', demoProject.id);
  process.exit(0);
};

run();