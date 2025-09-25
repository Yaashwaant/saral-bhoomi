const XLSX = require('xlsx');
const path = require('path');

/**
 * DEBUG WHY ROWS 78-159 ARE MISSING LANDOWNER NAMES
 */

const EXCEL_FILE_PATH = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');

function debugMissingRows() {
  console.log('🔍 DEBUGGING MISSING LANDOWNER NAMES IN ROWS 78-159');
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
    
    console.log('📋 Header for landowner name (col 1):', headers[1]);
    
    // Check specific problematic rows
    const problemRows = [78, 79, 80, 81, 82, 83, 84, 85, 90, 95, 100, 120, 140, 159];
    
    problemRows.forEach(excelRowNum => {
      const actualRowIndex = excelRowNum + 6; // Convert to 0-indexed Excel row
      console.log(`\n📋 EXCEL ROW ${excelRowNum} (actual Excel row ${actualRowIndex + 1}):`);
      
      // Check landowner name column (column 1)
      const nameCell = XLSX.utils.encode_cell({ r: actualRowIndex, c: 1 });
      const nameValue = sheet[nameCell];
      
      console.log(`  Name cell address: ${nameCell}`);
      console.log(`  Name cell value:`, nameValue ? `"${nameValue.v}" (type: ${nameValue.t})` : 'EMPTY');
      
      // Check if row has any data at all
      let hasAnyData = false;
      let nonEmptyCells = 0;
      
      for (let col = 0; col <= Math.min(10, range.e.c); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: actualRowIndex, c: col });
        const cell = sheet[cellAddress];
        
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
          hasAnyData = true;
          nonEmptyCells++;
          if (col <= 5) { // Show first few columns
            console.log(`    Col ${col} (${headers[col] || 'Unknown'}): "${cell.v}"`);
          }
        }
      }
      
      if (!hasAnyData) {
        console.log('  📝 ROW IS COMPLETELY EMPTY');
      } else {
        console.log(`  📝 Row has ${nonEmptyCells} non-empty cells`);
      }
    });
    
    // Check where data actually ends
    console.log('\n🔍 FINDING WHERE DATA ACTUALLY ENDS:');
    console.log('=====================================');
    
    let lastRowWithName = 0;
    let lastRowWithAnyData = 0;
    
    for (let row = 6; row <= range.e.r; row++) {
      // Check landowner name column
      const nameCell = XLSX.utils.encode_cell({ r: row, c: 1 });
      const nameValue = sheet[nameCell];
      
      if (nameValue && nameValue.v && String(nameValue.v).trim()) {
        lastRowWithName = row;
      }
      
      // Check if row has any data
      let hasData = false;
      for (let col = 0; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
          hasData = true;
          break;
        }
      }
      
      if (hasData) {
        lastRowWithAnyData = row;
      }
    }
    
    console.log(`📊 Last row with landowner name: ${lastRowWithName} (Excel row ${lastRowWithName + 1})`);
    console.log(`📊 Last row with any data: ${lastRowWithAnyData} (Excel row ${lastRowWithAnyData + 1})`);
    console.log(`📊 Total Excel rows: ${range.e.r + 1}`);
    
    // Show the last few rows with actual data
    console.log('\n🔍 LAST FEW ROWS WITH LANDOWNER NAMES:');
    console.log('=====================================');
    
    for (let row = Math.max(6, lastRowWithName - 5); row <= lastRowWithName; row++) {
      const nameCell = XLSX.utils.encode_cell({ r: row, c: 1 });
      const nameValue = sheet[nameCell];
      const serialCell = XLSX.utils.encode_cell({ r: row, c: 0 });
      const serialValue = sheet[serialCell];
      
      if (nameValue && nameValue.v) {
        console.log(`  Row ${row} (Excel ${row + 1}): Serial ${serialValue?.v || 'N/A'} - "${nameValue.v}"`);
      }
    }
    
    console.log('\n✅ Missing rows debugging completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugMissingRows();
