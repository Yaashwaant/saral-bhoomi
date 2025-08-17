import sequelize from './config/database.js';

async function checkLandownerTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    // Check table structure
    const columns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'landowner_records' 
      ORDER BY ordinal_position
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('\nLandowner Records table structure:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'None'}`);
    });
    
    // Check if there's any data
    const count = await sequelize.query(
      'SELECT COUNT(*) as count FROM landowner_records',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log(`\nTotal records: ${count[0].count}`);
    
    // Show sample data if exists
    if (count[0].count > 0) {
      const sample = await sequelize.query(
        'SELECT * FROM landowner_records LIMIT 3',
        { type: sequelize.QueryTypes.SELECT }
      );
      console.log('\nSample records:');
      sample.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        Object.keys(record).forEach(key => {
          console.log(`  ${key}: ${record[key]}`);
        });
      });
    }
    
    await sequelize.close();
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
}

checkLandownerTable();
