import mongoose from 'mongoose';
import dotenv from 'dotenv';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import models
import Project from '../models/mongo/Project.js';

console.log('🚀 Starting Chandrapada test script...');

async function testChandrapada() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
    console.log(`🔗 Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');
    
    // Check Excel file
    const excelFilePath = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');
    console.log(`📖 Checking Excel file: ${excelFilePath}`);
    
    if (!fs.existsSync(excelFilePath)) {
      throw new Error(`Excel file not found: ${excelFilePath}`);
    }
    
    console.log('✅ Excel file exists');
    
    // Read Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📋 Excel file loaded. Sheet name: ${sheetName}`);
    
    // Convert to JSON starting from row 6 (assuming headers are in row 5)
    const data = XLSX.utils.sheet_to_json(worksheet, { range: 4, defval: '' });
    
    console.log(`📊 Found ${data.length} records in Excel file`);
    
    // Show first few column headers for debugging
    if (data.length > 0) {
      console.log('📋 First record keys:', Object.keys(data[0]));
      console.log('📋 First record sample:', data[0]);
    }
    
    // Create the Chandrapada project with all required fields
    console.log('🏗️ Creating Chandrapada project...');
    const projectData = {
      projectName: 'Chandrapada Land Acquisition Project',
      schemeName: 'Chandrapada Village Land Acquisition Scheme',
      landRequired: 150.50, // Estimated land required in hectares
      landAvailable: 0,
      landToBeAcquired: 150.50,
      type: 'other',
      district: 'Thane',
      taluka: 'Bhiwandi',
      villages: ['चंद्रपदा', 'Chandrapada'],
      estimatedCost: 50000000, // Estimated cost in rupees
      allocatedBudget: 50000000,
      startDate: new Date('2023-01-01'),
      expectedCompletion: new Date('2025-12-31'),
      createdBy: null, // Will be set to system user if needed
      status: {
        overall: 'active',
        stage3A: 'pending',
        stage3D: 'pending',
        corrigendum: 'pending',
        award: 'pending'
      },
      isActive: true,
      description: 'Land acquisition project for Chandrapada village development'
    };
    
    let project = await Project.findOne({ projectName: projectData.projectName });
    if (!project) {
      project = new Project(projectData);
      await project.save();
      console.log(`✅ Created new project: ${project.projectName} (Project Number: ${project.projectNumber})`);
    } else {
      console.log(`ℹ️ Project already exists: ${project.projectName} (Project Number: ${project.projectNumber})`);
    }
    
    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log(`📊 Summary:`);
    console.log(`   - Excel records found: ${data.length}`);
    console.log(`   - Project: ${project.projectName}`);
    console.log(`   - Project Number: ${project.projectNumber}`);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

// Run the test
testChandrapada()
  .then(() => {
    console.log('🏁 Test process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test process failed:', error);
    process.exit(1);
  });