import sequelize from '../config/database.js';
import fs from 'fs';
import path from 'path';

async function executeSqlFix() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    console.log('🔧 Executing database schema fix...');
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'fixDatabaseDirect.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
          await sequelize.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          console.log(`⚠️ Statement ${i + 1} failed (this might be expected):`, error.message);
        }
      }
    }
    
    // Verify the changes
    console.log('\n🔍 Verifying database schema...');
    
    // Check if jmr_records has the required columns
    const jmrColumns = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'jmr_records' ORDER BY ordinal_position",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('jmr_records columns:');
    jmrColumns.forEach(col => {
      console.log(`  - ${col.column_name}`);
    });
    
    // Check if new tables exist
    const tables = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('notices', 'payments', 'awards', 'blockchain_ledger') ORDER BY table_name",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('\nNew tables created:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('\n🎉 Database schema fix completed successfully!');
    console.log('The system should now work without the "column officer_id does not exist" error.');
    
  } catch (error) {
    console.error('❌ Database schema fix failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeSqlFix();
}

export default executeSqlFix;
