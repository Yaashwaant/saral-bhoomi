import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkRailwayProject() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Check if Railway Overbridge Project exists
    const railwayProjectId = '68da854996a3d559f5005b5c';
    const railwayProject = await mongoose.connection.db.collection('projects')
      .findOne({ _id: new mongoose.Types.ObjectId(railwayProjectId) });
    
    if (railwayProject) {
      console.log('\n✅ Railway Overbridge Project found:');
      console.log(`ID: ${railwayProject._id}`);
      console.log(`Name: ${railwayProject.projectName}`);
      console.log(`Scheme: ${railwayProject.schemeName}`);
      console.log(`District: ${railwayProject.district}`);
      console.log(`Taluka: ${railwayProject.taluka}`);
      console.log(`Status: ${JSON.stringify(railwayProject.status)}`);
      console.log(`isActive: ${railwayProject.isActive}`);
      console.log(`Type: ${railwayProject.type}`);
    } else {
      console.log('\n❌ Railway Overbridge Project NOT found!');
    }
    
    // List all projects to see what's available
    console.log('\n📋 All projects in database:');
    const allProjects = await mongoose.connection.db.collection('projects').find({}).toArray();
    allProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.projectName || 'Unnamed'} (ID: ${project._id})`);
      console.log(`   Active: ${project.isActive}, Type: ${project.type || 'N/A'}`);
      console.log(`   District: ${project.district || 'N/A'}, Taluka: ${project.taluka || 'N/A'}`);
      console.log('');
    });
    
    // Check land records assignment
    const landRecordsCount = await mongoose.connection.db.collection('landownerrecords_english_complete')
      .countDocuments({ project_id: new mongoose.Types.ObjectId(railwayProjectId) });
    
    console.log(`🏠 Land records assigned to Railway Project: ${landRecordsCount}`);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRailwayProject();