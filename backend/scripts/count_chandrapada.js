import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
  const outPath = path.join(__dirname, 'chandrapada_counts.txt');
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
    await mongoose.connect(mongoUri);

    const { default: Project } = await import('../models/mongo/Project.js');
    const { default: LandownerRecord } = await import('../models/mongo/LandownerRecord.js');

    const projectName = 'Chandrapada Land Acquisition Project';
    const project = await Project.findOne({ projectName });
    const totalRecords = await LandownerRecord.countDocuments();
    let projectRecords = 0;
    let projectNumber = 'N/A';
    if (project) {
      projectRecords = await LandownerRecord.countDocuments({ project_id: project._id });
      projectNumber = project.projectNumber || 'N/A';
    }

    const lines = [
      `Project: ${project ? project.projectName : projectName}`,
      `Project Number: ${projectNumber}`,
      `Total LandownerRecord: ${totalRecords}`,
      `Chandrapada project records: ${projectRecords}`,
      `Status: ${project ? 'Found' : 'Not Found'}`
    ];
    fs.writeFileSync(outPath, lines.join('\n'));
    console.log('Wrote counts to:', outPath);
  } catch (err) {
    fs.writeFileSync(outPath, `Error: ${err?.message || err}`);
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;