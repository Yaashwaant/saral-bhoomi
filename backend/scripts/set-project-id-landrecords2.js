import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from possible locations
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../config/config.env') });

// Configuration
const PROJECT_ID = '68d90a1daac2c70e82c20438';
const COLLECTION_NAME = 'landrecords2';

async function connectMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
  console.log('🔗 Connecting to MongoDB using URI:', uri.replace(/(\w+:\/\/)([^@]+)@/, '$1***@'));
  await mongoose.connect(uri);
}

async function main() {
  try {
    await connectMongo();
  } catch (e) {
    console.error('❌ Failed to connect to MongoDB:', e?.message || e);
    process.exit(1);
  }

  try {
    const objectId = new mongoose.Types.ObjectId(PROJECT_ID);
    const collection = mongoose.connection.collection(COLLECTION_NAME);

    console.log(`🛠️ Updating all documents in collection '${COLLECTION_NAME}' to set project_id=${PROJECT_ID} (ObjectId)`);
    const result = await collection.updateMany({}, { $set: { project_id: objectId } });

    console.log(`✅ Update completed. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);
  } catch (error) {
    console.error('❌ Error updating documents:', error?.message || error);
  } finally {
    await mongoose.connection.close();
    console.log('🔚 Closed MongoDB connection.');
  }
}

main().catch(async (err) => {
  console.error('❌ Script failed:', err?.message || err);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});