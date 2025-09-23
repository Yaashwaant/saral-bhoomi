import { connectMongoDBAtlas, getMongoAtlasConnectionStatus } from './config/mongodb-atlas.js';
import User from './models/mongo/User.js';
import Project from './models/mongo/Project.js';
import LandownerRecord from './models/mongo/LandownerRecord.js';

async function checkMongoDBStatus() {
  try {
    console.log('🔍 Checking MongoDB Atlas database status...\n');
    
    // Connect to MongoDB Atlas
    const connected = await connectMongoDBAtlas();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB Atlas');
      return;
    }
    
    // Get connection status
    const status = getMongoAtlasConnectionStatus();
    console.log('📊 Connection Status:');
    console.log(`   State: ${status.state}`);
    console.log(`   Database: ${status.database}`);
    console.log(`   Host: ${status.host}`);
    console.log(`   Port: ${status.port}\n`);
    
    // Count documents in each collection
    console.log('📈 Database Statistics:');
    const userCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();
    const landownerCount = await LandownerRecord.countDocuments();
    
    console.log(`   👤 Users: ${userCount}`);
    console.log(`   🏗️ Projects: ${projectCount}`);
    console.log(`   👥 Landowner Records: ${landownerCount}\n`);
    
    // Show sample data
    if (userCount > 0) {
      console.log('👤 Sample Users:');
      const users = await User.find({}, 'name email role department').limit(3);
      users.forEach(user => {
        console.log(`   • ${user.name} (${user.email}) - ${user.role} in ${user.department}`);
      });
      console.log('');
    }
    
    if (projectCount > 0) {
      console.log('🏗️ Sample Projects:');
      const projects = await Project.find({}, 'projectName type district status progress').limit(3);
      projects.forEach(project => {
        console.log(`   • ${project.projectName} - ${project.type} in ${project.district} (${project.status}, ${project.progress}% progress)`);
      });
      console.log('');
    }
    
    if (landownerCount > 0) {
      console.log('👥 Sample Landowner Records:');
      const landowners = await LandownerRecord.find({}, 'survey_number landowner_name village kyc_status payment_status').limit(3);
      landowners.forEach(landowner => {
        console.log(`   • ${landowner.landowner_name} (${landowner.survey_number}) - ${landowner.village} - KYC: ${landowner.kyc_status}, Payment: ${landowner.payment_status}`);
      });
      console.log('');
    }
    
    console.log('✅ MongoDB Atlas database status check completed!');
    console.log('🚀 Your database is ready for development and testing.');
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkMongoDBStatus();
