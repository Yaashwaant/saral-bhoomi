import sequelize from './config/database.js';
import './models/index.js';

const testDatabase = async () => {
  try {
    console.log('🔗 Testing PostgreSQL connection...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully!');
    
    // Test model sync
    console.log('🔄 Testing model sync...');
    await sequelize.sync({ force: false });
    console.log('✅ Models synced successfully!');
    
    // Test a simple query
    console.log('🔍 Testing simple query...');
    const result = await sequelize.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result[0][0]);
    
    console.log('🎉 All database tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
};

testDatabase();
