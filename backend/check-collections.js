import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAll collections in database:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // Check for land record collections specifically
    const landRecordCollections = collections.filter(col => 
      col.name.toLowerCase().includes('land') || 
      col.name.toLowerCase().includes('record') ||
      col.name.toLowerCase().includes('owner')
    );
    
    console.log('\nLand record related collections:');
    for (const collection of landRecordCollections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments({});
      console.log(`- ${collection.name}: ${count} documents`);
    }
    
    // Check the projects collection
    const projectsCount = await mongoose.connection.db.collection('projects').countDocuments({});
    console.log(`\nProjects collection: ${projectsCount} documents`);
    
    // Show Railway Overbridge Project details
    const railwayProject = await mongoose.connection.db.collection('projects')
      .findOne({ _id: new mongoose.Types.ObjectId('68da854996a3d559f5005b5c') });
    
    if (railwayProject) {
      console.log('\nRailway Overbridge Project found:');
      console.log(`Name: ${railwayProject.projectName}`);
      console.log(`ID: ${railwayProject._id}`);
    } else {
      console.log('\nRailway Overbridge Project not found');
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCollections();