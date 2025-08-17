import sequelize from '../config/database.js';
import '../models/index.js';

async function initDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync all models with force: false (don't drop existing tables)
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ Database models synchronized successfully.');
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}

export default initDatabase;
