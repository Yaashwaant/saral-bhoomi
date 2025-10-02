import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { connectMongoDBAtlas } from '../config/mongodb-atlas.js';
import MongoProject from '../models/mongo/Project.js';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    input: null,
    projectName: 'Railway Over Bridge',
    district: 'Palghar',
    taluka: 'Vassai',
    village: 'Chandrapada',
    clearFirst: false,
    backup: false
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--input' && args[i + 1]) opts.input = args[++i];
    else if (a === '--project') opts.projectName = args[++i];
    else if (a === '--district') opts.district = args[++i];
    else if (a === '--taluka') opts.taluka = args[++i];
    else if (a === '--village') opts.village = args[++i];
    else if (a === '--clear-first') opts.clearFirst = true;
    else if (a === '--backup') opts.backup = true;
  }
  if (!opts.input) {
    throw new Error('Missing --input <path-to-json>');
  }
  return opts;
}




function normalizeKey(k) {
  return String(k || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9_]/g, '');
}

function pick(obj, aliases, fallback = null) {
  const keys = Object.keys(obj || {});
  const table = new Map(keys.map(k => [normalizeKey(k), k]));
  for (const alias of aliases) {
    const nk = normalizeKey(alias);
    if (table.has(nk)) return obj[table.get(nk)];
  }
  return fallback;
}

function parseNumber(val, defaultValue = 0) {
  if (val === null || val === undefined) return defaultValue;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[,\s]/g, '');
    const n = parseFloat(cleaned);
    return Number.isNaN(n) ? defaultValue : n;
  }
  return defaultValue;
}

function asString(val, defaultValue = '') {
  if (val === null || val === undefined) return defaultValue;
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  try { return JSON.stringify(val); } catch { return defaultValue; }
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function findOrCreateProject({ projectName, district, taluka, village }) {
  let project = await MongoProject.findOne({ projectName });
  if (!project) {
    project = await MongoProject.create({
      projectName,
      schemeName: projectName,
      landRequired: 0,
      landAvailable: 0,
      landToBeAcquired: 0,
      type: 'railway',
      district: district || undefined,
      taluka: taluka || undefined,
      villages: village ? [village] : []
    });
    console.log(`🆕 Created project '${projectName}' with id ${project._id}`);
  } else {
    console.log(`✅ Found project '${projectName}' with id ${project._id}`);
  }
  return project;
}

function buildRecord(row, defaults, idx) {
  // Aliases (English + Marathi labels)
  const serialAliases = ['serial_number', 'Serial Number', 'अ.क्र'];
  const surveyAliases = [
    'survey_number', 'Survey Number', 'Survey No', 'Survey No.', 'survey no',
    'survey', 'new_survey_number', 'New Survey Number', 'New Survey No', 'New Survey No.',
    'नविन स.नं.'
  ];
  const oldSurveyAliases = ['old_survey_number', 'Old Survey Number', 'Old Survey No', 'Old Survey No.', 'जुना स.नं.'];
  const newSurveyAliases = ['new_survey_number', 'New Survey Number', 'New Survey No', 'New Survey No.', 'नविन स.नं.'];
  const groupAliases = ['group_number', 'Group Number', 'Group No', 'गट नंबर'];
  const ctsAliases = ['cts_number', 'CTS Number', 'CTS No', 'CTS', 'सी.टी.एस. नंबर'];
  const ownerAliases = ['landowner_name', 'Owner Name', 'Landowner Name', 'Landowner', 'Name', 'Owner', 'खातेदाराचे नांव'];
  const areaVillageAliases = ['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)', 'total_area_village_record', 'Total Area'];
  const acquiredAliases = ['संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)', 'acquired_area_sqm_hectare', 'Acquired Area'];
  const landCategoryAliases = ['land_category', 'जमिनीचा प्रकार'];
  const landTypeAliases = ['land_type_classification', 'जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार'];
  const approvedRateAliases = ['approved_rate_per_hectare', 'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये'];
  const marketValueAliases = ['market_value_acquired_area', 'संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू'];
  const section26FactorAliases = ['section_26_2_factor', 'कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)'];
  const section26CompAliases = ['section_26_compensation', 'कलम 26 नुसार जमिनीचा मोबदला (9X10)'];
  const buildingsAmountAliases = ['buildings_amount', 'बांधकामे'];
  const forestAmountAliases = ['forest_trees_amount', 'वनझाडे'];
  const fruitAmountAliases = ['fruit_trees_amount', 'फळझाडे'];
  const wellsAmountAliases = ['wells_borewells_amount', 'विहिरी/बोअरवेल'];
  const totalStructuresAliases = ['total_structures_amount', 'एकुण रक्कम रुपये (16+18+ 20+22)'];
  const totalCompAliases = ['total_compensation_amount', 'एकुण रक्कम (14+23)'];
  const determinedCompAliases = ['determined_compensation', 'निर्धारित मोबदला 26 = (24+25)'];
  const additional25Aliases = ['additional_25_percent_compensation', 'एकूण रक्कमेवर  25%  वाढीव मोबदला \n(अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)'];
  const totalFinalAliases = ['total_final_compensation', 'एकुण मोबदला (26+ 27)'];
  const deductionAliases = ['deduction_amount', 'वजावट रक्कम रुपये'];
  const finalPayableAliases = ['final_payable_amount', 'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)'];
  const remarksAliases = ['remarks', 'शेरा'];

  const survey_number = asString(pick(row, surveyAliases));
  const landowner_name = asString(pick(row, ownerAliases));
  // Prefer village record area, fall back to acquired area
  const areaCandidate = pick(row, areaVillageAliases);
  const areaFallback = pick(row, acquiredAliases);
  const area = parseNumber(areaCandidate !== undefined ? areaCandidate : areaFallback, 0);

  const record = {
    project_id: defaults.project_id,
    serial_number: asString(pick(row, serialAliases), `ROB-${String(idx + 1).padStart(4, '0')}`),
    survey_number: survey_number || `UNKNOWN-${idx + 1}`,
    landowner_name: landowner_name || 'Unknown',
    area,
    old_survey_number: asString(pick(row, oldSurveyAliases), ''),
    new_survey_number: asString(pick(row, newSurveyAliases), ''),
    group_number: asString(pick(row, groupAliases), ''),
    cts_number: asString(pick(row, ctsAliases), ''),
    village: defaults.village,
    taluka: defaults.taluka,
    district: defaults.district,
    land_category: asString(pick(row, landCategoryAliases), ''),
    land_type_classification: asString(pick(row, landTypeAliases), ''),
    approved_rate_per_hectare: parseNumber(pick(row, approvedRateAliases), undefined),
    market_value_acquired_area: parseNumber(pick(row, marketValueAliases), undefined),
    section_26_2_factor: parseNumber(pick(row, section26FactorAliases), undefined),
    section_26_compensation: parseNumber(pick(row, section26CompAliases), undefined),
    buildings_amount: parseNumber(pick(row, buildingsAmountAliases), undefined),
    forest_trees_amount: parseNumber(pick(row, forestAmountAliases), undefined),
    fruit_trees_amount: parseNumber(pick(row, fruitAmountAliases), undefined),
    wells_borewells_amount: parseNumber(pick(row, wellsAmountAliases), undefined),
    total_structures_amount: parseNumber(pick(row, totalStructuresAliases), undefined),
    total_compensation_amount: parseNumber(pick(row, totalCompAliases), undefined),
    determined_compensation: parseNumber(pick(row, determinedCompAliases), undefined),
    additional_25_percent_compensation: parseNumber(pick(row, additional25Aliases), undefined),
    total_final_compensation: parseNumber(pick(row, totalFinalAliases), undefined),
    deduction_amount: parseNumber(pick(row, deductionAliases), undefined),
    final_payable_amount: parseNumber(pick(row, finalPayableAliases), undefined),
    remarks: asString(pick(row, remarksAliases), ''),
    kyc_status: 'pending',
    payment_status: 'pending',
    data_format: 'mixed',
    source_file_name: defaults.source_file_name,
    import_batch_id: defaults.import_batch_id
  };

  // Preserve extra fields into notes JSON
  const knownKeys = new Set([
    ...serialAliases,
    ...surveyAliases, ...oldSurveyAliases, ...newSurveyAliases, ...groupAliases,
    ...ctsAliases, ...ownerAliases, ...areaVillageAliases, ...acquiredAliases,
    ...landCategoryAliases, ...landTypeAliases, ...approvedRateAliases,
    ...marketValueAliases, ...section26FactorAliases, ...section26CompAliases,
    ...buildingsAmountAliases, ...forestAmountAliases, ...fruitAmountAliases,
    ...wellsAmountAliases, ...totalStructuresAliases, ...totalCompAliases,
    ...determinedCompAliases, ...additional25Aliases, ...totalFinalAliases,
    ...deductionAliases, ...finalPayableAliases, ...remarksAliases
  ].map(normalizeKey));
  const extras = {};
  for (const [k, v] of Object.entries(row)) {
    const nk = normalizeKey(k);
    if (!knownKeys.has(nk)) extras[k] = v;
  }
  if (Object.keys(extras).length > 0) {
    record.extra_fields = extras;
    record.notes_json = extras;
    record.notes = `Extras: ${JSON.stringify(extras)}`;
  }

  return record;
}

async function backupExisting(projectId, projectName) {
  const outDir = path.join(__dirname, 'backups');
  ensureDir(outDir);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(outDir, `${projectName.replace(/\s+/g, '_')}-backup-${ts}.json`);
  const existing = await MongoLandownerRecord.find({ project_id: projectId }).lean();
  fs.writeFileSync(outFile, JSON.stringify(existing, null, 2), 'utf-8');
  console.log(`🗂️ Backup written: ${outFile}`);
}

async function main() {
  const opts = parseArgs();
  console.log('🚚 Import options:', opts);

  await connectMongoDBAtlas();
  const project = await findOrCreateProject({
    projectName: opts.projectName,
    district: opts.district,
    taluka: opts.taluka,
    village: opts.village
  });

  if (opts.backup) {
    await backupExisting(project._id, opts.projectName);
  }

  if (opts.clearFirst) {
    const del = await MongoLandownerRecord.deleteMany({ project_id: project._id });
    console.log(`🧹 Cleared existing records for project: ${del.deletedCount}`);
  }

  // Read input JSON
  const inputPath = opts.input;
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  const raw = fs.readFileSync(inputPath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Failed to parse JSON. Ensure the file contains valid JSON.');
    throw e;
  }

  let rows = [];
  if (Array.isArray(data)) rows = data;
  else if (Array.isArray(data?.rows)) rows = data.rows;
  else if (Array.isArray(data?.data)) rows = data.data;
  else if (typeof data === 'object' && data) rows = Object.values(data);
  else throw new Error('Unsupported JSON structure: expected array or object of rows');

  console.log(`📄 Found ${rows.length} rows in input`);
  if (rows.length === 0) {
    console.log('Nothing to import. Exiting.');
    process.exit(0);
  }

  const defaults = {
    project_id: project._id,
    district: opts.district,
    taluka: opts.taluka,
    village: opts.village,
    source_file_name: path.basename(inputPath),
    import_batch_id: `rob-${Date.now()}`
  };

  const records = rows.map((row, idx) => buildRecord(row, defaults, idx));

  // Validate minimal requirements
  const invalid = records.filter(r => !r.survey_number || !r.landowner_name || typeof r.area !== 'number');
  if (invalid.length > 0) {
    console.warn(`⚠️ ${invalid.length} rows missing required fields; they will still be imported with defaults.`);
  }

  // Bulk insert in chunks to avoid index contention
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < records.length; i += CHUNK) {
    const batch = records.slice(i, i + CHUNK);
    try {
      const res = await MongoLandownerRecord.insertMany(batch, { ordered: false });
      inserted += res.length;
      console.log(`✅ Inserted batch ${Math.floor(i / CHUNK) + 1}: ${res.length}`);
    } catch (err) {
      // ordered:false allows continuing on duplicates, capture partial success
      const writeErrors = err?.writeErrors || [];
      const successCount = batch.length - writeErrors.length;
      inserted += successCount;
      console.warn(`⚠️ Batch ${Math.floor(i / CHUNK) + 1} had ${writeErrors.length} write errors, inserted ${successCount}`);
    }
  }

  console.log(`🎯 Import complete. Inserted ${inserted} records.`);

  // Show sample
  const sample = await MongoLandownerRecord.find({ project_id: project._id }).limit(3);
  console.log('🔎 Sample records:', sample.map(s => ({
    serial_number: s.serial_number,
    survey_number: s.survey_number,
    landowner_name: s.landowner_name,
    area: s.area,
    village: s.village,
    taluka: s.taluka,
    district: s.district,
    kyc_status: s.kyc_status,
    payment_status: s.payment_status
  })));

  await mongoose.connection.close();
  console.log('🔚 Closed MongoDB connection.');
}

main().catch(async (err) => {
  console.error('❌ Import failed:', err?.message || err);
  console.error(err);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});