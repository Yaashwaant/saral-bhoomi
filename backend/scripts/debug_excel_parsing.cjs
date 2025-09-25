const XLSX = require('xlsx');
const path = require('path');

/**
 * DETAILED EXCEL PARSING DEBUGGER
 * This script will show us exactly what's happening with the Marathi Excel file
 */

const EXCEL_FILE_PATH = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');

function debugExcelFile() {
  console.log('🔍 DETAILED EXCEL PARSING DEBUG');
  console.log('=====================================');
  
  try {
    // Read the Excel file
    console.log('📂 Reading Excel file:', EXCEL_FILE_PATH);
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    console.log('📊 Sheet name:', sheetName);
    
    // Get sheet range
    const range = XLSX.utils.decode_range(sheet['!ref']);
    console.log('📏 Sheet range:', sheet['!ref']);
    console.log('📏 Rows:', range.s.r, 'to', range.e.r, '(total:', range.e.r - range.s.r + 1, ')');
    console.log('📏 Cols:', range.s.c, 'to', range.e.c, '(total:', range.e.c - range.s.c + 1, ')');
    
    // Check specific rows for headers and data
    console.log('\n🔍 EXAMINING SPECIFIC ROWS:');
    console.log('=====================================');
    
    // Check rows 0-10 for headers
    for (let row = 0; row <= 10; row++) {
      console.log(`\n📋 ROW ${row}:`);
      let hasData = false;
      for (let col = 0; col <= Math.min(10, range.e.c); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        if (cell && cell.v) {
          console.log(`  Col ${col}: "${cell.v}" (type: ${cell.t})`);
          hasData = true;
        }
      }
      if (!hasData) {
        console.log('  (empty row)');
      }
    }
    
    // Now check data rows (around row 6 where data should start)
    console.log('\n🔍 EXAMINING DATA ROWS (6-15):');
    console.log('=====================================');
    
    for (let row = 6; row <= 15; row++) {
      console.log(`\n📋 DATA ROW ${row}:`);
      let hasData = false;
      let rowData = {};
      
      for (let col = 0; col <= Math.min(15, range.e.c); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
          console.log(`  Col ${col}: "${cell.v}" (type: ${cell.t})`);
          rowData[col] = cell.v;
          hasData = true;
        }
      }
      
      if (!hasData) {
        console.log('  (empty row)');
      } else {
        console.log('  📊 Row summary:', Object.keys(rowData).length, 'non-empty cells');
      }
    }
    
    // Test different parsing methods
    console.log('\n🔍 TESTING DIFFERENT PARSING METHODS:');
    console.log('=====================================');
    
    // Method 1: sheet_to_json with headers at row 3
    console.log('\n📋 Method 1: Headers at row 3, data from row 6');
    try {
      const jsonData1 = XLSX.utils.sheet_to_json(sheet, { 
        range: { s: { r: 3, c: 0 }, e: { r: 10, c: range.e.c } },
        header: 1,
        defval: ''
      });
      console.log('Headers (row 3):', jsonData1[0]);
      console.log('First data row (row 6):', jsonData1[3]);
      console.log('Sample records found:', jsonData1.length);
    } catch (error) {
      console.error('Method 1 failed:', error.message);
    }
    
    // Method 2: sheet_to_json with different range
    console.log('\n📋 Method 2: Full range conversion');
    try {
      const jsonData2 = XLSX.utils.sheet_to_json(sheet, { 
        header: 1,
        defval: '',
        raw: false  // This might help with Marathi text
      });
      console.log('Total rows converted:', jsonData2.length);
      console.log('First 5 rows:');
      for (let i = 0; i < Math.min(5, jsonData2.length); i++) {
        console.log(`  Row ${i}:`, Object.keys(jsonData2[i]).length, 'columns');
        // Show first few columns
        const firstCols = Object.entries(jsonData2[i]).slice(0, 5);
        firstCols.forEach(([key, value]) => {
          if (value) console.log(`    ${key}: "${value}"`);
        });
      }
    } catch (error) {
      console.error('Method 2 failed:', error.message);
    }
    
    // Method 3: Raw cell examination for Marathi content
    console.log('\n🔍 CHECKING FOR MARATHI CONTENT:');
    console.log('=====================================');
    
    let marathiCells = 0;
    let englishCells = 0;
    let numericCells = 0;
    let emptyCells = 0;
    
    for (let row = 0; row <= Math.min(20, range.e.r); row++) {
      for (let col = 0; col <= Math.min(20, range.e.c); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        
        if (!cell || !cell.v) {
          emptyCells++;
          continue;
        }
        
        const value = String(cell.v);
        
        // Check if contains Marathi characters (Devanagari script)
        if (/[\u0900-\u097F]/.test(value)) {
          marathiCells++;
          if (marathiCells <= 10) { // Show first 10 Marathi cells
            console.log(`  Marathi cell [${row},${col}]: "${value}"`);
          }
        } else if (/^[0-9.,]+$/.test(value)) {
          numericCells++;
        } else {
          englishCells++;
        }
      }
    }
    
    console.log(`\n📊 CELL TYPE SUMMARY (first 21x21 area):`);
    console.log(`  📝 Marathi cells: ${marathiCells}`);
    console.log(`  🔤 English cells: ${englishCells}`);
    console.log(`  🔢 Numeric cells: ${numericCells}`);
    console.log(`  ⭕ Empty cells: ${emptyCells}`);
    
    console.log('\n✅ Excel debug analysis completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugExcelFile();
