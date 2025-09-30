import fs from 'fs';
import csv from 'csv-parser';
import XLSX from 'xlsx';

// Reads data from a CSV or Excel file and returns an array of row objects
// type: 'csv' | 'xlsx'
export async function readFileData(filePath, type = 'csv') {
  if (type === 'xlsx') {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    return json;
  }

  // Default: CSV
  return await new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}