import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import Project from '../models/mongo/Project.js';
import LandownerRecord from '../models/mongo/LandownerRecord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend .env to use correct MONGODB_URI (Atlas)
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verify() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
    console.log(`🔗 Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    const projectName = 'Chandrapada Land Acquisition Project';
    const project = await Project.findOne({ projectName });
    if (!project) {
      console.log(`❌ Project not found: ${projectName}`);
      const logPath = path.join(__dirname, 'verify_chandrapada_output.txt');
      const outLines = [
        `Project: ${projectName}`,
        `Project Number: N/A`,
        `Total LandownerRecord: N/A`,
        `Chandrapada project records: 0`,
        `Status: Project not found`
      ];
      fs.writeFileSync(logPath, outLines.join('\n'));
      console.log(`📝 Wrote verification summary to: ${logPath}`);
      return;
    }

    console.log(`✅ Found project: ${project.projectName} (Project Number: ${project.projectNumber})`);

    const totalRecords = await LandownerRecord.countDocuments();
    const projectRecords = await LandownerRecord.countDocuments({ project_id: project._id });
    console.log('📊 Record counts:');
    console.log(`   - Total LandownerRecord: ${totalRecords}`);
    console.log(`   - Chandrapada project records: ${projectRecords}`);

    const logPath = path.join(__dirname, 'verify_chandrapada_output.txt');
    const outLines = [
      `Project: ${project.projectName}`,
      `Project Number: ${project.projectNumber}`,
      `Total LandownerRecord: ${totalRecords}`,
      `Chandrapada project records: ${projectRecords}`
    ];
    fs.writeFileSync(logPath, outLines.join('\n'));
    console.log(`📝 Wrote verification summary to: ${logPath}`);

    const sample = await LandownerRecord.findOne({ project_id: project._id });
    if (sample) {
      console.log('\n📋 Sample record for Chandrapada:');
      console.log(`   - Serial: ${sample.serial_number}`);
      console.log(`   - Name: ${sample.landowner_name}`);
      console.log(`   - Survey: ${sample.survey_number}`);
      console.log(`   - Area (village record): ${sample.total_area_village_record}`);
      console.log(`   - Final Amount: ${sample.final_payable_amount}`);
    } else {
      console.log('\nℹ️ No sample record found for the project.');
    }
  } catch (err) {
    console.error('💥 Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  verify().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default verify;