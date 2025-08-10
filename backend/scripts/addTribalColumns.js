import dotenv from 'dotenv';
import sequelize from '../config/database.js';

dotenv.config({ path: './config.env' });

const run = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();

    console.log('🛠️  Adding tribal columns if missing...');
    await sequelize.query(`
      ALTER TABLE "landowner_records"
      ADD COLUMN IF NOT EXISTS "is_tribal" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "tribal_certificate_no" varchar(255),
      ADD COLUMN IF NOT EXISTS "tribal_lag" varchar(255);
    `);

    console.log('✅ Columns ensured: is_tribal, tribal_certificate_no, tribal_lag');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to add tribal columns:', err?.message || err);
    process.exit(1);
  }
};

run();


