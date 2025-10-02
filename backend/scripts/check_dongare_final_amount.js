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

    const projectId = '68da854996a3d559f5005b5c';
    const village = 'Dongare';

    // Get sample records
    const sample = await col
      .find({ project_id: new mongoose.Types.ObjectId(projectId), village })
      .limit(5)
      .toArray();

    console.log('Sample Dongare records:');
    sample.forEach((r, i) => {
      console.log(`${i + 1}. ${r.landowner_name} | survey:${r.survey_number} | final_amount:${r.final_amount} | final_payable_amount:${r.final_payable_amount} | total_final_compensation:${r.total_final_compensation}`);
    });

    // Count records with different amount fields
    const total = await col.countDocuments({ project_id: new mongoose.Types.ObjectId(projectId), village });
    const withFinalAmount = await col.countDocuments({ project_id: new mongoose.Types.ObjectId(projectId), village, final_amount: { $exists: true, $ne: null } });
    const withFinalPayable = await col.countDocuments({ project_id: new mongoose.Types.ObjectId(projectId), village, final_payable_amount: { $exists: true, $ne: null } });
    const withTotalFinal = await col.countDocuments({ project_id: new mongoose.Types.ObjectId(projectId), village, total_final_compensation: { $exists: true, $ne: null } });

    console.log('\nAmount field summary:');
    console.log(`Total records: ${total}`);
    console.log(`Records with final_amount: ${withFinalAmount}`);
    console.log(`Records with final_payable_amount: ${withFinalPayable}`);
    console.log(`Records with total_final_compensation: ${withTotalFinal}`);

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