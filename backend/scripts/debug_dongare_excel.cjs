const XLSX = require('xlsx');

function debugDongareExcel() {
  try {
    const filePath = 'd:\\LandRecords for Villages\\DONGARE LAND FINAL AWARD.xlsx';
    
    console.log('=== Debugging Dongare Excel File ===');
    console.log('File:', filePath);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet names:', workbook.SheetNames);
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with different options
    console.log('\n=== Raw data (first 15 rows) ===');
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      const row = rawData[i];
      console.log(`Row ${i + 1}:`, row);
    }
    
    console.log('\n=== Looking for potential headers ===');
    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      const row = rawData[i];
      if (row && Array.isArray(row) && row.length > 0) {
        const rowStr = row.join(' ').toLowerCase();
        console.log(`Row ${i + 1} text:`, rowStr);
        
        // Check for various header indicators
        const indicators = ['survey', 'owner', 'name', 'amount', 'area', 'compensation', 'गट', 'नाव', 'मालक', 'रक्कम'];
        const matches = indicators.filter(indicator => rowStr.includes(indicator));
        if (matches.length > 0) {
          console.log(`  -> Potential header (matches: ${matches.join(', ')})`);
        }
      }
    }
    
    // Try different parsing approaches
    console.log('\n=== Alternative parsing (with headers) ===');
    const dataWithHeaders = XLSX.utils.sheet_to_json(worksheet);
    console.log('First 3 records with auto-detected headers:');
    for (let i = 0; i < Math.min(3, dataWithHeaders.length); i++) {
      console.log(`Record ${i + 1}:`, dataWithHeaders[i]);
    }
    
    // Get sheet range
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log('\n=== Sheet Info ===');
    console.log('Range:', worksheet['!ref']);
    console.log('Rows:', range.e.r + 1);
    console.log('Columns:', range.e.c + 1);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugDongareExcel();