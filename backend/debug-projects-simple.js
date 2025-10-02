require('dotenv').config();
const mongoose = require('mongoose');

async function checkProjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('=== Checking Collections ===');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(col => console.log('- ' + col.name));
    
    // Check projects collection
    console.log('\n=== Projects Collection ===');
    const projectsCollection = mongoose.connection.db.collection('projects');
    const projects = await projectsCollection.find({}).limit(10).toArray();
    console.log('Found', projects.length, 'projects:');
    projects.forEach(project => {
      console.log('- ID:', project._id, '| Name:', project.projectName || project.name);
    });
    
    // Check English landowner records
    console.log('\n=== English Landowner Records ===');
    const englishCollection = mongoose.connection.db.collection('completeenglishlandownerrecords');
    const recordCounts = await englishCollection.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$project_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('Records by project:');
    for (const record of recordCounts) {
      console.log('- Project ID:', record._id, '| Records:', record.count);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProjects();