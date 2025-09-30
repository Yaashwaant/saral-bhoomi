import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/Project.js';
import LandownerRecord from './models/mongo/LandownerRecord.js';

dotenv.config();

async function removeChandrapadaProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi');
    console.log('Connected to MongoDB');

    // Find all Chandrapada-related projects
    const chandrapadaProjects = await Project.find({
      $or: [
        { projectName: { $regex: /chandrapada/i } },
        { projectName: { $regex: /चंद्रपदा/i } },
        { villages: { $in: [/chandrapada/i, /चंद्रपदा/i] } }
      ]
    });

    console.log(`Found ${chandrapadaProjects.length} Chandrapada projects:`);
    chandrapadaProjects.forEach(project => {
      console.log(`- ${project.projectName} (ID: ${project._id}, Project Number: ${project.projectNumber})`);
    });

    // Remove associated landowner records first
    for (const project of chandrapadaProjects) {
      const deletedRecords = await LandownerRecord.deleteMany({ projectId: project._id });
      console.log(`Deleted ${deletedRecords.deletedCount} landowner records for project: ${project.projectName}`);
    }

    // Remove the projects themselves
    const deletedProjects = await Project.deleteMany({
      _id: { $in: chandrapadaProjects.map(p => p._id) }
    });

    console.log(`Successfully removed ${deletedProjects.deletedCount} Chandrapada projects and their associated records`);

  } catch (error) {
    console.error('Error removing Chandrapada projects:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

removeChandrapadaProjects();