import sequelize from '../config/database.js';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config({ path: './config.env' });

const run = async () => {
  await sequelize.authenticate();

  const existing = await User.findOne({ where: { email: 'officer@saral.gov.in' } });
  if (existing) {
    console.log('Demo officer user already exists:', existing.id);
    process.exit(0);
  }

  const user = await User.create({
    name: 'Demo Officer',
    email: 'officer@saral.gov.in',
    password: 'officer',
    role: 'officer',
    department: 'Land Acquisition',
    phone: '+91-9876543211',
    language: 'marathi',
    isActive: true
  });
  console.log('Demo officer user created:', user.id);
  process.exit(0);
};

run();