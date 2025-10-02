#!/usr/bin/env node
const XLSX = require('xlsx');

function fillMerges(ws) {
  const merges = ws['!merges'] || [];
  merges.forEach(m => {
    const topLeftAddr = XLSX.utils.encode_cell(m.s);
    const topVal = ws[topLeftAddr] && ws[topLeftAddr].v != null ? ws[topLeftAddr].v : '';
    for (let r = m.s.r; r <= m.e.r; r++) {
      for (let c = m.s.c; c <= m.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr] || ws[addr].v == null || ws[addr].v === '') {
          ws[addr] = { t: 's', v: topVal };
        }
      }
    }
  });
}

function getHeadersFromWorksheet(ws) {
  // Ensure merged header cells are filled down/right so header text is available in each column
  fillMerges(ws);

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' });
  // Consider the first 6 rows as potential header lines (handles multi-row headers)
  const headerRows = rows.slice(0, 6);
  const maxLen = Math.max(0, ...headerRows.map(r => (Array.isArray(r) ? r.length : 0)));

  const headers = [];
  for (let j = 0; j < maxLen; j++) {
    const parts = [];
    for (let i = 0; i < headerRows.length; i++) {
      const cell = headerRows[i] && headerRows[i][j];
      const text = cell != null ? String(cell).trim().replace(/\s+/g, ' ') : '';
      if (text && !parts.includes(text)) parts.push(text);
    }
    const label = parts.join(' | ').trim();
    if (label) headers.push(label);
  }
  return headers;
}

function colLetter(n) {
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: node scripts/list_columns.cjs "<path-to-xlsx>"');
    process.exit(1);
  }
  try {
    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const headers = getHeadersFromWorksheet(ws);
    console.log(`Sheet: ${sheetName}`);
    console.log(`Columns (${headers.length}):`);
    headers.forEach((h, i) => console.log(`${i + 1} (${colLetter(i)}): ${h}`));
  } catch (err) {
    console.error('Failed to read XLSX:', err.message);
    process.exit(2);
  }
}

main();