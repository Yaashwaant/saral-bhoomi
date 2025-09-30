const fs = require('fs');
const path = require('path');
const { extractJMRDataFromExcel } = require('../utils/excelHeaderExtractor');

// Test the extraction to see what fields are being parsed
const filePath = process.argv[2] || '../../Dongare_Final_Amount.xlsx';
const startRow = parseInt(process.argv[3] || '8', 10);

console.log(`Testing extraction from: ${filePath}`);
console.log(`Start row: ${startRow}`);

try {
  const fileBuffer = fs.readFileSync(filePath);
  const result = extractJMRDataFromExcel(fileBuffer, startRow);
  
  console.log('Extraction success:', result.success);
  console.log('Records extracted:', result.records?.length || 0);
  
  if (result.records && result.records.length > 0) {
    console.log('\nFirst record structure:');
    const firstRecord = result.records[0];
    console.log('Available fields:', Object.keys(firstRecord));
    
    console.log('\nAmount field values in first record:');
    console.log('final_amount:', firstRecord.final_amount);
    console.log('final_payable_amount:', firstRecord.final_payable_amount);
    console.log('total_final_compensation:', firstRecord.total_final_compensation);
    
    console.log('\nSample of first 3 records:');
    result.records.slice(0, 3).forEach((record, i) => {
      console.log(`\nRecord ${i + 1}:`);
      console.log('  landowner_name:', record.landowner_name);
      console.log('  survey_number:', record.survey_number);
      console.log('  final_amount:', record.final_amount);
      console.log('  final_payable_amount:', record.final_payable_amount);
      console.log('  total_final_compensation:', record.total_final_compensation);
    });
  }
} catch (error) {
  console.error('Extraction failed:', error.message);
}