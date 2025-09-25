const XLSX = require('xlsx');
const path = require('path');

/**
 * DEBUG THE EXACT IMPORT VALIDATION LOGIC
 * Test the convertToDbRecord function on actual Excel data
 */

const EXCEL_FILE_PATH = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');

// Copy the exact mapping and validation logic from import script
const COLUMN_MAPPING = {
  'अ.क्र': 'serial_number',
  'खातेदाराचे नांव': 'landowner_name', 
  'जुना स.नं.': 'old_survey_number',
  'नविन स.नं.': 'new_survey_number',
  'गट नंबर': 'group_number',
  'सी.टी.एस. नंबर': 'cts_number',
  'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)': 'total_area_village_record',
  'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)': 'acquired_area_sqm_hectare',
  'जमिनीचा प्रकार': 'land_category',
  'जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार': 'land_type_classification',
  'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये': 'approved_rate_per_hectare'
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

function convertToDbRecord(excelRow, projectId) {
  const dbRecord = {
    project_id: projectId,
    survey_number: cleanValue(excelRow['नविन स.नं.'] || excelRow['जुना स.नं.'] || 'UNKNOWN'),
    landowner_name: cleanValue(excelRow['खातेदाराचे नांव'] || 'Unknown Owner'),
    area: cleanValue(excelRow['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)'] || 0, true),
    village: 'चंद्रपदा',
    taluka: 'Unknown',
    district: 'Unknown',
    kyc_status: 'pending',
    payment_status: 'pending',
    notice_generated: false,
    is_active: true,
    data_format: 'parishisht_k',
    source_file_name: 'Chandrapada New 20.01.23-.xlsx',
    import_batch_id: Date.now().toString()
  };
  
  // Map all Excel columns to DB fields
  Object.keys(COLUMN_MAPPING).forEach(excelCol => {
    const dbField = COLUMN_MAPPING[excelCol];
    if (excelRow[excelCol] !== undefined) {
      dbRecord[dbField] = cleanValue(excelRow[excelCol]);
    }
  });
  
  return dbRecord;
}

function debugImportValidation() {
  console.log('🔍 DEBUGGING IMPORT VALIDATION LOGIC');
  console.log('=====================================');
  
  try {
    // Read Excel file
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers from row 3
    const jsonData = XLSX.utils.sheet_to_json(sheet, { 
      range: { s: { r: 3, c: 0 }, e: { r: 100, c: 34 } },
      header: 1,
      defval: ''
    });
    
    const headers = jsonData[0];
    console.log('📋 Headers:', headers.slice(0, 5));
    
    // Test validation on specific problematic rows
    const problemRowNumbers = [57, 79, 80, 81, 82, 83];
    
    problemRowNumbers.forEach(rowNum => {
      console.log(`\n🔍 TESTING ROW ${rowNum}:`);
      
      // Get the row data (remember jsonData[0] is headers, so data starts at jsonData[3] for row 6)
      const dataIndex = rowNum - 6 + 1; // Adjust for header row and starting from row 6
      if (dataIndex < jsonData.length) {
        const rowArray = jsonData[dataIndex];
        
        // Convert array to object with headers
        const excelRow = {};
        headers.forEach((header, index) => {
          if (rowArray[index] !== undefined && rowArray[index] !== '') {
            excelRow[header] = rowArray[index];
          }
        });
        
        console.log('  📊 Excel row data:');
        console.log('    Name:', excelRow['खातेदाराचे नांव']);
        console.log('    Old Survey:', excelRow['जुना स.नं.']);
        console.log('    New Survey:', excelRow['नविन स.नं.']);
        
        // Test the conversion
        const dbRecord = convertToDbRecord(excelRow, 'test-project-id');
        
        console.log('  🔄 Converted DB record:');
        console.log('    landowner_name:', dbRecord.landowner_name);
        console.log('    old_survey_number:', dbRecord.old_survey_number);
        console.log('    new_survey_number:', dbRecord.new_survey_number);
        console.log('    survey_number:', dbRecord.survey_number);
        
        // Test validation logic
        console.log('  ✅ Validation checks:');
        
        // Check 1: Landowner name
        const hasValidName = dbRecord.landowner_name && dbRecord.landowner_name !== 'Unknown Owner' && dbRecord.landowner_name.trim() !== '';
        console.log('    Name valid:', hasValidName, hasValidName ? '✅' : '❌');
        
        // Check 2: Survey numbers
        const hasOldSurvey = dbRecord.old_survey_number && dbRecord.old_survey_number !== '';
        const hasNewSurvey = dbRecord.new_survey_number && dbRecord.new_survey_number !== '';
        const hasPrimarySurvey = dbRecord.survey_number && dbRecord.survey_number !== 'UNKNOWN';
        
        console.log('    Old survey valid:', hasOldSurvey, hasOldSurvey ? '✅' : '❌');
        console.log('    New survey valid:', hasNewSurvey, hasNewSurvey ? '✅' : '❌');
        console.log('    Primary survey valid:', hasPrimarySurvey, hasPrimarySurvey ? '✅' : '❌');
        
        const hasAnySurvey = hasOldSurvey || hasNewSurvey || hasPrimarySurvey;
        console.log('    Any survey number:', hasAnySurvey, hasAnySurvey ? '✅' : '❌');
        
        // Final validation result
        const wouldPass = hasValidName && hasAnySurvey;
        console.log('  🏁 FINAL RESULT:', wouldPass ? 'PASS ✅' : 'FAIL ❌');
        
        if (!wouldPass) {
          console.log('    ⚠️  This row would be SKIPPED during import!');
          if (!hasValidName) console.log('       - Missing/invalid landowner name');
          if (!hasAnySurvey) console.log('       - Missing survey numbers');
        }
      } else {
        console.log('  ❌ Row not found in data');
      }
    });
    
    console.log('\n✅ Import validation debugging completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugImportValidation();
