#!/usr/bin/env node
const XLSX = require('xlsx');
const fs = require('fs');

function colLetter(n) {
  // 0-indexed to Excel column letters (A, B, ..., Z, AA, AB, ...)
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

// Fill merged cells so each column has its header text even when cells are merged across rows/columns
function fillMerges(ws) {
  const ref = ws['!ref'];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  const merges = ws['!merges'] || [];
  for (const m of merges) {
    const tl = m.s, br = m.e;
    const masterCell = ws[XLSX.utils.encode_cell(tl)];
    const masterText = masterCell && masterCell.v != null ? String(masterCell.v) : '';
    for (let r = tl.r; r <= br.r; r++) {
      for (let c = tl.c; c <= br.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell || cell.v == null || String(cell.v).trim().length === 0) {
          ws[addr] = { t: 's', v: masterText };
        }
      }
    }
  }
}

function sanitizeText(s) {
  if (s == null) return '';
  return String(s).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseArgs(argv) {
  const filePath = argv[2];
  const rest = argv.slice(3);
  const rows = [];
  let outPath = null;

  for (let i = 0; i < rest.length; i++) {
    const tok = rest[i];
    if (tok === '--out' && i + 1 < rest.length) {
      outPath = rest[i + 1];
      i++;
      continue;
    }
    const m = tok.match(/^--out=(.+)$/);
    if (m) {
      outPath = m[1];
      continue;
    }
    const n = parseInt(tok, 10);
    if (Number.isInteger(n) && n > 0) {
      rows.push(n);
    } else if (!outPath) {
      // Fallback: if a non-integer arg is present, treat it as output path
      outPath = tok;
    }
  }

  return { filePath, rowsToRead: rows, outPath };
}

function main() {
  const { filePath, rowsToRead, outPath } = parseArgs(process.argv);
  if (!filePath || rowsToRead.length === 0) {
    console.error('Usage: node scripts/list_columns_rows.cjs "<path-to-xlsx>" <row1> <row2> ... [--out <output.txt>]');
    process.exit(1);
  }
  try {
    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];

    // Ensure merged header cells are filled
    fillMerges(ws);

    const table = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: '' });

    const rowsArr = rowsToRead.map(r => ({ r, cells: table[r - 1] || [] }));
    const maxLen = Math.max(0, ...rowsArr.map(x => x.cells.length));

    const lines = [];
    lines.push(`Sheet: ${sheetName}`);
    lines.push(`Rows: ${rowsToRead.join(', ')}`);
    lines.push('Columns identified from these rows:');

    for (let j = 0; j < maxLen; j++) {
      const parts = rowsArr
        .map(x => sanitizeText(x.cells[j]))
        .filter(v => v.length > 0);
      // Prefer combining unique non-empty parts
      const uniq = [];
      for (const p of parts) { if (!uniq.includes(p)) uniq.push(p); }
      const label = uniq.join(' | ');
      if (label.length > 0) {
        lines.push(`${j + 1} (${colLetter(j)}): ${label}`);
      }
    }

    const output = lines.join('\n');
    if (outPath) {
      fs.writeFileSync(outPath, output, { encoding: 'utf8' });
      console.log(`Wrote ${lines.length} lines to ${outPath}`);
    } else {
      console.log(output);
    }
  } catch (err) {
    console.error('Failed to read XLSX:', err.message);
    process.exit(2);
  }
}

main();