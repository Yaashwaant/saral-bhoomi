const XLSX = require('xlsx');
const path = require('path');

/**
 * DEBUG SPECIFIC EXCEL ROWS TO SEE WHY THEY'RE BEING SKIPPED
 */

const EXCEL_FILE_PATH = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');

function debugSpecificRows() {
  console.log('🔍 DEBUGGING SPECIFIC EXCEL ROWS');
  console.log('=====================================');
  
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Get headers from row 3 (0-indexed)
    const headers = [];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col });
      const cell = sheet[cellAddress];
      if (cell && cell.v) {
        headers[col] = cell.v;
      }
    }
    
    console.log('📋 Headers (row 3):', headers.length, 'columns');
    
    // Check rows 6-100 for actual data
    console.log('\n🔍 CHECKING ROWS 6-100 FOR DATA:');
    console.log('=====================================');
    
    let validRows = 0;
    let emptyRows = 0;
    let partialRows = 0;
    
    for (let row = 6; row <= 100; row++) {
      let cellCount = 0;
      let hasName = false;
      let hasSurveyNumber = false;
      let rowData = {};
      
      // Check key columns
      for (let col = 0; col <= Math.min(15, range.e.c); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
          cellCount++;
          const header = headers[col];
          if (header) {
            rowData[header] = cell.v;
            
            // Check for landowner name (column 1)
            if (col === 1 && cell.v && String(cell.v).trim()) {
              hasName = true;
            }
            
            // Check for survey numbers (columns 2, 3)
            if ((col === 2 || col === 3) && cell.v) {
              hasSurveyNumber = true;
            }
          }
        }
      }
      
      if (cellCount === 0) {
        emptyRows++;
        if (emptyRows <= 5) {
          console.log(`  Row ${row}: EMPTY`);
        }
      } else if (hasName && hasSurveyNumber) {
        validRows++;
        if (validRows <= 10) {
          console.log(`  Row ${row}: VALID - Name: "${rowData['खातेदाराचे नांव']}" | Old Survey: "${rowData['जुना स.नं.']}" | New Survey: "${rowData['नविन स.नं.']}" | Cells: ${cellCount}`);
        }
      } else {
        partialRows++;
        if (partialRows <= 10) {
          console.log(`  Row ${row}: PARTIAL - Name: ${hasName ? 'YES' : 'NO'} | Survey: ${hasSurveyNumber ? 'YES' : 'NO'} | Cells: ${cellCount}`);
          if (rowData['खातेदाराचे नांव']) {
            console.log(`    Name: "${rowData['खातेदाराचे नांव']}"`);
          }
        }
      }
    }
    
    console.log(`\n📊 SUMMARY (rows 6-100):`);
    console.log(`  ✅ Valid rows (name + survey): ${validRows}`);
    console.log(`  ⚠️  Partial rows (missing key data): ${partialRows}`);
    console.log(`  ❌ Empty rows: ${emptyRows}`);
    
    // Now check the specific rows that were mentioned in the import log
    console.log('\n🔍 CHECKING SPECIFIC PROBLEM ROWS:');
    console.log('=====================================');
    
    const problemRows = [57, 79, 80, 81, 82, 83, 84, 85];
    
    problemRows.forEach(rowNum => {
      console.log(`\n📋 ROW ${rowNum}:`);
      let rowData = {};
      let cellCount = 0;
      
      for (let col = 0; col <= Math.min(10, range.e.c); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: col });
        const cell = sheet[cellAddress];
        
        if (cell && cell.v !== undefined && cell.v !== null && cell.v !== '') {
          const header = headers[col];
          if (header) {
            rowData[header] = cell.v;
            cellCount++;
            console.log(`  ${header}: "${cell.v}"`);
          }
        }
      }
      
      if (cellCount === 0) {
        console.log('  (completely empty)');
      } else {
        console.log(`  Total cells with data: ${cellCount}`);
      }
    });
    
    console.log('\n✅ Row debugging completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSpecificRows();
