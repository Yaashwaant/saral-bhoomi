// Direct import script: read CSV/XLSX and insert records into MongoDB using MONGODB_URI
// Usage examples:
//   node scripts/direct_import.js --file "./path/to/file.xlsx" --type xlsx --projectId "<mongo_project_id>" --village "Chandrapada" --taluka "Palghar" --district "Palghar"
//   node scripts/direct_import.js --file "./path/to/file.csv" --projectId "<mongo_project_id>"

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import { readFileData } from '../utils/readFileData.js';
import { normalizeRowEnhanced } from '../utils/excelFieldMappings.js';
import { extractJMRDataFromExcel } from '../utils/excelHeaderExtractor.js'

// Resolve __dirname in ESM and load backend/.env explicitly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.replace(/^--/, '');
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function toNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  const cleaned = String(val).replace(/[\s,₹]/g, '').replace(/[^0-9.+-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

async function main() {
  const args = parseArgs(process.argv);
  const filePath = args.file || args.f;
  const explicitType = args.type || args.t; // csv | xlsx
  const projectId = args.projectId || args.p;
  const villageOverride = args.village || args.v;
  const talukaOverride = args.taluka || args.l;
  const districtOverride = args.district || args.d;

  if (!filePath) {
    console.error('Error: --file is required');
    process.exit(1);
  }
  if (!projectId) {
    console.error('Error: --projectId is required');
    process.exit(1);
  }
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  const inferredType = explicitType || (filePath.toLowerCase().endsWith('.xlsx') || filePath.toLowerCase().endsWith('.xls') ? 'xlsx' : 'csv');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  try {
    // Validate project exists
    const project = await MongoProject.findById(projectId);
    if (!project) {
      console.error('Error: Project not found for provided --projectId');
      process.exit(1);
    }

    const rows = await readFileData(filePath, inferredType);
    if (!rows || rows.length === 0) {
      console.error('No data rows found in file');
      process.exit(1);
    }

    console.log(`Read ${rows.length} rows from ${path.basename(filePath)} (${inferredType})`);

    const batchId = `${Date.now()}`;
    const sourceFile = path.basename(filePath);

    const records = [];
    let successCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i];
      const normalized = normalizeRowEnhanced(rawRow);

      const landownerName = String(normalized.landowner_name || '').trim();
      const surveyNumber = String(normalized.survey_number || '').trim();

      if (!landownerName || !surveyNumber) {
        skippedCount++;
        continue;
      }

      const record = {
        project_id: project._id,
        landowner_name: landownerName,
        survey_number: surveyNumber,
        serial_number: (normalized.serial_number || surveyNumber || `AUTO-${i + 1}`),
        
        // Numeric fields conversion (only if present)
        area: toNumber(normalized.area),
        acquired_area: toNumber(normalized.acquired_area),
        rate: toNumber(normalized.rate),
        structure_trees_wells_amount: toNumber(normalized.structure_trees_wells_amount),
        total_compensation: toNumber(normalized.total_compensation),
        solatium: toNumber(normalized.solatium),
        final_amount: toNumber(normalized.final_amount),

        // Additional fields from new format (if parsed)
        old_survey_number: normalized.old_survey_number || undefined,
        new_survey_number: normalized.new_survey_number || undefined,
        total_area_village_record: toNumber(normalized.total_area_village_record),
        acquired_area_sqm_hectare: toNumber(normalized.acquired_area_sqm_hectare),
        land_category: normalized.land_category || undefined,
        land_type_classification: normalized.land_type_classification || undefined,
        approved_rate_per_hectare: toNumber(normalized.approved_rate_per_hectare),
        market_value_acquired_area: toNumber(normalized.market_value_acquired_area),
        section_26_2_factor: toNumber(normalized.section_26_2_factor),
        section_26_compensation: toNumber(normalized.section_26_compensation),
        buildings_count: toNumber(normalized.buildings_count),
        buildings_amount: toNumber(normalized.buildings_amount),
        forest_trees_count: toNumber(normalized.forest_trees_count),
        forest_trees_amount: toNumber(normalized.forest_trees_amount),
        fruit_trees_count: toNumber(normalized.fruit_trees_count),
        fruit_trees_amount: toNumber(normalized.fruit_trees_amount),
        wells_borewells_count: toNumber(normalized.wells_borewells_count),
        total_structures_amount: toNumber(normalized.total_structures_amount),
        total_compensation_amount: toNumber(normalized.total_compensation_amount),
        solatium_100_percent: toNumber(normalized.solatium_100_percent),
        determined_compensation: toNumber(normalized.determined_compensation),
        additional_25_percent_compensation: toNumber(normalized.additional_25_percent_compensation),
        total_final_compensation: toNumber(normalized.total_final_compensation),
        deduction_amount: toNumber(normalized.deduction_amount),
        final_payable_amount: toNumber(normalized.final_payable_amount),
        remarks: normalized.remarks || undefined,

        // Location (fallbacks to overrides or project defaults)
        village: (normalized.village || villageOverride || (project.villages && project.villages[0]) || 'Unknown'),
        taluka: (normalized.taluka || talukaOverride || project.taluka || 'Unknown'),
        district: (normalized.district || districtOverride || project.district || 'Unknown'),

        // Status defaults
        kyc_status: 'pending',
        payment_status: 'pending',
        notice_generated: false,

        // Format and metadata
        data_format: 'mixed',
        source_file_name: sourceFile,
        import_batch_id: batchId,
        documents: [],
        blockchain_verified: false
      };

      records.push(record);
      successCount++;
    }

    // Fallback: If no valid records were built via header-based normalization, try positional Parishisht-K extraction
    if (records.length === 0 && inferredType === 'xlsx') {
      console.log('No valid records after normalization. Trying positional Parishisht-K extraction fallback...');
      const fileBuffer = fs.readFileSync(filePath);
      const startRowOption = parseInt(args.startRow || args.r || '8', 10);
      let jmrResult = extractJMRDataFromExcel(fileBuffer, startRowOption);

      if (!jmrResult.success || !jmrResult.records || jmrResult.records.length === 0) {
        for (const alt of [7, 9, 6, 10, 2]) {
          if (alt === startRowOption) continue;
          const altResult = extractJMRDataFromExcel(fileBuffer, alt);
          if (altResult.success && altResult.records && altResult.records.length > 0) {
            jmrResult = altResult;
            console.log(`Fallback succeeded with startRow=${alt}`);
            break;
          }
        }
      }

      if (jmrResult.success && jmrResult.records && jmrResult.records.length > 0) {
        console.log(`Fallback extracted ${jmrResult.records.length} rows using Parishisht-K format.`);
        for (let i = 0; i < jmrResult.records.length; i++) {
          const rec = jmrResult.records[i];
          const landownerName = String(rec.landowner_name || '').trim();
          const surveyNumber = String(rec.new_survey_number || rec.old_survey_number || '').trim();
          if (!landownerName || !surveyNumber) {
            skippedCount++;
            continue;
          }

          const record = {
            project_id: project._id,
            landowner_name: landownerName,
            survey_number: surveyNumber,
            serial_number: (rec.serial_number || surveyNumber || `AUTO-${i + 1}`),

            // Additional fields from Parishisht-K format
            old_survey_number: rec.old_survey_number || undefined,
            new_survey_number: rec.new_survey_number || undefined,
            total_area_village_record: toNumber(rec.total_area_village_record),
            acquired_area_sqm_hectare: toNumber(rec.acquired_area_sqm_hectare),
            land_category: rec.land_category || undefined,
            land_type_classification: rec.land_type_classification || undefined,
            approved_rate_per_hectare: toNumber(rec.approved_rate_per_hectare),
            market_value_acquired_area: toNumber(rec.market_value_acquired_area),
            section_26_2_factor: toNumber(rec.section_26_2_factor),
            section_26_compensation: toNumber(rec.section_26_compensation),
            buildings_count: toNumber(rec.buildings_count),
            buildings_amount: toNumber(rec.buildings_amount),
            forest_trees_count: toNumber(rec.forest_trees_count),
            forest_trees_amount: toNumber(rec.forest_trees_amount),
            fruit_trees_count: toNumber(rec.fruit_trees_count),
            fruit_trees_amount: toNumber(rec.fruit_trees_amount),
            wells_borewells_count: toNumber(rec.wells_borewells_count),
            total_structures_amount: toNumber(rec.total_structures_amount),
            total_compensation_amount: toNumber(rec.total_compensation_amount),
            solatium_100_percent: toNumber(rec.solatium_100_percent),
            determined_compensation: toNumber(rec.determined_compensation),
            additional_25_percent_compensation: toNumber(rec.additional_25_percent_compensation),
            total_final_compensation: toNumber(rec.total_final_compensation),
            deduction_amount: toNumber(rec.deduction_amount),
            final_payable_amount: toNumber(rec.final_payable_amount),
            final_amount: toNumber(rec.final_amount || rec.final_payable_amount || rec.total_final_compensation),
            remarks: rec.remarks || undefined,

            // Location (prefer extracted header info, else overrides or project defaults)
            village: (rec.village || villageOverride || (project.villages && project.villages[0]) || 'Unknown'),
            taluka: (rec.taluka || talukaOverride || project.taluka || 'Unknown'),
            district: (rec.district || districtOverride || project.district || 'Unknown'),

            // Status defaults and metadata
            kyc_status: 'pending',
            payment_status: 'pending',
            notice_generated: false,
            data_format: 'parishisht_k_31_columns',
            source_file_name: sourceFile,
            import_batch_id: batchId,
            documents: [],
            blockchain_verified: false,
          };

          records.push(record);
          successCount++;
        }
      }
    }

    if (records.length === 0) {
      console.error('No valid records to insert after normalization');
      process.exit(1);
    }

    console.log(`Preparing to insert ${records.length} records...`);

    try {
      await MongoLandownerRecord.insertMany(records, { ordered: false });
      console.log(`Inserted ${records.length} records.`);
    } catch (err) {
      // BulkWriteError may contain details; we still proceed
      console.warn('Insert completed with some errors (likely duplicates due to unique index).');
      if (err && err.writeErrors) {
        console.warn(`Write errors: ${err.writeErrors.length}`);
      } else {
        console.warn(err.message || String(err));
      }
    }

    const total = await MongoLandownerRecord.countDocuments({ project_id: project._id });
    console.log(`Project ${project.projectName || project.name || project._id}: total records now ${total}`);

    const sample = await MongoLandownerRecord.findOne({ project_id: project._id });
    if (sample) {
      console.log('Sample record:', {
        id: sample._id.toString(),
        landowner_name: sample.landowner_name,
        survey_number: sample.survey_number,
        village: sample.village,
        final_amount: sample.final_amount
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});