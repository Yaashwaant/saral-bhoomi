import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📊 Analyzing Excel file structure...');

try {
  // Read Excel file
  const excelFilePath = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');
  console.log(`📖 Reading Excel file: ${excelFilePath}`);
  
  const workbook = XLSX.readFile(excelFilePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log(`📋 Sheet name: ${sheetName}`);
  
  // Get the actual cell range
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  console.log(`📊 Sheet range: ${range.s.r} to ${range.e.r} (rows), ${range.s.c} to ${range.e.c} (cols)`);
  
  // Show first 10 rows as they appear in the sheet
  console.log('\n📋 First 10 rows of raw data:');
  for (let row = 0; row < Math.min(10, range.e.r + 1); row++) {
    let rowData = [];
    for (let col = 0; col < Math.min(15, range.e.c + 1); col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      rowData.push(cell ? cell.v : '');
    }
    console.log(`Row ${row + 1}: ${rowData.join(' | ')}`);
  }
  
  // Try different range settings to find the actual headers
  console.log('\n🔍 Trying different header row options:');
  
  for (let headerRow = 0; headerRow < 10; headerRow++) {
    try {
      const data = XLSX.utils.sheet_to_json(worksheet, { range: headerRow, defval: '' });
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        const hasMeaningfulHeaders = keys.some(key => 
          key.includes('खातेदार') || 
          key.includes('स.नं') || 
          key.includes('क्षेत्र') ||
          key.includes('रक्कम')
        );
        
        console.log(`\nHeader row ${headerRow + 1}:`);
        console.log(`Keys: ${keys.slice(0, 10).join(', ')}${keys.length > 10 ? '...' : ''}`);
        
        if (hasMeaningfulHeaders) {
          console.log('✅ Found meaningful Marathi headers!');
          console.log(`Sample data:`, data[0]);
          break;
        }
      }
    } catch (error) {
      console.log(`Row ${headerRow + 1}: Error - ${error.message}`);
    }
  }
  
  console.log('\n✅ Excel analysis completed!');
  
} catch (error) {
  console.error('❌ Error analyzing Excel file:', error);
  process.exit(1);
}