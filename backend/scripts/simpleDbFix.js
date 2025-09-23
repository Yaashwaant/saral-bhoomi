import sequelize from '../config/database.js';

async function simpleDbFix() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    console.log('🔧 Fixing database schema...');
    
    // 1. Add missing columns to jmr_records table
    console.log('➕ Adding missing columns to jmr_records...');
    
    try {
      await sequelize.query('ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)');
      console.log('✅ user_id column added');
    } catch (error) {
      console.log('⚠️ user_id column already exists or failed:', error.message);
    }
    
    try {
      await sequelize.query('ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS land_type VARCHAR(50)');
      console.log('✅ land_type column added');
    } catch (error) {
      console.log('⚠️ land_type column already exists or failed:', error.message);
    }
    
    try {
      await sequelize.query('ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS tribal_classification BOOLEAN DEFAULT FALSE');
      console.log('✅ tribal_classification column added');
    } catch (error) {
      console.log('⚠️ tribal_classification column already exists or failed:', error.message);
    }
    
    try {
      await sequelize.query('ALTER TABLE jmr_records ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT \'pending\'');
      console.log('✅ status column added');
    } catch (error) {
      console.log('⚠️ status column already exists or failed:', error.message);
    }
    
    // 2. Create new tables
    console.log('\n🏗️ Creating new tables...');
    
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS notices (
          id SERIAL PRIMARY KEY,
          notice_id VARCHAR(100) UNIQUE NOT NULL,
          survey_number VARCHAR(100) NOT NULL,
          landowner_name VARCHAR(255),
          amount DECIMAL(15,2),
          notice_date TIMESTAMP,
          status VARCHAR(50) DEFAULT 'draft',
          user_id INTEGER REFERENCES users(id),
          project_id INTEGER REFERENCES projects(id),
          village VARCHAR(100),
          taluka VARCHAR(100),
          district VARCHAR(100),
          land_type VARCHAR(50),
          tribal_classification BOOLEAN DEFAULT FALSE,
          jmr_reference VARCHAR(100),
          objection_deadline TIMESTAMP,
          notice_type VARCHAR(100),
          description TEXT,
          attachments JSONB,
          document_hash VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ notices table created');
    } catch (error) {
      console.log('⚠️ notices table creation failed:', error.message);
    }
    
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          payment_id VARCHAR(100) UNIQUE NOT NULL,
          survey_number VARCHAR(100) NOT NULL,
          notice_id VARCHAR(100),
          amount DECIMAL(15,2),
          status VARCHAR(50) DEFAULT 'Pending',
          reason_if_pending TEXT,
          user_id INTEGER REFERENCES users(id),
          project_id INTEGER REFERENCES projects(id),
          payment_date TIMESTAMP,
          payment_method VARCHAR(100),
          bank_details JSONB,
          utr_number VARCHAR(100),
          receipt_path VARCHAR(255),
          notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ payments table created');
    } catch (error) {
      console.log('⚠️ payments table creation failed:', error.message);
    }
    
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS awards (
          id SERIAL PRIMARY KEY,
          award_id VARCHAR(100) UNIQUE NOT NULL,
          survey_number VARCHAR(100) NOT NULL,
          landowner_id VARCHAR(100),
          landowner_name VARCHAR(255),
          award_number VARCHAR(100),
          award_date TIMESTAMP,
          status VARCHAR(50) DEFAULT 'Draft',
          user_id INTEGER REFERENCES users(id),
          project_id INTEGER REFERENCES projects(id),
          village VARCHAR(100),
          taluka VARCHAR(100),
          district VARCHAR(100),
          land_type VARCHAR(50),
          tribal_classification BOOLEAN DEFAULT FALSE,
          category VARCHAR(100),
          measured_area DECIMAL(10,2),
          unit VARCHAR(50),
          jmr_reference VARCHAR(100),
          base_amount DECIMAL(15,2),
          solatium DECIMAL(15,2),
          additional_amounts JSONB,
          total_amount DECIMAL(15,2),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ awards table created');
    } catch (error) {
      console.log('⚠️ awards table creation failed:', error.message);
    }
    
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS blockchain_ledger (
          id SERIAL PRIMARY KEY,
          block_id VARCHAR(100) UNIQUE NOT NULL,
          survey_number VARCHAR(100) NOT NULL,
          event_type VARCHAR(100) NOT NULL,
          user_id INTEGER REFERENCES users(id),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB,
          previous_hash VARCHAR(255),
          current_hash VARCHAR(255),
          nonce INTEGER,
          project_id INTEGER REFERENCES projects(id),
          remarks TEXT,
          is_valid BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ blockchain_ledger table created');
    } catch (error) {
      console.log('⚠️ blockchain_ledger table creation failed:', error.message);
    }
    
    // 3. Verify the changes
    console.log('\n🔍 Verifying database schema...');
    
    try {
      const jmrColumns = await sequelize.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'jmr_records' ORDER BY ordinal_position",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      console.log('jmr_records columns:');
      jmrColumns.forEach(col => {
        console.log(`  - ${col.column_name}`);
      });
      
      // Check if user_id column exists
      const hasUserId = jmrColumns.some(col => col.column_name === 'user_id');
      if (hasUserId) {
        console.log('✅ user_id column found in jmr_records');
      } else {
        console.log('❌ user_id column NOT found in jmr_records');
      }
    } catch (error) {
      console.log('❌ Failed to check jmr_records columns:', error.message);
    }
    
    try {
      const tables = await sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('notices', 'payments', 'awards', 'blockchain_ledger') ORDER BY table_name",
        { type: sequelize.QueryTypes.SELECT }
      );
      
      console.log('\nNew tables created:');
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } catch (error) {
      console.log('❌ Failed to check new tables:', error.message);
    }
    
    console.log('\n🎉 Database schema fix completed!');
    console.log('Now let\'s test if the server starts without errors...');
    
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
  simpleDbFix();
}

export default simpleDbFix;
