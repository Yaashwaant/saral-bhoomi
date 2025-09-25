const XLSX = require('xlsx');
const path = require('path');

/**
 * FIND WHAT MAKES EACH ROW UNIQUE
 * Analyze the Excel data to determine the best unique constraint
 */

const EXCEL_FILE_PATH = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');

function findUniqueIdentifier() {
  console.log('🔍 FINDING UNIQUE IDENTIFIER FOR ALL 76 ROWS');
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
    
    console.log('📋 Available columns:');
    headers.forEach((header, i) => {
      if (header) console.log(`  ${i}: ${header}`);
    });
    
    // Extract records
    const records = [];
    for (let row = 6; row <= 83; row++) {
      const record = { _rowNumber: row };
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
        records.push(record);
      }
    }
    
    console.log(`\n📊 Total records: ${records.length}`);
    
    // Test different unique constraints
    const constraints = [
      {
        name: 'Serial Number Only',
        fields: ['अ.क्र'],
        getKey: (r) => `${r['अ.क्र']}`
      },
      {
        name: 'Serial + Name',
        fields: ['अ.क्र', 'खातेदाराचे नांव'],
        getKey: (r) => `${r['अ.क्र']}_${r['खातेदाराचे नांव']}`
      },
      {
        name: 'Name + Old + New + Group',
        fields: ['खातेदाराचे नांव', 'जुना स.नं.', 'नविन स.नं.', 'गट नंबर'],
        getKey: (r) => `${r['खातेदाराचे नांव']}_${r['जुना स.नं.']}_${r['नविन स.नं.']}_${r['गट नंबर']}`
      },
      {
        name: 'Name + Old + New + CTS',
        fields: ['खातेदाराचे नांव', 'जुना स.नं.', 'नविन स.नं.', 'सी.टी.एस. नंबर'],
        getKey: (r) => `${r['खातेदाराचे नांव']}_${r['जुना स.नं.']}_${r['नविन स.नं.']}_${r['सी.टी.एस. नंबर']}`
      },
      {
        name: 'Name + Old + New + Group + CTS',
        fields: ['खातेदाराचे नांव', 'जुना स.नं.', 'नविन स.नं.', 'गट नंबर', 'सी.टी.एस. नंबर'],
        getKey: (r) => `${r['खातेदाराचे नांव']}_${r['जुना स.नं.']}_${r['नविन स.नं.']}_${r['गट नंबर']}_${r['सी.टी.एस. नंबर']}`
      }
    ];
    
    constraints.forEach(constraint => {
      console.log(`\n🔍 Testing: ${constraint.name}`);
      console.log(`Fields: ${constraint.fields.join(' + ')}`);
      
      const uniqueKeys = new Set();
      const duplicates = [];
      
      records.forEach(record => {
        const key = constraint.getKey(record);
        if (uniqueKeys.has(key)) {
          duplicates.push({ record, key });
        } else {
          uniqueKeys.add(key);
        }
      });
      
      console.log(`  Unique records: ${uniqueKeys.size}/${records.length}`);
      console.log(`  Duplicates: ${duplicates.length}`);
      
      if (duplicates.length > 0 && duplicates.length <= 5) {
        console.log(`  Sample duplicates:`);
        duplicates.slice(0, 3).forEach((dup, i) => {
          console.log(`    ${i+1}. Row ${dup.record._rowNumber}: ${dup.key.substring(0, 60)}...`);
        });
      }
    });
    
    // Check the serial numbers specifically
    console.log(`\n🔍 SERIAL NUMBER ANALYSIS:`);
    const serials = records.map(r => r['अ.क्र']).filter(s => s);
    const uniqueSerials = new Set(serials);
    console.log(`Serial numbers: ${serials.length} total, ${uniqueSerials.size} unique`);
    
    if (serials.length !== uniqueSerials.size) {
      console.log(`⚠️  Serial numbers are NOT unique!`);
      const serialCounts = {};
      serials.forEach(s => {
        serialCounts[s] = (serialCounts[s] || 0) + 1;
      });
      
      const duplicateSerials = Object.entries(serialCounts).filter(([, count]) => count > 1);
      console.log(`Duplicate serials:`, duplicateSerials.slice(0, 5));
    } else {
      console.log(`✅ Serial numbers are unique - can be used as primary key!`);
    }
    
    console.log('\n✅ Unique identifier analysis completed!');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

findUniqueIdentifier();
