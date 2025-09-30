import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
    await mongoose.connect(mongoUri);

    const db = mongoose.connection.db;
    const col = db.collection('landownerrecords');

    const total = await col.countDocuments();
    const byVillage = await col.countDocuments({ village: 'चंद्रपदा' });
    const bySource = await col.countDocuments({ source_file_name: 'Chandrapada New 20.01.23-.xlsx' });

    console.log('Total LandownerRecord:', total);
    console.log('Records with village चंद्रपदा:', byVillage);
    console.log('Records with source Chandrapada Excel:', bySource);

    const sample = await col.find({ village: 'चंद्रपदा' }).limit(1).toArray();
    if (sample.length) {
      const s = sample[0];
      console.log('Sample Chandrapada record:', {
        serial_number: s.serial_number,
        landowner_name: s.landowner_name,
        survey_number: s.survey_number,
        final_payable_amount: s.final_payable_amount
      });
    } else {
      console.log('No sample record found for village चंद्रपदा.');
    }
  } catch (err) {
    console.error('Query failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;