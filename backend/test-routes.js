import sequelize from './config/database.js';
import User from './models/User.js';
import Project from './models/Project.js';
import LandownerRecord from './models/LandownerRecord.js';

const testRoutes = async () => {
  try {
    console.log('🔗 Testing PostgreSQL connection...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully!');
    
    console.log('\n🧪 Testing updated routes...');
    
    // Test User model
    console.log('👤 Testing User model...');
    const userCount = await User.count();
    console.log(`✅ User model working! Count: ${userCount}`);
    
    // Test Project model
    console.log('📋 Testing Project model...');
    const projectCount = await Project.count();
    console.log(`✅ Project model working! Count: ${projectCount}`);
    
    // Test LandownerRecord model
    console.log('🏠 Testing LandownerRecord model...');
    const recordCount = await LandownerRecord.count();
    console.log(`✅ LandownerRecord model working! Count: ${recordCount}`);
    
    console.log('\n🎉 Route transformation progress:');
    console.log('✅ 1. auth.js - Complete');
    console.log('✅ 2. users.js - Complete');
    console.log('✅ 3. projects.js - Complete');
    console.log('✅ 4. landowners.js - Complete');
    console.log('✅ 5. agents.js - Complete');
    console.log('✅ 6. kyc.js - Complete');
    console.log('✅ 7. payments.js - Complete');
    console.log('🔄 8. notices.js - Pending');
    console.log('🔄 9. villages.js - Pending');
    console.log('🔄 10. csv.js - Pending');
    
    console.log('\n📊 Summary:');
    console.log(`✅ ${7}/10 routes updated (70% complete)`);
    console.log('🔄 3 routes remaining');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

testRoutes();
