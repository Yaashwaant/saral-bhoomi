import dotenv from 'dotenv';
import mongoose from 'mongoose';
import MongoProject from '../models/mongo/Project.js';

dotenv.config({ path: './config.env' });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set in environment');
  process.exit(1);
}

async function migrate() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected');

    const total = await MongoProject.countDocuments({});
    console.log(`📦 Projects found: ${total}`);

    const cursor = MongoProject.find({}).cursor();
    let migrated = 0;
    for await (const doc of cursor) {
      const update = {};
      const set = {};
      const unset = {};

      // Normalize status to nested structure
      const existingStatus = doc.status;
      const stage3A = doc.stage3A || existingStatus?.stage3A;
      const stage3D = doc.stage3D || existingStatus?.stage3D;
      const corrigendum = doc.corrigendum || existingStatus?.corrigendum;
      const award = doc.award || existingStatus?.award;
      const overall = typeof existingStatus === 'string' ? existingStatus : existingStatus?.overall;

      set['status'] = {
        overall: overall || 'planning',
        stage3A: stage3A || 'pending',
        stage3D: stage3D || 'pending',
        corrigendum: corrigendum || 'pending',
        award: award || 'pending'
      };

      // Remove legacy root fields if present
      if (doc.stage3A !== undefined) unset['stage3A'] = '';
      if (doc.stage3D !== undefined) unset['stage3D'] = '';
      if (doc.corrigendum !== undefined) unset['corrigendum'] = '';
      if (doc.award !== undefined) unset['award'] = '';

      update['$set'] = set;
      if (Object.keys(unset).length) update['$unset'] = unset;

      await MongoProject.updateOne({ _id: doc._id }, update);
      migrated += 1;
      if (migrated % 50 === 0) console.log(`... migrated ${migrated}/${total}`);
    }

    console.log(`✅ Migration complete. Migrated ${migrated} documents.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();


