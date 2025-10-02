import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkProjectExists() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const projectId = '68da6edf579af093415f639e';
    
    // Check if project exists
    const project = await mongoose.connection.db.collection('projects').findOne({ 
      _id: new mongoose.Types.ObjectId(projectId) 
    });
    
    console.log('Project exists:', !!project);
    if (project) {
      console.log('Project details:', {
        _id: project._id,
        projectNumber: project.projectNumber,
        name: project.name
      });
    }

    // Check if project exists with string ID
    const projectString = await mongoose.connection.db.collection('projects').findOne({ 
      _id: projectId 
    });
    
    console.log('Project exists (string ID):', !!projectString);
    if (projectString) {
      console.log('Project details (string ID):', {
        _id: projectString._id,
        projectNumber: projectString.projectNumber,
        name: projectString.name
      });
    }

    // List all projects
    const allProjects = await mongoose.connection.db.collection('projects').find({}).toArray();
    console.log(`\nTotal projects: ${allProjects.length}`);
    allProjects.forEach(p => {
      console.log(`- ID: ${p._id}, Number: ${p.projectNumber}, Name: ${p.name}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkProjectExists();