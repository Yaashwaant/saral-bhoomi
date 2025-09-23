import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Check what tables exist
    console.log('\n📋 Checking existing tables...');
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
      { type: QueryTypes.SELECT }
    );
    
    console.log('Existing tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Check jmr_records table structure
    if (tables.some(t => t.table_name === 'jmr_records')) {
      console.log('\n📏 Checking jmr_records table structure...');
      const columns = await sequelize.query(
        "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'jmr_records' ORDER BY ordinal_position",
        { type: QueryTypes.SELECT }
      );
      
      console.log('jmr_records columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    // Check if we can create a simple test record
    console.log('\n🧪 Testing basic database operations...');
    
    // Try to create a simple test project
    try {
      const testProject = await sequelize.query(
        "INSERT INTO projects (name, description, status, start_date, end_date, budget, location, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
        {
          bind: ['Test Project', 'Test Description', 'Active', new Date(), new Date(), 1000000, 'Test Location', 1],
          type: QueryTypes.INSERT
        }
      );
      console.log('✅ Test project created successfully');
      
      // Clean up
      await sequelize.query("DELETE FROM projects WHERE name = 'Test Project'");
      console.log('✅ Test project cleaned up');
      
    } catch (error) {
      console.log('❌ Failed to create test project:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkDatabase();
}

export default checkDatabase;
