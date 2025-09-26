// Node 18+ required (global fetch).
// Builds a hierarchical Maharashtra admin dataset and writes to public/data/maharashtra-admin.json
// Sources:
// - District→Taluka: https://gist.githubusercontent.com/tejas711/bc5aeb3f2ab3df517e69788359272239/raw
// - Villages (state-wide rows with District/SubDistrict/Village columns):
//   https://raw.githubusercontent.com/pranshumaheshwari/indian-cities-and-villages/master/By%20States/Maharashtra.json

import fs from 'node:fs';
import path from 'node:path';

const DISTRICT_TALUKA_RAW = 'https://gist.githubusercontent.com/tejas711/bc5aeb3f2ab3df517e69788359272239/raw';
const VILLAGES_RAW = 'https://raw.githubusercontent.com/pranshumaheshwari/indian-cities-and-villages/master/By%20States/Maharashtra.json';

const OUT_FILE = path.resolve(process.cwd(), 'public', 'data', 'maharashtra-admin.json');

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${url}`);
  return res.json();
}

function norm(s) {
  return String(s || '').trim();
}

function ensureDir(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}

async function main() {
  console.log('Downloading district→taluka map…');
  const dt = await fetchJson(DISTRICT_TALUKA_RAW);

  let districtTaluka = {};
  if (Array.isArray(dt)) {
    for (const row of dt) {
      const d = row?.district || row?.District || row?.district_name || row?.name || row?.Name;
      const talukas = row?.talukas || row?.tehsils || row?.tahasils || row?.subdistricts || row?.Subdistricts || [];
      if (typeof d === 'string' && Array.isArray(talukas)) {
        districtTaluka[norm(d)] = talukas.map(String);
      }
    }
  } else if (dt && typeof dt === 'object') {
    for (const [k, v] of Object.entries(dt)) {
      if (Array.isArray(v)) districtTaluka[norm(k)] = v.map(String);
    }
  }

  console.log('Downloading villages dataset…');
  const villagesRows = await fetchJson(VILLAGES_RAW);

  const byDistrictTaluka = new Map();
  for (const row of villagesRows || []) {
    const d = norm(row?.District || row?.district || row?.district_name || row?.state_district);
    const t = norm(row?.SubDistrict || row?.subDistrict || row?.taluka || row?.tehsil);
    const v = norm(row?.Village || row?.village || row?.Name || row?.name || row?.city || row?.Town);
    if (!d || !t || !v) continue;
    const key = `${d}|||${t}`;
    if (!byDistrictTaluka.has(key)) byDistrictTaluka.set(key, new Set());
    byDistrictTaluka.get(key).add(v);
  }

  // Build hierarchical output
  const output = [];
  const allDistricts = Object.keys(districtTaluka).sort();
  for (const d of allDistricts) {
    const talukas = (districtTaluka[d] || []).sort();
    const talukaBlocks = talukas.map((t) => {
      const key = `${d}|||${t}`;
      const villages = byDistrictTaluka.has(key)
        ? Array.from(byDistrictTaluka.get(key)).sort()
        : [];
      return { taluka: t, villages };
    });
    output.push({ district: d, talukas: talukaBlocks });
  }

  ensureDir(OUT_FILE);
  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Wrote ${OUT_FILE} with ${output.length} districts.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


