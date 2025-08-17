import sequelize from './config/database.js';

async function checkTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    const tables = await sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name', { 
      type: sequelize.QueryTypes.SELECT 
    });
    
    console.log('\nAvailable tables:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    // Also check for specific tables we're interested in
    console.log('\nChecking for specific tables:');
    const specificTables = ['landowner_records', 'jmr_records', 'awards', 'notices', 'payments', 'blockchain_ledger'];
    
    for (const tableName of specificTables) {
      const exists = await sequelize.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${tableName}')`,
        { type: sequelize.QueryTypes.SELECT }
      );
      console.log(`${tableName}: ${exists[0].exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    }
    
    await sequelize.close();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

checkTables();
