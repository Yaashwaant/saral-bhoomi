const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

async function updateROBProject() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const projectId = '68da854996a3d559f5005b5c'; // ROB project ID
    
    console.log('\n=== Updating Railway Overbridge Project (ROB) ===');
    
    // First, check current project state
    const currentProject = await mongoose.connection.db
      .collection('projects')
      .findOne({ 
        _id: new mongoose.Types.ObjectId(projectId)
      });
    
    if (!currentProject) {
      console.log('Project not found with ID:', projectId);
      return;
    }
    
    console.log('Current project state:');
    console.log('  projectName:', currentProject.projectName);
    console.log('  villages:', currentProject.villages);
    
    // Update the villages array to include Dongare
    const updatedVillages = [...(currentProject.villages || [])];
    
    // Add Dongare if not already present
    if (!updatedVillages.includes('Dongare')) {
      updatedVillages.push('Dongare');
    }
    if (!updatedVillages.includes('dongare')) {
      updatedVillages.push('dongare');
    }
    
    console.log('\nUpdated villages array:', updatedVillages);
    
    // Update the project
    const result = await mongoose.connection.db
      .collection('projects')
      .updateOne(
        { _id: new mongoose.Types.ObjectId(projectId) },
        { 
          $set: { 
            villages: updatedVillages,
            updatedAt: new Date()
          }
        }
      );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Project updated successfully');
      
      // Verify the update
      const updatedProject = await mongoose.connection.db
        .collection('projects')
        .findOne({ 
          _id: new mongoose.Types.ObjectId(projectId)
        });
      
      console.log('\nVerification - Updated project villages:', updatedProject.villages);
    } else {
      console.log('❌ No changes made to the project');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateROBProject();