import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/mongo/Project.js';
import LandownerRecord from '../models/mongo/LandownerRecord.js';

dotenv.config();

async function verifyChandrapadaData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi');
    
    // Find Chandrapada project
    const project = await Project.findOne({ projectName: 'Chandrapada' });
    if (!project) {
      console.log('Chandrapada project not found');
      return;
    }
    
    console.log('Chandrapada Project:', project.projectName, '(Number:', project.projectNumber, ')');
    
    // Count records
    const recordCount = await LandownerRecord.countDocuments({ project_id: project._id });
    console.log('Total records:', recordCount);
    
    // Calculate total area
    const areaResult = await LandownerRecord.aggregate([
      { $match: { project_id: project._id } },
      { $group: { 
        _id: null, 
        totalArea: { $sum: '$area' },
        totalHectares: { $sum: '$area_hectares' },
        totalAcres: { $sum: '$area_acres' }
      }}
    ]);
    
    if (areaResult.length > 0) {
      console.log('Total area (hectares):', areaResult[0].totalHectares.toFixed(3));
      console.log('Total area (calculated):', areaResult[0].totalArea.toFixed(3));
      console.log('Total area (acres):', areaResult[0].totalAcres.toFixed(3));
    }
    
    // Show sample records
    const sampleRecords = await LandownerRecord.find({ project_id: project._id })
      .limit(5)
      .select('serial_number survey_number landowner_name area area_hectares village');
    
    console.log('\nSample records:');
    sampleRecords.forEach((record, index) => {
      console.log(`${index + 1}. ${record.serial_number} - ${record.survey_number} - ${record.landowner_name} (${record.area_hectares} ha)`);
    });
    
    // Show overall summary
    const allProjects = await Project.find({}).select('projectName projectNumber');
    console.log('\nAll projects in database:');
    allProjects.forEach((proj, index) => {
      console.log(`${index + 1}. ${proj.projectName} (${proj.projectNumber})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verifyChandrapadaData();