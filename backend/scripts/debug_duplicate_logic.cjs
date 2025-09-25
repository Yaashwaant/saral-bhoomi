const XLSX = require('xlsx');
const path = require('path');

/**
 * DEBUG WHY 65 RECORDS ARE BEING MARKED AS DUPLICATES
 * Check if our unique constraint logic is correct
 */

const EXCEL_FILE_PATH = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');

// Copy the exact mapping and validation logic from import script
const COLUMN_MAPPING = {
  'अ.क्र': 'serial_number',
  'खातेदाराचे नांव': 'landowner_name', 
  'जुना स.नं.': 'old_survey_number',
  'नविन स.नं.': 'new_survey_number',
  'गट नंबर': 'group_number',
  'सी.टी.एस. नंबर': 'cts_number'
};

function cleanValue(value, isNumeric = false) {
  if (value === null || value === undefined || value === '') {
    return isNumeric ? 0 : '';
  }
  
  if (isNumeric) {
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  return String(value).trim();
}

function debugDuplicateLogic() {
  console.log('🔍 DEBUGGING DUPLICATE DETECTION LOGIC');
  console.log('=====================================');
  
  try {
    // Read Excel file
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    
    // Get headers from row 3
    const headers = [];
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col });
      const cell = sheet[cellAddress];
      headers[col] = cell ? cell.v : '';
    }
    
    // Extract records from rows 6-83 (where we know data exists)
    const records = [];
    for (let row = 6; row <= 83; row++) {
      const record = {};
      let hasData = false;
      
      for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
          const header = headers[col];
          if (header) {
            record[header] = cell.v;
            hasData = true;
          }
        }
      }
      
      if (hasData) {
        // Add row number for tracking
        record._rowNumber = row;
        records.push(record);
      }
    }
    
    console.log(`📊 Extracted ${records.length} records from Excel (rows 6-83)`);
    
    // Filter for valid records (same logic as import script)
    const validRecords = records.filter(record => {
      const name = cleanValue(record['खातेदाराचे नांव']);
      const oldSurvey = cleanValue(record['जुना स.नं.']);
      const newSurvey = cleanValue(record['नविन स.नं.']);
      
      const hasValidName = name && name !== 'Unknown Owner' && name.trim() !== '';
      const hasAnySurvey = oldSurvey || newSurvey;
      
      return hasValidName && hasAnySurvey;
    });
    
    console.log(`📊 Valid records after filtering: ${validRecords.length}`);
    
    // Check for duplicates using the same logic as import
    const uniqueKeys = new Map();
    const duplicates = [];
    
    validRecords.forEach((record, index) => {
      const oldSurvey = cleanValue(record['जुना स.नं.']) || '';
      const newSurvey = cleanValue(record['नविन स.नं.']) || '';
      const name = cleanValue(record['खातेदाराचे नांव']) || '';
      
      const uniqueKey = `${oldSurvey}_${newSurvey}_${name}`;
      
      if (uniqueKeys.has(uniqueKey)) {
        duplicates.push({
          index: index + 1,
          row: record._rowNumber,
          key: uniqueKey,
          name: name.substring(0, 50),
          oldSurvey,
          newSurvey,
          original: uniqueKeys.get(uniqueKey)
        });
      } else {
        uniqueKeys.set(uniqueKey, {
          index: index + 1,
          row: record._rowNumber,
          name: name.substring(0, 50),
          oldSurvey,
          newSurvey
        });
      }
    });
    
    console.log(`\n🔍 Duplicate analysis:`);
    console.log(`Unique keys: ${uniqueKeys.size}`);
    console.log(`Duplicate records: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log(`\n📋 First 10 duplicates:`);
      duplicates.slice(0, 10).forEach((dup, i) => {
        console.log(`${i+1}. Row ${dup.row}: "${dup.name}..."`);
        console.log(`   Key: ${dup.oldSurvey} + ${dup.newSurvey} + name`);
        console.log(`   Original: Row ${dup.original.row} - "${dup.original.name}..."`);
        console.log();
      });
      
      // Check if duplicates are actually the same person with same land
      console.log(`\n🔍 Are these REAL duplicates or DIFFERENT records?`);
      const sample = duplicates[0];
      if (sample) {
        console.log(`Sample duplicate analysis:`);
        console.log(`  Duplicate name: "${sample.name}"`);
        console.log(`  Original name:  "${sample.original.name}"`);
        console.log(`  Same survey numbers: ${sample.oldSurvey} → ${sample.newSurvey}`);
        console.log(`  Are names identical? ${sample.name === sample.original.name}`);
      }
    }
    
    // Show what unique records would look like
    console.log(`\n📋 Sample unique records that would be imported:`);
    Array.from(uniqueKeys.values()).slice(0, 10).forEach((record, i) => {
      console.log(`${i+1}. Row ${record.row}: "${record.name}..."`);
      console.log(`   Survey: ${record.oldSurvey} → ${record.newSurvey}`);
    });
    
    console.log('\n✅ Duplicate logic debugging completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugDuplicateLogic();
