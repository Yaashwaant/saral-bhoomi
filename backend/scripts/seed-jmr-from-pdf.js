import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { createRequire } from 'module';
const requirePdf = createRequire(import.meta.url);
const pdfParse = requirePdf('pdf-parse/lib/pdf-parse.js');
import { fileURLToPath } from 'url';
import { connectMongoDBAtlas } from '../config/database.js';

// Dynamic import to avoid circulars
const JMRModelImport = () => import('../models/mongo/JMRRecord.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Usage:
 *  node scripts/seed-jmr-from-pdf.js --pdf "d:/Desk_backup/bhoomi saral mvp/ABC/new_saral_bhoomi/saral-bhoomi/घोळ विवरण पत्र दुरुस्ती.pdf" --project "Your Project" --district "Your District" --taluka "Your Taluka" --village "Your Village"
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const map = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const val = args[i + 1];
    map[key] = val;
  }
  return map;
}

function normalizeNumber(nStr) {
  if (nStr == null) return null;
  const cleaned = String(nStr).replace(/[,\s]/g, '').replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function splitHectareAre(str) {
  // Accept patterns like "1.23" (hectares) or "1-23" (hectare-are)
  if (!str) return { hectare: null, are: null };
  const s = String(str).trim();
  const dash = s.split(/[-–—]/);
  if (dash.length === 2) {
    return { hectare: normalizeNumber(dash[0]), are: normalizeNumber(dash[1]) };
  }
  return { hectare: normalizeNumber(s), are: null };
}

function extractRowsFromText(text) {
  // Heuristic: split by newline, find sections with many columns separated by tabs or multiple spaces
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    // Replace multiple spaces with a single tab to help splitting
    const normalized = line.replace(/\s{2,}/g, '\t');
    const parts = normalized.split('\t').map(p => p.trim()).filter(Boolean);
    // expecting >= 8-12 columns depending on format; tune threshold to reduce noise
    if (parts.length >= 8) {
      rows.push(parts);
    }
  }
  return rows;
}

function mapRowToRecord(parts, meta) {
  // parts index mapping will vary per PDF; we try common Marathi order: serial, owner, survey, group, area, category, remarks
  const [col0, col1, col2, col3, col4, col5, col6, col7] = parts;

  // Minimal JMRRecord fields
  const survey_number = (col2 || col1 || '').toString();
  const measured_area = normalizeNumber(col4) ?? normalizeNumber(col5);
  const land_type = (col6 || '').toString();
  const remarks = (col7 || '').toString();

  return {
    survey_number,
    measured_area,
    land_type,
    village: meta.village,
    taluka: meta.taluka,
    district: meta.district,
    remarks
  };
}

async function main() {
  const { pdf, project, district, taluka, village } = parseArgs();
  if (!pdf || !project || !district || !taluka || !village) {
    console.error('Usage: node scripts/seed-jmr-from-pdf.js --pdf <path> --project <name> --district <name> --taluka <name> --village <name>');
    process.exit(1);
  }
  const pdfPath = path.isAbsolute(pdf) ? pdf : path.resolve(__dirname, '..', pdf);
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found:', pdfPath);
    process.exit(1);
  }

  // Connect DB
  const ok = await connectMongoDBAtlas();
  if (!ok) {
    console.error('Failed to connect to MongoDB Atlas using config.env MONGODB_URI');
    process.exit(1);
  }

  const { default: JMRRecord } = await JMRModelImport();

  // Read PDF and extract text
  const dataBuffer = fs.readFileSync(pdfPath);
  const parsed = await pdfParse(dataBuffer);
  const text = parsed.text;

  // Derive rows
  const rawRows = extractRowsFromText(text);
  console.log(`Found ${rawRows.length} potential row lines from PDF.`);

  const meta = { project, district, taluka, village };
  const docs = rawRows.map(parts => mapRowToRecord(parts, meta)).filter(d => d.survey_number);

  if (docs.length === 0) {
    console.error('No rows mapped. Please verify PDF structure or adjust parser.');
    process.exit(2);
  }

  // Insert
  try {
    const result = await JMRRecord.insertMany(docs, { ordered: false });
    console.log(`Inserted ${result.length} records into JMRRecord.`);
  } catch (e) {
    console.error('Insert error:', e.message);
  }

  // Summary
  console.log('Sample document:', docs[0]);
  console.log('Done.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});