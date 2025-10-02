const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function checkProject() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const projectId = '678fe385996b2b9331f8c40c';
    
    console.log('\n=== Checking if project exists ===');
    
    const project = await mongoose.connection.db
      .collection('projects')
      .findOne({ 
        _id: new mongoose.Types.ObjectId(projectId)
      });
    
    if (project) {
      console.log('Project found:');
      console.log('  _id:', project._id);
      console.log('  projectName:', project.projectName);
      console.log('  name:', project.name);
      console.log('  villages:', project.villages);
      console.log('  taluka:', project.taluka);
      console.log('  district:', project.district);
    } else {
      console.log('Project not found with ID:', projectId);
      
      // List all projects
      console.log('\n=== All projects ===');
      const allProjects = await mongoose.connection.db
        .collection('projects')
        .find({})
        .limit(5)
        .toArray();
      
      allProjects.forEach(p => {
        console.log(`  _id: ${p._id} - ${p.projectName || p.name}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkProject();