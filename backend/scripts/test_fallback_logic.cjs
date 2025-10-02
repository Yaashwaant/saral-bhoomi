const fs = require('fs');
const path = require('path');
const { extractJMRDataFromExcel } = require('../utils/excelHeaderExtractor');

function toNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  const cleaned = String(val).replace(/[\s,₹]/g, '').replace(/[^0-9.+-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

// Test the extraction and fallback logic
const filePath = "../../Chandrapada New 20.01.23-.xlsx";
const startRow = 8;

console.log(`Testing extraction from: ${filePath}`);
console.log(`Start row: ${startRow}`);

try {
  const fileBuffer = fs.readFileSync(filePath);
  const result = extractJMRDataFromExcel(fileBuffer, startRow);
  
  console.log('Extraction success:', result.success);
  console.log('Records extracted:', result.records?.length || 0);
  
  if (result.records && result.records.length > 0) {
    console.log('\nTesting fallback logic on first record:');
    const firstRecord = result.records[0];
    
    console.log('Original values:');
    console.log('  rec.final_amount:', firstRecord.final_amount);
    console.log('  rec.final_payable_amount:', firstRecord.final_payable_amount);
    console.log('  rec.total_final_compensation:', firstRecord.total_final_compensation);
    
    console.log('\nTesting fallback expression:');
    const fallbackValue = firstRecord.final_amount || firstRecord.final_payable_amount || firstRecord.total_final_compensation;
    console.log('  rec.final_amount || rec.final_payable_amount || rec.total_final_compensation:', fallbackValue);
    
    console.log('\nTesting toNumber on fallback:');
    const finalAmount = toNumber(fallbackValue);
    console.log('  toNumber(fallbackValue):', finalAmount);
    
    console.log('\nTesting individual toNumber calls:');
    console.log('  toNumber(rec.final_amount):', toNumber(firstRecord.final_amount));
    console.log('  toNumber(rec.final_payable_amount):', toNumber(firstRecord.final_payable_amount));
    console.log('  toNumber(rec.total_final_compensation):', toNumber(firstRecord.total_final_compensation));
  }
} catch (error) {
  console.error('Extraction failed:', error.message);
}