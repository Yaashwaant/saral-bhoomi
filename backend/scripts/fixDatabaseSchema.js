import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function fixDatabaseSchema() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    console.log('🔧 Fixing database schema...');
    
    // Check if jmr_records table exists and add missing columns
    const jmrTableExists = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'jmr_records')",
      { type: QueryTypes.SELECT }
    );
    
    if (jmrTableExists[0].exists) {
      console.log('📋 Found jmr_records table, checking for missing columns...');
      
      // Check if officer_id column exists
      const officerIdExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jmr_records' AND column_name = 'officer_id')",
        { type: QueryTypes.SELECT }
      );
      
      if (!officerIdExists[0].exists) {
        console.log('➕ Adding officer_id column to jmr_records...');
        await sequelize.query(
          "ALTER TABLE jmr_records ADD COLUMN officer_id INTEGER REFERENCES users(id)",
          { type: QueryTypes.RAW }
        );
        console.log('✅ officer_id column added successfully');
      } else {
        console.log('✅ officer_id column already exists');
      }
      
      // Check if land_type column exists
      const landTypeExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jmr_records' AND column_name = 'land_type')",
        { type: QueryTypes.SELECT }
      );
      
      if (!landTypeExists[0].exists) {
        console.log('➕ Adding land_type column to jmr_records...');
        await sequelize.query(
          "ALTER TABLE jmr_records ADD COLUMN land_type VARCHAR(50)",
          { type: QueryTypes.RAW }
        );
        console.log('✅ land_type column added successfully');
      } else {
        console.log('✅ land_type column already exists');
      }
      
      // Check if tribal_classification column exists
      const tribalExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jmr_records' AND column_name = 'tribal_classification')",
        { type: QueryTypes.SELECT }
      );
      
      if (!tribalExists[0].exists) {
        console.log('➕ Adding tribal_classification column to jmr_records...');
        await sequelize.query(
          "ALTER TABLE jmr_records ADD COLUMN tribal_classification BOOLEAN DEFAULT FALSE",
          { type: QueryTypes.RAW }
        );
        console.log('✅ tribal_classification column added successfully');
      } else {
        console.log('✅ tribal_classification column already exists');
      }
      
      // Check if status column exists
      const statusExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jmr_records' AND column_name = 'status')",
        { type: QueryTypes.SELECT }
      );
      
      if (!statusExists[0].exists) {
        console.log('➕ Adding status column to jmr_records...');
        await sequelize.query(
          "ALTER TABLE jmr_records ADD COLUMN status VARCHAR(50) DEFAULT 'pending'",
          { type: QueryTypes.RAW }
        );
        console.log('✅ status column added successfully');
      } else {
        console.log('✅ status column already exists');
      }

      // Check if village column exists
      const villageExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jmr_records' AND column_name = 'village')",
        { type: QueryTypes.SELECT }
      );
      
      if (!villageExists[0].exists) {
        console.log('➕ Adding village column to jmr_records...');
        await sequelize.query(
          "ALTER TABLE jmr_records ADD COLUMN village VARCHAR(100)",
          { type: QueryTypes.RAW }
        );
        console.log('✅ village column added successfully');
      } else {
        console.log('✅ village column already exists');
      }

      // Check if taluka column exists
      const talukaExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jmr_records' AND column_name = 'taluka')",
        { type: QueryTypes.SELECT }
      );
      
      if (!talukaExists[0].exists) {
        console.log('➕ Adding taluka column to jmr_records...');
        await sequelize.query(
          "ALTER TABLE jmr_records ADD COLUMN taluka VARCHAR(100)",
          { type: QueryTypes.RAW }
        );
        console.log('✅ taluka column added successfully');
      } else {
        console.log('✅ taluka column already exists');
      }

      // Check if district column exists
      const districtExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jmr_records' AND column_name = 'district')",
        { type: QueryTypes.SELECT }
      );
      
      if (!districtExists[0].exists) {
        console.log('➕ Adding district column to jmr_records...');
        await sequelize.query(
          "ALTER TABLE jmr_records ADD COLUMN district VARCHAR(100)",
          { type: QueryTypes.RAW }
        );
        console.log('✅ district column added successfully');
      } else {
        console.log('✅ district column already exists');
      }



      // Check if category column exists
      const categoryExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jmr_records' AND column_name = 'category')",
        { type: QueryTypes.SELECT }
      );
      
      if (!categoryExists[0].exists) {
        console.log('➕ Adding category column to jmr_records...');
        await sequelize.query(
          "ALTER TABLE jmr_records ADD COLUMN category VARCHAR(100)",
          { type: QueryTypes.RAW }
        );
        console.log('✅ category column added successfully');
      } else {
        console.log('✅ category column already exists');
      }
    }
    
    // Create new tables if they don't exist
    console.log('🏗️ Creating new tables...');
    
    // Create notices table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id SERIAL PRIMARY KEY,
        notice_id VARCHAR(100) UNIQUE NOT NULL,
        survey_number VARCHAR(100) NOT NULL,
        landowner_name VARCHAR(255),
        amount DECIMAL(15,2),
        notice_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'draft',
        officer_id INTEGER REFERENCES users(id),
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
    `, { type: QueryTypes.RAW });
    console.log('✅ notices table created/verified');
    
    // Create payments table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        payment_id VARCHAR(100) UNIQUE NOT NULL,
        survey_number VARCHAR(100) NOT NULL,
        notice_id VARCHAR(100) REFERENCES notices(notice_id),
        amount DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'Pending',
        reason_if_pending TEXT,
        officer_id INTEGER REFERENCES users(id),
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
    `, { type: QueryTypes.RAW });
    console.log('✅ payments table created/verified');
    
    // Create blockchain_ledger table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS blockchain_ledger (
        id SERIAL PRIMARY KEY,
        block_id VARCHAR(100) UNIQUE NOT NULL,
        survey_number VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        officer_id INTEGER REFERENCES users(id),
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
    `, { type: QueryTypes.RAW });
    console.log('✅ blockchain_ledger table created/verified');
    
    // Create awards table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS awards (
        id SERIAL PRIMARY KEY,
        award_id VARCHAR(100) UNIQUE NOT NULL,
        survey_number VARCHAR(100) NOT NULL,
        landowner_id VARCHAR(100) NOT NULL,
        landowner_name VARCHAR(255) NOT NULL,
        award_number VARCHAR(100) NOT NULL,
        award_date TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'Draft',
        officer_id INTEGER NOT NULL REFERENCES users(id),
        project_id INTEGER NOT NULL REFERENCES projects(id),
        village VARCHAR(100) NOT NULL,
        taluka VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        land_type VARCHAR(50) DEFAULT 'Agricultural',
        tribal_classification BOOLEAN DEFAULT FALSE,
        category VARCHAR(100),
        measured_area DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) DEFAULT 'acres',
        jmr_reference VARCHAR(100),
        base_amount DECIMAL(14,2) DEFAULT 0,
        solatium DECIMAL(14,2) DEFAULT 0,
        additional_amounts JSONB,
        total_amount DECIMAL(14,2) DEFAULT 0,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, { type: QueryTypes.RAW });
    console.log('✅ awards table created/verified');
    
    console.log('🎉 Database schema fixed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to fix database schema:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDatabaseSchema();
}

export default fixDatabaseSchema;
