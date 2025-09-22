import fs from 'fs';
import xlsx from 'xlsx';
import path from 'path';

// Simple test to analyze your CSV file conditions
const csvPath = '../Chandrapada New 20.01.23-.csv';

console.log('🔍 Analyzing CSV file conditions...\n');

try {
  // Read the CSV file using xlsx
  const workbook = xlsx.readFile(csvPath, { 
    codepage: 65001, // UTF-8
    cellDates: true,
    cellNF: false,
    cellText: false
  });
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with proper handling
  const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd',
    blankrows: true,
    header: 1
  });
  
  console.log(`📊 Total rows in file: ${jsonData.length}\n`);
  
  // Find header row
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    const keys = Object.keys(row);
    console.log(`Row ${i + 1}: ${keys.slice(0, 3).join(', ')}...`);
    
    if (keys.some(key => key.includes('खातेदाराचे') || key.includes('नांव'))) {
      headerRowIndex = i;
      console.log(`✅ Found header row at index ${i + 1}`);
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    console.log('⚠️ Header row not found, using row 4 as default');
    headerRowIndex = 3;
  }
  
  console.log('\n🔍 Analyzing data conditions:\n');
  
  let validRows = 0;
  let emptyRows = 0;
  let summaryRows = 0;
  let multilineNames = 0;
  let missingData = 0;
  
  // Check each row after header
  const dataRows = jsonData.slice(headerRowIndex + 1);
  
  dataRows.forEach((row, index) => {
    const values = Object.values(row);
    const rowNumber = headerRowIndex + 2 + index;
    const firstValue = String(values[0] || '').trim();
    const secondValue = String(values[1] || '').trim(); // Landowner name
    
    // Check for empty rows
    const nonEmptyValues = values.filter(val => val && val.toString().trim() !== '');
    if (nonEmptyValues.length < 3) {
      emptyRows++;
      return;
    }
    
    // Check for summary rows
    if (firstValue.includes('एकूण') || firstValue.includes('एकुण') ||
        values.some(val => val && (
          val.toString().includes('आस्थापना खर्च') ||
          val.toString().includes('कार्यालयीन खर्च') ||
          val.toString().includes('सक्षम प्राधिकारी') ||
          val.toString().includes('उपजिल्हाधिकारी')
        ))) {
      summaryRows++;
      return;
    }
    
    // Check for invalid serial number
    if (!firstValue || isNaN(parseInt(firstValue)) || parseInt(firstValue) <= 0) {
      if (firstValue) console.log(`⚠️ Row ${rowNumber}: Invalid serial number: "${firstValue}"`);
      return;
    }
    
    // Check for missing landowner name
    if (!secondValue || secondValue.length < 2) {
      missingData++;
      console.log(`⚠️ Row ${rowNumber}: Missing landowner name`);
      return;
    }
    
    // Check for multi-line names
    if (secondValue.includes('\n')) {
      multilineNames++;
      console.log(`📝 Row ${rowNumber}: Multi-line name detected`);
    }
    
    // Check for area values as names (bottom section)
    if (/^0\.[0-9]+$/.test(secondValue)) {
      console.log(`⚠️ Row ${rowNumber}: Area value as name: "${secondValue}"`);
      return;
    }
    
    validRows++;
    
    if (validRows <= 5) {
      console.log(`✅ Row ${rowNumber}: ${secondValue.replace(/\n/g, ' ').substring(0, 50)}...`);
    }
  });
  
  console.log('\n📈 Analysis Summary:');
  console.log(`📊 Total data rows processed: ${dataRows.length}`);
  console.log(`✅ Valid landowner rows: ${validRows}`);
  console.log(`❌ Empty rows: ${emptyRows}`);
  console.log(`📋 Summary/admin rows: ${summaryRows}`);
  console.log(`📝 Multi-line names: ${multilineNames}`);
  console.log(`⚠️ Missing data rows: ${missingData}`);
  
  console.log('\n🎯 Conditions identified:');
  console.log('1. Complex multi-header structure (6 header rows)');
  console.log('2. Multi-line landowner names with embedded newlines');
  console.log('3. Summary rows mixed with data (containing "एकूण")');
  console.log('4. Administrative text rows at bottom');
  console.log('5. Duplicate area values section at end');
  console.log('6. Some missing survey numbers and areas');
  
  console.log('\n✅ Enhanced parser should handle all these conditions!');
  
} catch (error) {
  console.error('❌ Error analyzing CSV:', error.message);
}