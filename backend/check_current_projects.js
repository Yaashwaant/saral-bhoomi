import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function checkProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi');
    
    // Check projects collection directly
    const projects = await mongoose.connection.db.collection('projects').find({}).toArray();
    console.log('Projects in database:', projects.length);
    
    projects.forEach((p, index) => {
      console.log(`${index + 1}. ${p.projectName || p.name || 'Unnamed Project'}`);
      console.log('   Project Number:', p.projectNumber);
      console.log('   District:', p.district);
      console.log('   Taluka:', p.taluka);
      console.log('   Villages:', p.villages);
      console.log('   Created:', p.createdAt);
      console.log('');
    });
    
    // Check if any Chandrapada-related data exists
    const chandrapadaProjects = projects.filter(p => 
      p.projectName?.includes('Chandrapada') || 
      p.name?.includes('Chandrapada') ||
      p.villages?.some(v => v.includes('चंद्रपदा'))
    );
    
    console.log('Chandrapada-related projects found:', chandrapadaProjects.length);
    
    // Check LandownerRecord collection
    const landownerRecords = await mongoose.connection.db.collection('landownerrecords').countDocuments();
    console.log('Total LandownerRecord documents:', landownerRecords);
    
    // Check for Chandrapada village records
    const chandrapadaRecords = await mongoose.connection.db.collection('landownerrecords').countDocuments({ village: 'चंद्रपदा' });
    console.log('Records with village चंद्रपदा:', chandrapadaRecords);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkProjects();