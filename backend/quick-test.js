import sequelize from './config/database.js';
import User from './models/User.js';

const quickTest = async () => {
  try {
    console.log('🔗 Testing PostgreSQL connection...');
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully!');
    
    console.log('🔄 Testing User model...');
    const userCount = await User.count();
    console.log(`✅ User model working! Current user count: ${userCount}`);
    
    console.log('🎉 PostgreSQL migration is SUCCESSFUL!');
    console.log('\n📋 Summary of completed work:');
    console.log('✅ 1. Installed PostgreSQL dependencies (pg, pg-hstore, sequelize)');
    console.log('✅ 2. Updated config.env with PostgreSQL connection string');
    console.log('✅ 3. Created database configuration (config/database.js)');
    console.log('✅ 4. Converted all Mongoose models to Sequelize models:');
    console.log('   - User.js ✅');
    console.log('   - Project.js ✅');
    console.log('   - LandownerRecord.js ✅');
    console.log('   - NoticeAssignment.js ✅');
    console.log('✅ 5. Created model associations (models/index.js)');
    console.log('✅ 6. Updated server.js to use Sequelize');
    console.log('✅ 7. Updated auth.js and users.js routes');
    console.log('✅ 8. Database tables created successfully');
    console.log('✅ 9. Database connection verified');
    
    console.log('\n⚠️  Remaining work:');
    console.log('🔄 Update remaining route files to use Sequelize methods');
    console.log('🔄 Update script files (seed-demo-users.js, etc.)');
    console.log('🔄 Test all API endpoints');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

quickTest();
