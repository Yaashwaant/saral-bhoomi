import express from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import LandownerRecord from '../models/mongo/LandownerRecord.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file upload with UTF-8 support
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${timestamp}-${originalName}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for large Excel files
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

/**
 * Comprehensive column mapping for परिशिष्ट - 'क' format
 * Based on LARR 2013 railway land acquisition compensation
 * Maps Marathi column headers to English database fields
 * Updated to match the exact format from Chandrapada CSV
 */
const PARISHISHT_K_COLUMN_MAPPING = {
  // Column 1: Serial Number  
  'अ.क्र': 'serial_number',
  'अ.क्र.': 'serial_number',
  
  // Column 2: Landowner Name (Primary Key)
  'खातेदाराचे नांव': 'landowner_name',
  'खातेदाराचे_नांव': 'landowner_name',
  
  // Column 3: Old Survey Number  
  'जुना स.नं.': 'old_survey_number',
  'जुना_स.नं.': 'old_survey_number',
  
  // Column 4: New Survey Number (Primary Key)
  'नविन स.नं.': 'survey_number',
  'नविन_स.नं.': 'survey_number',
  
  // Column 5: Group Number
  'गट नंबर': 'group_number',
  'गट_नंबर': 'group_number',
  
  // Column 6: CTS Number
  'सी.टी.एस. नंबर': 'cts_number',
  'सी.टी.एस._नंबर': 'cts_number',
  
  // Column 7: Total Land Area (as per Village Record 7/12)
  'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)': 'total_area_hectare',
  'गांव_नमुना_7/12_नुसार_जमिनीचे_क्षेत्र_(हे.आर)': 'total_area_hectare',
  
  // Column 8: Acquired Land Area (sq.m/hectare)
  'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)': 'acquired_area_hectare',
  'संपादित_जमिनीचे_क्षेत्र_(चौ.मी/हेक्टर_आर)': 'acquired_area_hectare',
  
  // Column 9: Land Type
  'जमिनीचा प्रकार': 'land_type',
  'जमिनीचा_प्रकार': 'land_type',
  
  // Column 10: Land Classification (Agricultural/Non-Agricultural/Rights)
  'जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार': 'land_classification',
  'जमिनीचा_प्रकार_शेती/_बिनशेती/_धारणाधिकार': 'land_classification',
  
  // Column 11: Approved Rate per Hectare (₹)
  'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये': 'approved_rate_per_hectare',
  'मंजुर_केलेला_दर_(प्रति_हेक्टर)_रक्कम_रुपये': 'approved_rate_per_hectare',
  
  // Column 12: Market Value as per Acquired Area (₹)
  'संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू': 'market_value',
  'संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र.रू': 'market_value',
  
  // Column 13: Factor applicable to village as per Section 26(2)
  'कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)': 'section_26_factor',
  'कलम_26_(2)_नुसार_गावास_लागु_असलेले_गणक_Factor_(अ.क्र._5_X_8)': 'section_26_factor',
  
  // Column 14: Land Compensation as per Section 26
  'कलम 26 नुसार जमिनीचा मोबदला (9X10)': 'section_26_compensation',
  'कलम_26_नुसार_जमिनीचा_मोबदला_(9X10)': 'section_26_compensation',
  
  // Columns 15-22: Structures, Trees, Wells
  'बांधकामे': 'structures_buildings',
  'संख्या': 'structures_count',
  'रक्कम रुपये': 'structures_amount',
  'वनझाडे': 'forest_trees',
  'झाडांची संख्या': 'forest_trees_count',
  'झाडांची रक्कम रु.': 'forest_trees_amount',
  'फळझाडे': 'fruit_trees', 
  'विहिरी/बोअरवेल': 'wells_borewells',
  
  // Column 23: Total Amount for Structures/Trees/Wells
  'एकुण रक्कम रुपये (16+18+ 20+22)': 'total_structures_amount',
  'एकुण_रक्कम_रुपये_(16+18+_20+22)': 'total_structures_amount',
  
  // Column 24: Total Basic Amount (14+23)
  'एकुण रक्कम (14+23)': 'total_basic_compensation',
  'एकुण_रक्कम_(14+23)': 'total_basic_compensation',
  
  // Column 25: 100% Solatium
  '100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5': 'solatium_100_percent',
  '100_%__सोलेशियम_(दिलासा_रक्कम)_सेक्शन_30_(1)__RFCT-LARR_2013_अनुसूचि_1_अ.नं._5': 'solatium_100_percent',
  
  // Column 26: Determined Compensation
  'निर्धारित मोबदला 26 = (24+25)': 'determined_compensation_26',
  'निर्धारित_मोबदला_26_=_(24+25)': 'determined_compensation_26',
  
  // Column 27: Additional 25% Compensation
  'एकूण रक्कमेवर  25%  वाढीव मोबदला \n(अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)': 'additional_25_percent',
  'एकूण_रक्कमेवर__25%__वाढीव_मोबदला_\n(अ.क्र._26_नुसार_येणाऱ्या_रक्कमेवर)': 'additional_25_percent',
  
  // Column 28: Total Compensation (26+27)
  'एकुण मोबदला (26+ 27)': 'total_compensation',
  'एकुण_मोबदला_(26+_27)': 'total_compensation',
  
  // Column 29: Deduction Amount
  'वजावट रक्कम रुपये': 'deduction_amount',
  'वजावट_रक्कम_रुपये': 'deduction_amount',
  
  // Column 30: Final Payable Amount
  'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)': 'final_payable_amount',
  'हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये_(अ.क्र._28_वजा_29)': 'final_payable_amount',
  
  // Column 31: Remarks
  'शेरा': 'remarks'
};

// Fix any remaining syntax issues by recreating the mapping object clean
const COLUMN_MAPPING_FALLBACK = {
  'खातेदाराचे नांव': 'landowner_name',
  'नविन स.नं.': 'survey_number', 
  'जुना स.नं.': 'old_survey_number',
  'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)': 'acquired_area_hectare',
  'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)': 'final_payable_amount'
};

/**
 * Helper function to normalize column names for mapping
 * Handles spaces, special characters, and Unicode normalization
 */
const normalizeColumnName = (name) => {
  if (!name) return '';
  
  return String(name)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[""]/g, '"')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .normalize('NFC'); // Normalize Unicode
};

/**
 * Enhanced row normalization function for परिशिष्ट - 'क' format
 * Maps Excel/CSV data to standardized field names
 */
const normalizeParishishtKRow = (row, headerInfo = {}) => {
  console.log('\n🔍 COLUMN MAPPING DEBUG:');
  console.log('📅 Input row keys count:', Object.keys(row).length);
  console.log('📅 Input row keys (first 10):', Object.keys(row).slice(0, 10));
  console.log('📊 First few values:', Object.keys(row).slice(0, 5).map(key => `${key}: "${String(row[key]).substring(0, 30)}..."`));
  
  // Check if the row is completely empty
  const allValues = Object.values(row);
  const nonEmptyValues = allValues.filter(val => val && val.toString().trim() !== '');
  console.log(`📊 Row statistics: ${nonEmptyValues.length}/${allValues.length} non-empty values`);
  
  if (nonEmptyValues.length === 0) {
    console.log('❌ ROW IS COMPLETELY EMPTY - returning default mapping');
    return {
      landowner_name: '',
      survey_number: '',
      village: headerInfo.village || 'चंद्रपाडा',
      taluka: headerInfo.taluka || 'वसई',
      district: headerInfo.district || 'पालघर'
    };
  }
  
  const normalized = {};
  
  // Create normalized versions of all columns
  Object.keys(row).forEach(key => {
    const normalizedKey = normalizeColumnName(key);
    const originalKey = key.trim();
    
    normalized[normalizedKey] = row[key];
    if (originalKey !== normalizedKey) {
      normalized[originalKey] = row[key];
    }
  });
  
  console.log('🔄 Normalized keys available:', Object.keys(normalized).slice(0, 10));
  
  // Map using परिशिष्ट - 'क' column mapping
  const mappedRow = {};
  let mappingCount = 0;
  
  // Map all known columns using primary mapping
  Object.keys(PARISHISHT_K_COLUMN_MAPPING).forEach(marathiColumn => {
    const englishField = PARISHISHT_K_COLUMN_MAPPING[marathiColumn];
    const value = normalized[marathiColumn] || 
                  normalized[normalizeColumnName(marathiColumn)] || 
                  row[marathiColumn] || '';
    
    if (value && value.toString().trim()) {
      // Clean up multi-line names by replacing newlines with spaces
      let cleanedValue = String(value).trim();
      if (englishField === 'landowner_name') {
        const originalValue = cleanedValue;
        cleanedValue = cleanedValue.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
        if (originalValue !== cleanedValue) {
          console.log(`📝 Cleaned multi-line name: "${originalValue.replace(/\n/g, '\\n')}" -> "${cleanedValue}"`);
        }
      }
      mappedRow[englishField] = cleanedValue;
      mappingCount++;
      console.log(`✅ Mapped: "${marathiColumn}" -> "${englishField}" = "${cleanedValue.substring(0, 50)}..."`);
    }
  });
  
  console.log(`📊 Primary mapping found ${mappingCount} fields`);
  
  // Debug: Show what we found so far
  console.log('🔍 Primary mapping results:');
  console.log(`  - landowner_name: "${mappedRow.landowner_name || 'NOT_FOUND'}"`);
  console.log(`  - survey_number: "${mappedRow.survey_number || 'NOT_FOUND'}"`);
  console.log(`  - Total mapped fields: ${Object.keys(mappedRow).length}`);
  
  // Use fallback mapping for key fields if primary mapping failed
  if (!mappedRow.landowner_name || !mappedRow.survey_number) {
    console.log('⚠️ Primary mapping insufficient, trying fallback mapping...');
    console.log(`🔍 Available fallback columns: ${Object.keys(COLUMN_MAPPING_FALLBACK).join(', ')}`);
    
    let fallbackCount = 0;
    
    Object.keys(COLUMN_MAPPING_FALLBACK).forEach(marathiColumn => {
      const englishField = COLUMN_MAPPING_FALLBACK[marathiColumn];
      const value = normalized[marathiColumn] || 
                    normalized[normalizeColumnName(marathiColumn)] || 
                    row[marathiColumn] || '';
      
      if (value && value.toString().trim() && !mappedRow[englishField]) {
        let cleanedValue = String(value).trim();
        if (englishField === 'landowner_name') {
          cleanedValue = cleanedValue.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
        }
        mappedRow[englishField] = cleanedValue;
        fallbackCount++;
        console.log(`🔄 Fallback mapped: "${marathiColumn}" -> "${englishField}" = "${cleanedValue.substring(0, 50)}..."`);
      }
    });
    
    console.log(`📊 Fallback mapping found ${fallbackCount} additional fields`);
  }
  
  // Ensure primary identifiers are captured with flexible matching
  if (!mappedRow.landowner_name) {
    console.log('🔍 Attempting pattern-based landowner name detection...');
    const nameValue = findValueByPattern(row, /खातेदार.*नांव|landowner.*name|नाम|name/i);
    if (nameValue) {
      const cleanedName = String(nameValue).trim().replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
      mappedRow.landowner_name = cleanedName;
      console.log(`🔧 Found landowner name via pattern: "${cleanedName.substring(0, 50)}..."`);
    } else {
      console.log('❌ Could not find landowner name via pattern matching');
    }
  }
  
  if (!mappedRow.survey_number) {
    console.log('🔍 Attempting pattern-based survey number detection...');
    const surveyValue = findValueByPattern(row, /स.*नं|survey.*number|सर्वे|survey/i);
    if (surveyValue) {
      mappedRow.survey_number = String(surveyValue).trim();
      console.log(`🔧 Found survey number via pattern: "${surveyValue}"`);
    } else {
      console.log('❌ Could not find survey number via pattern matching');
    }
  }
  
  // Set default location information (from your data header)
  mappedRow.village = mappedRow.village || headerInfo.village || 'चंद्रपाडा';
  mappedRow.taluka = mappedRow.taluka || headerInfo.taluka || 'वसई';
  mappedRow.district = mappedRow.district || headerInfo.district || 'पालघर';
  
  // Set project information from header
  mappedRow.project_name = headerInfo.project_name || 
    'वेस्टर्न डेडिकेटेड फ्रेट कॉरीडोर रेल्वे उड्डाणपुलाच्या प्रकल्पात';
  mappedRow.proposal_number = headerInfo.proposal_number || '11/2022';
  
  console.log('📄 Final mapped result:');
  console.log(`  👤 Landowner: "${mappedRow.landowner_name || 'NOT_FOUND'}" (length: ${(mappedRow.landowner_name || '').length})`);
  console.log(`  📍 Survey: "${mappedRow.survey_number || 'NOT_FOUND'}" (length: ${(mappedRow.survey_number || '').length})`);
  console.log(`  🏠 Village: "${mappedRow.village}"`);
  console.log(`  💰 Final Amount: "${mappedRow.final_payable_amount || 'N/A'}"`);
  console.log(`  📊 Total fields mapped: ${Object.keys(mappedRow).length}`);
  
  // Final validation check
  const hasRequiredFields = mappedRow.landowner_name && mappedRow.survey_number;
  console.log(`🔍 Required fields check: ${hasRequiredFields ? '✅ PASS' : '❌ FAIL'}`);
  
  return mappedRow;
};

/**
 * Helper function to find values by pattern matching
 */
const findValueByPattern = (row, pattern) => {
  const keys = Object.keys(row);
  const matchingKey = keys.find(key => pattern.test(key));
  return matchingKey ? row[matchingKey] : '';
};

/**
 * Enhanced Excel parsing with proper Unicode and codepage handling
 * Handles परिशिष्ट - 'क' format with multiple header rows
 */
const parseExcelFileWithUnicode = (filePath) => {
  try {
    console.log('\n🔍 STARTING EXCEL FILE PARSING:');
    console.log(`📁 File path: ${filePath}`);
    console.log(`📏 File size: ${require('fs').statSync(filePath).size} bytes`);
    
    // Read with proper codepage for Unicode support
    const workbook = xlsx.readFile(filePath, { 
      codepage: 65001, // UTF-8
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    console.log(`📊 Workbook sheets found: ${workbook.SheetNames.length}`);
    console.log(`📋 Sheet names: ${workbook.SheetNames.join(', ')}`);
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📖 Using sheet: ${sheetName}`);
    
    // Convert to JSON with proper Unicode handling, including empty cells
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
      defval: '',
      raw: false, // Ensure strings
      dateNF: 'yyyy-mm-dd',
      blankrows: true, // Include blank rows to maintain structure
      header: 1 // Use first row as header
    });
    
    console.log(`\n🔍 PARSING परिशिष्ट-क CSV FILE:`);
    console.log(`📊 Total rows found: ${jsonData.length}`);
    
    if (jsonData.length === 0) {
      console.log('❌ ERROR: No data found in Excel file');
      throw new Error('Excel file appears to be empty or unreadable');
    }
    
    // Debug first few rows structure
    console.log('\n🔍 ANALYZING FIRST 10 ROWS:');
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      const keys = Object.keys(row);
      const values = Object.values(row);
      const nonEmptyCount = values.filter(v => v && v.toString().trim()).length;
      
      console.log(`Row ${i + 1}: ${nonEmptyCount} non-empty cells`);
      console.log(`  Keys: ${keys.slice(0, 3).map(k => `"${k}"`).join(', ')}...`);
      console.log(`  Values: ${values.slice(0, 3).map(v => `"${v}"`).join(', ')}...`);
    }
    
    // Find the actual header row (look for 'खातेदाराचे नांव' or similar)
    let headerRowIndex = -1;
    let actualHeaders = [];
    
    console.log('\n🔍 SEARCHING FOR HEADER ROW:');
    for (let i = 0; i < Math.min(10, jsonData.length); i++) {
      const row = jsonData[i];
      const keys = Object.keys(row);
      const values = Object.values(row);
      
      console.log(`🔍 Checking row ${i + 1}:`);
      console.log(`  Keys sample: ${keys.slice(0, 5).map(k => `"${k}"`).join(', ')}`);
      console.log(`  Values sample: ${values.slice(0, 5).map(v => `"${v}"`).join(', ')}`);
      
      // Look for the actual header row with landowner name column
      const hasLandownerHeader = keys.some(key => 
        key.includes('खातेदाराचे') || 
        key.includes('नांव') || 
        key === 'खातेदाराचे नांव' ||
        values.some(val => val && val.toString().includes('खातेदाराचे नांव'))
      );
      
      if (hasLandownerHeader) {
        headerRowIndex = i;
        actualHeaders = keys;
        console.log(`✅ Found header row at index ${i + 1}`);
        console.log(`📋 Full headers found: ${actualHeaders.slice(0, 10).map(h => `"${h}"`).join(', ')}...`);
        break;
      } else {
        console.log(`❌ Row ${i + 1} is not header row`);
      }
    }
    
    if (headerRowIndex === -1) {
      console.log('⚠️ Could not find header row with खातेदाराचे नांव, using row 4 as default');
      headerRowIndex = 3; // Default to row 4 (0-based index 3)
      actualHeaders = Object.keys(jsonData[headerRowIndex] || {});
      console.log(`📋 Default headers: ${actualHeaders.slice(0, 10).map(h => `"${h}"`).join(', ')}...`);
    }
    
    console.log(`\n🔍 EXTRACTING DATA ROWS FROM ROW ${headerRowIndex + 2}:`);
    
    // Extract data rows starting after the header with detailed filtering
    const dataRows = jsonData.slice(headerRowIndex + 1).filter((row, index) => {
      const values = Object.values(row);
      const rowNumber = headerRowIndex + 2 + index; // Actual row number in CSV
      
      console.log(`\n🔍 Processing row ${rowNumber}:`);
      
      // Skip rows that are mostly empty
      const nonEmptyValues = values.filter(val => val && val.toString().trim() !== '');
      console.log(`  Non-empty values: ${nonEmptyValues.length}/${values.length}`);
      
      if (nonEmptyValues.length < 3) {
        console.log(`  ❌ SKIPPED: Too few values (${nonEmptyValues.length} < 3)`);
        return false;
      }
      
      // Get the first column value (should be serial number)
      const firstValue = String(values[0] || '').trim();
      const secondValue = String(values[1] || '').trim(); // Landowner name
      
      console.log(`  First value (serial): "${firstValue}"`);
      console.log(`  Second value (name): "${secondValue.substring(0, 50)}..."`);
      
      // Skip summary rows containing 'एकूण', 'एकुण', administrative text, or totals
      const hasSummaryContent = firstValue.includes('एकूण') || 
          firstValue.includes('एकुण') ||
          firstValue.toLowerCase().includes('total') ||
          values.some(val => val && (
            val.toString().includes('आस्थापना खर्च') ||
            val.toString().includes('कार्यालयीन खर्च') ||
            val.toString().includes('सक्षम प्राधिकारी') ||
            val.toString().includes('उपजिल्हाधिकारी') ||
            val.toString().includes('संजीव जाधवर')
          ));
      
      if (hasSummaryContent) {
        console.log(`  ❌ SKIPPED: Summary/admin row detected`);
        return false;
      }
      
      // Skip rows where first column is not a valid serial number
      const serialNumber = parseInt(firstValue);
      if (!firstValue || isNaN(serialNumber) || serialNumber <= 0) {
        console.log(`  ❌ SKIPPED: Invalid serial number "${firstValue}"`);
        return false;
      }
      
      // Skip if no landowner name
      if (!secondValue || secondValue.length < 2) {
        console.log(`  ❌ SKIPPED: No landowner name ("${secondValue}")`);
        return false;
      }
      
      // Skip if landowner name contains only numbers (likely a summary row)
      if (/^[0-9.,\s]+$/.test(secondValue)) {
        console.log(`  ❌ SKIPPED: Numeric landowner name "${secondValue}"`);
        return false;
      }
      
      // Skip if landowner name is just area value (bottom section duplicates)
      if (/^0\.[0-9]+$/.test(secondValue)) {
        console.log(`  ❌ SKIPPED: Area value as name "${secondValue}"`);
        return false;
      }
      
      console.log(`  ✅ ACCEPTED: Valid data row with landowner "${secondValue.replace(/\n/g, ' ').substring(0, 30)}..."`);
      return true;
    });
    
    console.log(`\n📈 FILTERING RESULTS:`);
    console.log(`📊 Total rows processed: ${jsonData.length}`);
    console.log(`✅ Valid data rows extracted: ${dataRows.length}`);
    console.log(`❌ Filtered out rows: ${jsonData.length - headerRowIndex - 1 - dataRows.length}`);
    
    if (dataRows.length === 0) {
      console.log('❌ ERROR: No valid data rows found after filtering');
      console.log('🔍 This means all rows were either empty, summary rows, or missing required data');
      console.log('🔍 Let me show you the first 5 rows that were rejected:');
      
      const rejectedRows = jsonData.slice(headerRowIndex + 1, headerRowIndex + 6);
      rejectedRows.forEach((row, index) => {
        const values = Object.values(row);
        const firstValue = String(values[0] || '').trim();
        const secondValue = String(values[1] || '').trim();
        console.log(`  Rejected Row ${index + 1}:`);
        console.log(`    First value: "${firstValue}"`);
        console.log(`    Second value: "${secondValue}"`);
        console.log(`    Non-empty values: ${values.filter(v => v && v.toString().trim()).length}`);
      });
      
      throw new Error('No valid landowner data found in the Excel file');
    }
    
    // Remap data using the correct headers
    console.log('\n🔄 REMAPPING DATA WITH HEADERS:');
    const remappedData = dataRows.map((row, index) => {
      const remapped = {};
      actualHeaders.forEach((header, headerIndex) => {
        const value = Object.values(row)[headerIndex];
        if (header && header.trim()) {
          remapped[header.trim()] = value || '';
        }
      });
      
      if (index < 3) { // Log first 3 rows for debugging
        console.log(`🔄 Row ${index + 1} remapped:`);
        console.log(`  Landowner: "${(remapped['खातेदाराचे नांव'] || remapped[actualHeaders[1]] || '').replace(/\n/g, ' ').substring(0, 50)}..."`);
        console.log(`  Survey: "${remapped['नविन स.नं.'] || remapped[actualHeaders[3]] || 'N/A'}"`);
      }
      
      return remapped;
    });
    
    console.log(`✅ Successfully parsed ${remappedData.length} data rows from Excel`);
    return remappedData;
    
  } catch (error) {
    console.error('❌ EXCEL PARSING ERROR:', error.message);
    console.error('📍 Error stack:', error.stack);
    throw new Error(`Excel parsing failed: ${error.message}`);
  }
};

/**
 * Extract project and location information from header/content
 */
const extractHeaderInformation = (data, filename) => {
  return {
    project_name: 'वेस्टर्न डेडिकेटेड फ्रेट कॉरीडोर रेल्वे उड्डाणपुलाच्या प्रकल्पात',
    village: 'चंद्रपाडा',
    taluka: 'वसई',
    district: 'पालघर',
    proposal_number: '11/2022',
    law_reference: 'LARR 2013',
    parishisht: 'क - 1'
  };
};

/**
 * Main CSV/Excel upload route for परिशिष्ट - 'क' format
 */
router.post('/upload/:projectId', upload.single('file'), async (req, res) => {
  console.log('\n🚀 === CSV UPLOAD REQUEST START ===');
  
  try {
    const { projectId } = req.params;
    const { overwrite = false } = req.body;
    const file = req.file;
    
    console.log('📋 Request Details:');
    console.log(`  Project ID: ${projectId}`);
    console.log(`  Overwrite: ${overwrite}`);
    console.log(`  File info:`, {
      originalname: file?.originalname,
      mimetype: file?.mimetype,
      size: file?.size,
      path: file?.path
    });
    
    if (!file) {
      console.log('❌ ERROR: No file uploaded');
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded. Please select a CSV or Excel file.' 
      });
    }
    
    console.log('✅ File received successfully');
    console.log('Processing परिशिष्ट - क file:', file.filename, 'Size:', file.size);
    
    const results = [];
    const errors = [];
    
    // Extract header information
    const headerInfo = extractHeaderInformation([], file.filename);
    console.log('📄 Header info extracted:', headerInfo);
    
    // Determine file type and process accordingly
    const fileExtension = path.extname(file.originalname).toLowerCase();
    console.log('📎 File extension detected:', fileExtension);
    
    if (['.xlsx', '.xls'].includes(fileExtension)) {
      console.log('📈 Processing Excel file...');
      // Process Excel file with Unicode support
      try {
        console.log('🔄 Calling parseExcelFileWithUnicode...');
        const jsonData = parseExcelFileWithUnicode(file.path);
        
        console.log('\n🔍 DEBUGGING EXCEL FILE:');
        console.log('📊 Total rows found in Excel:', jsonData.length);
        if (jsonData.length > 0) {
          console.log('📋 Available columns in first row:', Object.keys(jsonData[0]));
          console.log('📝 First row data sample:', JSON.stringify(jsonData[0], null, 2).substring(0, 500));
        }
        
        jsonData.forEach((row, index) => {
          console.log(`\n🔍 === PROCESSING EXCEL ROW ${index + 1} ===`);
          console.log(`📊 Raw row data:`, Object.keys(row).length > 0 ? 'Has data' : 'Empty row');
          console.log(`📊 Row keys (first 5):`, Object.keys(row).slice(0, 5));
          console.log(`📊 Row values (first 5):`, Object.values(row).slice(0, 5));
          
          const normalizedData = normalizeParishishtKRow(row, headerInfo);
          
          console.log(`📤 Normalized data output:`);
          console.log(`  - landowner_name: "${normalizedData.landowner_name}"`);
          console.log(`  - survey_number: "${normalizedData.survey_number}"`);
          console.log(`  - village: "${normalizedData.village}"`);
          console.log(`  - final_amount: "${normalizedData.final_payable_amount}"`);
          
          // Skip empty rows (rows without landowner name or survey number)
          if (!normalizedData.landowner_name && !normalizedData.survey_number) {
            console.log(`❌ SKIPPING ROW ${index + 2}: Both landowner_name and survey_number are empty`);
            console.log(`  - landowner_name: "${normalizedData.landowner_name}" (length: ${(normalizedData.landowner_name || '').length})`);
            console.log(`  - survey_number: "${normalizedData.survey_number}" (length: ${(normalizedData.survey_number || '').length})`);
            return;
          }
          
          if (!normalizedData.landowner_name) {
            console.log(`⚠️ WARNING ROW ${index + 2}: Missing landowner name but has survey number: "${normalizedData.survey_number}"`);
          }
          
          if (!normalizedData.survey_number) {
            console.log(`⚠️ WARNING ROW ${index + 2}: Missing survey number but has landowner: "${normalizedData.landowner_name}"`);
          }
          
          console.log(`✅ ACCEPTED ROW ${index + 2}: Adding to results array`);
          console.log(`📈 Results array length before push: ${results.length}`);
          results.push({ ...normalizedData, rowIndex: index + 2 }); // +2 for header and 1-based indexing
          console.log(`📈 Results array length after push: ${results.length}`);
        });
        
        console.log(`\n✅ Successfully processed ${results.length} valid rows from Excel out of ${jsonData.length} total`);
        
      } catch (error) {
        console.error('❌ Excel processing error:', error.message);
        console.error('📍 Error stack:', error.stack);
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        return res.status(500).json({ 
          success: false, 
          message: 'Error processing Excel file. Please ensure it follows परिशिष्ट - क format.', 
          error: error.message 
        });
      }
    } else if (fileExtension === '.csv') {
      console.log('📈 Processing CSV file...');
      // Process CSV file with Unicode support
      try {
        const csvData = [];
        
        console.log('🔄 Reading CSV with encoding utf8...');
        await new Promise((resolve, reject) => {
          fs.createReadStream(file.path, { encoding: 'utf8' })
            .pipe(csv({ 
              mapHeaders: ({ header }) => header.trim(),
              skipEmptyLines: true
            }))
            .on('data', (data) => {
              csvData.push(data);
              console.log(`📅 CSV row ${csvData.length} read`);
            })
            .on('end', () => {
              console.log(`✅ CSV reading complete. Total rows: ${csvData.length}`);
              resolve();
            })
            .on('error', (error) => {
              console.error('❌ CSV reading error:', error);
              reject(error);
            });
        });
        
        console.log('\n🔄 Processing CSV data rows...');
        csvData.forEach((row, index) => {
          console.log(`\n🔍 === PROCESSING CSV ROW ${index + 1} ===`);
          const normalizedData = normalizeParishishtKRow(row, headerInfo);
          
          // Skip empty rows
          if (!normalizedData.landowner_name && !normalizedData.survey_number) {
            console.log(`❌ SKIPPING CSV ROW ${index + 2}: No landowner name or survey number`);
            return;
          }
          
          console.log(`✅ ACCEPTED CSV ROW ${index + 2}: Adding to results`);
          results.push({ ...normalizedData, rowIndex: index + 2 });
        });
        
        console.log(`\n✅ Processed ${results.length} valid rows from CSV out of ${csvData.length} total`);
        
      } catch (error) {
        console.error('❌ CSV processing error:', error.message);
        console.error('📍 Error stack:', error.stack);
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        return res.status(500).json({ 
          success: false, 
          message: 'Error processing CSV file. Please ensure it follows परिशिष्ट - क format.', 
          error: error.message 
        });
      }
    }
    
    console.log('\n📊 === VALIDATION PHASE ===');
    // Validate that we have data to process
    if (results.length === 0) {
      console.log('❌ ERROR: No valid data found after processing');
      console.log('📊 Processing summary:');
      console.log(`  - File type: ${fileExtension}`);
      console.log(`  - Results array length: ${results.length}`);
      console.log(`  - Errors array length: ${errors.length}`);
      
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      return res.status(400).json({
        success: false,
        message: 'No valid data found in file. Please ensure the file contains परिशिष्ट - क format data with landowner names and survey numbers.'
      });
    }
    
    console.log(`\n✅ VALIDATION PASSED: Found ${results.length} valid records`);
    console.log('💾 Proceeding to database processing...');
    
    // Process and save the landowner data
    await processParishishtKData(results, projectId, res, errors, overwrite, file.path);
    
  } catch (error) {
    console.error('\n❌ === UPLOAD ERROR ===');
    console.error('📍 Upload error message:', error.message);
    console.error('📍 Full error stack:', error.stack);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Cleaned up uploaded file after error');
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Upload failed. Please try again.', 
      error: error.message 
    });
  }
});

/**
 * Process and save परिशिष्ट - 'क' landowner data to database
 */
async function processParishishtKData(data, projectId, res, errors, overwrite, filePath) {
  const successfulRecords = [];
  
  console.log('\n💾 === DATABASE PROCESSING START ===');
  console.log(`📊 Total records to process: ${data.length}`);
  console.log(`💼 Project ID: ${projectId}`);
  console.log(`🔄 Overwrite mode: ${overwrite}`);
  
  try {
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      console.log(`\n🔍 === PROCESSING DATABASE RECORD ${i + 1}/${data.length} ===`);
      console.log(`📄 Record data:`, {
        rowIndex: row.rowIndex,
        landowner_name: row.landowner_name,
        survey_number: row.survey_number,
        village: row.village,
        final_amount: row.final_payable_amount
      });
      
      try {
        // Validate required fields
        console.log('🔍 Validating required fields...');
        if (!row.landowner_name || !row.survey_number) {
          const errorMsg = `Missing required fields - Landowner Name: '${row.landowner_name}', Survey Number: '${row.survey_number}'`;
          console.log(`❌ VALIDATION FAILED: ${errorMsg}`);
          errors.push({
            row: row.rowIndex || i + 1,
            error: errorMsg
          });
          continue;
        }
        console.log('✅ Required fields validation passed');
        
        // Check for duplicate records if not overwriting
        if (!overwrite) {
          console.log('🔍 Checking for duplicate records...');
          const existingRecord = await LandownerRecord.findOne({
            project_id: projectId,
            survey_number: row.survey_number
          });
          
          if (existingRecord) {
            const errorMsg = `Duplicate survey number found: ${row.survey_number} (${row.landowner_name})`;
            console.log(`❌ DUPLICATE FOUND: ${errorMsg}`);
            errors.push({
              row: row.rowIndex || i + 1,
              error: errorMsg
            });
            continue;
          }
          console.log('✅ No duplicates found');
        } else {
          console.log('🔄 Overwrite mode enabled, skipping duplicate check');
        }
        
        // Create comprehensive landowner record for परिशिष्ट - 'क' format
        const landownerRecord = new LandownerRecord({
          project_id: projectId,
          
          // Primary identification fields
          landowner_name: row.landowner_name,
          survey_number: row.survey_number,
          
          // Additional identification
          old_survey_number: row.old_survey_number || '',
          serial_number: parseInt(row.serial_number || '0') || 0,
          group_number: row.group_number || '',
          cts_number: row.cts_number || '',
          
          // Land area information (convert to standard units)
          area: parseFloat(row.total_area_hectare || '0') || 0,
          acquired_area: parseFloat(row.acquired_area_hectare || '0') || 0,
          
          // Land classification
          land_type: row.land_type || '',
          land_classification: row.land_classification || '',
          
          // Financial rates and calculations
          rate: parseFloat(row.approved_rate_per_hectare || '0') || 0,
          market_value: parseFloat(row.market_value || '0') || 0,
          section_26_factor: parseFloat(row.section_26_factor || '1') || 1,
          section_26_compensation: parseFloat(row.section_26_compensation || '0') || 0,
          
          // Structures and improvements details
          structures_count: parseInt(row.structures_count || '0') || 0,
          structures_amount: parseFloat(row.structures_amount || '0') || 0,
          forest_trees_count: parseInt(row.forest_trees_count || '0') || 0,
          forest_trees_amount: parseFloat(row.forest_trees_amount || '0') || 0,
          fruit_trees_count: parseInt(row.fruit_trees_count || '0') || 0,
          fruit_trees_amount: parseFloat(row.fruit_trees_amount || '0') || 0,
          wells_count: parseInt(row.wells_count || '0') || 0,
          wells_amount: parseFloat(row.wells_amount || '0') || 0,
          
          // Total structure improvements
          structure_trees_wells_amount: parseFloat(row.total_structures_amount || '0') || 0,
          
          // Compensation calculations (as per LARR 2013)
          basic_compensation: parseFloat(row.total_basic_compensation || '0') || 0,
          solatium: parseFloat(row.solatium_100_percent || '0') || 0,
          determined_compensation: parseFloat(row.determined_compensation_26 || '0') || 0,
          additional_compensation: parseFloat(row.additional_25_percent || '0') || 0,
          total_compensation: parseFloat(row.total_compensation || '0') || 0,
          deduction_amount: parseFloat(row.deduction_amount || '0') || 0,
          final_amount: parseFloat(row.final_payable_amount || '0') || 0,
          
          // Location information
          village: row.village || 'चंद्रपाडा',
          taluka: row.taluka || 'वसई',
          district: row.district || 'पालघर',
          
          // Project specific information
          project_name: row.project_name || 'वेस्टर्न डेडिकेटेड फ्रेट कॉरीडोर रेल्वे उड्डाणपुलाच्या प्रकल्पात',
          proposal_number: row.proposal_number || '11/2022',
          parishisht: row.parishisht || 'क - 1',
          
          // Additional information
          remarks: row.remarks || '',
          
          // System workflow fields
          kyc_status: 'pending',
          payment_status: 'pending',
          notice_generated: false,
          is_active: true,
          created_by: null // Set based on authenticated user if available
        });
        
        // Save or update the record
        if (overwrite) {
          console.log('🔄 Using upsert mode (findOneAndUpdate)...');
          console.log('🔍 Query criteria:', { project_id: projectId, survey_number: row.survey_number });
          
          const savedRecord = await LandownerRecord.findOneAndUpdate(
            { project_id: projectId, survey_number: row.survey_number },
            landownerRecord.toObject(),
            { upsert: true, new: true, runValidators: false }
          );
          successfulRecords.push(savedRecord);
          console.log(`✅ UPSERTED record ${i + 1}: ${savedRecord.landowner_name} (ID: ${savedRecord._id})`);
        } else {
          console.log('🆕 Using insert mode (save)...');
          
          const savedRecord = await landownerRecord.save();
          successfulRecords.push(savedRecord);
          console.log(`✅ INSERTED record ${i + 1}: ${savedRecord.landowner_name} (ID: ${savedRecord._id})`);
        }
        
      } catch (error) {
        console.error(`❌ ERROR processing row ${row.rowIndex || i + 1}:`, error.message);
        console.error(`📍 Full error:`, error);
        errors.push({
          row: row.rowIndex || i + 1,
          error: error.message
        });
      }
    }
    
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up uploaded file: ${filePath}`);
    }
    
    console.log('\n📊 === FINAL PROCESSING SUMMARY ===');
    console.log(`✅ Successfully processed: ${successfulRecords.length} records`);
    console.log(`❌ Failed processing: ${errors.length} records`);
    console.log(`📊 Total attempted: ${data.length} records`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERROR DETAILS:');
      errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. Row ${error.row}: ${error.error}`);
      });
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more errors`);
      }
    }
    
    // Send response
    res.json({
      success: true,
      message: `Successfully uploaded ${successfulRecords.length} land records from परिशिष्ट - क format`,
      totalRows: data.length,
      successfulRows: successfulRecords.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors for response size
      errorCount: errors.length,
      format: 'परिशिष्ट - क (LARR 2013)'
    });
    
  } catch (error) {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    console.error('Processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing परिशिष्ट - क data', 
      error: error.message 
    });
  }
}

/**
 * JSON-based CSV ingest route for API calls
 */
router.post('/ingest/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { rows, csvContent, assignToAgent, agentId, generateNotice, overwrite } = req.body;
    
    console.log('परिशिष्ट - क ingest request:', { 
      projectId, 
      rowCount: rows?.length, 
      hasContent: !!csvContent,
      assignToAgent,
      generateNotice,
      overwrite
    });
    
    let data = [];
    const headerInfo = extractHeaderInformation([], 'api-upload');
    
    // Process data from either rows array or csvContent string
    if (rows && Array.isArray(rows)) {
      data = rows.map((row, index) => ({ 
        ...normalizeParishishtKRow(row, headerInfo), 
        rowIndex: index + 2 
      }));
    } else if (csvContent && typeof csvContent === 'string') {
      // Parse CSV content
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          const normalizedRow = normalizeParishishtKRow(row, headerInfo);
          if (normalizedRow.landowner_name || normalizedRow.survey_number) {
            data.push({ ...normalizedRow, rowIndex: i + 1 });
          }
        }
      }
    }
    
    if (!data.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid परिशिष्ट - क data to process' 
      });
    }
    
    console.log(`Processing ${data.length} rows from परिशिष्ट - क format`);
    const errors = [];
    const successfulRecords = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Validate required fields
        if (!row.landowner_name?.trim() || !row.survey_number?.trim()) {
          errors.push({
            row: row.rowIndex || i + 1,
            error: `Missing required fields - Landowner Name: '${row.landowner_name}', Survey Number: '${row.survey_number}'`
          });
          continue;
        }
        
        // Check if record already exists (if not overwriting)
        if (!overwrite) {
          const existingRecord = await LandownerRecord.findOne({
            project_id: projectId,
            survey_number: row.survey_number
          });
          
          if (existingRecord) {
            errors.push({
              row: row.rowIndex || i + 1,
              error: `Record already exists for survey number: ${row.survey_number} (${row.landowner_name})`
            });
            continue;
          }
        }
        
        // Create comprehensive landowner record for परिशिष्ट - 'क'
        const recordData = {
          project_id: projectId,
          
          // Primary identification
          landowner_name: row.landowner_name,
          survey_number: row.survey_number,
          
          // Additional identifiers
          old_survey_number: row.old_survey_number || '',
          serial_number: parseInt(row.serial_number || '0') || 0,
          group_number: row.group_number || '',
          cts_number: row.cts_number || '',
          
          // Land areas
          area: parseFloat(row.total_area_hectare || '0') || 0,
          acquired_area: parseFloat(row.acquired_area_hectare || '0') || 0,
          
          // Financial calculations
          rate: parseFloat(row.approved_rate_per_hectare || '0') || 0,
          market_value: parseFloat(row.market_value || '0') || 0,
          section_26_compensation: parseFloat(row.section_26_compensation || '0') || 0,
          
          // Structures and improvements
          structure_trees_wells_amount: parseFloat(row.total_structures_amount || '0') || 0,
          
          // Compensation calculations
          solatium: parseFloat(row.solatium_100_percent || '0') || 0,
          total_compensation: parseFloat(row.total_compensation || '0') || 0,
          final_amount: parseFloat(row.final_payable_amount || '0') || 0,
          
          // Location information
          village: row.village || 'चंद्रपाडा',
          taluka: row.taluka || 'वसई',
          district: row.district || 'पालघर',
          
          // Project information
          project_name: row.project_name || 'वेस्टर्न डेडिकेटेड फ्रेट कॉरीडोर रेल्वे उड्डाणपुलाच्या प्रकल्पात',
          proposal_number: row.proposal_number || '11/2022',
          parishisht: 'क - 1',
          
          // Agent assignment
          assigned_agent: assignToAgent && agentId ? agentId : undefined,
          assigned_at: assignToAgent && agentId ? new Date() : undefined,
          kyc_status: assignToAgent && agentId ? 'assigned' : 'pending',
          
          // Notice generation
          notice_generated: generateNotice || false,
          notice_date: generateNotice ? new Date() : undefined,
          
          // System fields
          payment_status: 'pending',
          is_active: true
        };
        
        // Save the record (with upsert if overwrite is true)
        if (overwrite) {
          const savedRecord = await LandownerRecord.findOneAndUpdate(
            { project_id: projectId, survey_number: row.survey_number },
            recordData,
            { upsert: true, new: true, runValidators: false }
          );
          successfulRecords.push(savedRecord);
        } else {
          const landownerRecord = new LandownerRecord(recordData);
          const savedRecord = await landownerRecord.save();
          successfulRecords.push(savedRecord);
        }
        
      } catch (error) {
        console.error(`Error processing row ${row.rowIndex || i + 1}:`, error);
        errors.push({
          row: row.rowIndex || i + 1,
          error: error.message
        });
      }
    }
    
    console.log(`Successfully processed ${successfulRecords.length} records from परिशिष्ट - क`);
    
    res.json({
      success: true,
      message: `Successfully uploaded ${successfulRecords.length} land records from परिशिष्ट - क format`,
      totalRows: data.length,
      successfulRows: successfulRecords.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      errorCount: errors.length,
      format: 'परिशिष्ट - क (LARR 2013)'
    });
    
  } catch (error) {
    console.error('परिशिष्ट - क ingest error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'परिशिष्ट - क ingest failed', 
      error: error.message 
    });
  }
});

/**
 * Template download route for परिशिष्ट - 'क' format
 */
router.get('/template', (req, res) => {
  try {
    // Create template based on your exact परिशिष्ट - 'क' structure
    const headers = [
      'अ.क्र', // 1. Serial Number
      'खातेदाराचे नांव', // 2. Landowner Name
      'जुना स.नं.', // 3. Old Survey Number
      'नविन स.नं.', // 4. New Survey Number
      'गट नंबर', // 5. Group Number
      'सी.टी.एस. नंबर', // 6. CTS Number
      'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)', // 7. Total Area
      'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)', // 8. Acquired Area
      'जमिनीचा प्रकार', // 9. Land Type
      'जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार', // 10. Land Classification
      'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये', // 11. Approved Rate
      'संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू', // 12. Market Value
      'कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)', // 13. Section 26 Factor
      'कलम 26 नुसार जमिनीचा मोबदला (9X10)', // 14. Section 26 Compensation
      'बांधकामे संख्या', // 15. Buildings Count
      'बांधकामे रक्कम रुपये', // 16. Buildings Amount
      'वनझाडे संख्या', // 17. Forest Trees Count
      'वनझाडे रक्कम रु.', // 18. Forest Trees Amount
      'फळझाडे संख्या', // 19. Fruit Trees Count
      'फळझाडे रक्कम रु.', // 20. Fruit Trees Amount
      'विहिरी/बोअरवेल संख्या', // 21. Wells Count
      'विहिरी/बोअरवेल रक्कम रुपये', // 22. Wells Amount
      'एकुण रक्कम रुपये (16+18+ 20+22)', // 23. Total Structures Amount
      'एकुण रक्कम (14+23)', // 24. Total Basic Compensation
      '100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5', // 25. 100% Solatium
      'निर्धारित मोबदला 26 = (24+25)', // 26. Determined Compensation
      'एकूण रक्कमेवर  25%  वाढीव मोबदला (अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)', // 27. Additional 25%
      'एकुण मोबदला (26+ 27)', // 28. Total Compensation
      'वजावट रक्कम रुपये', // 29. Deduction Amount
      'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)', // 30. Final Payable Amount
      'शेरा' // 31. Remarks
    ];
    
    // Sample data row based on your first record
    const sampleRow = [
      '1', // Serial Number
      'जनार्दन लक्ष्मण म्हात्रे', // Landowner Name
      '357', // Old Survey Number
      '67', // New Survey Number
      '67/4/अ', // Group Number
      '232', // CTS Number
      '0.1310', // Total Area
      '0.0022', // Acquired Area
      'शेती', // Land Type
      'शेती/वर्ग -1', // Land Classification
      '98600000', // Approved Rate
      '216920', // Market Value
      '1', // Section 26 Factor
      '216920', // Section 26 Compensation
      '0', // Buildings Count
      '0', // Buildings Amount
      '0', // Forest Trees Count
      '0', // Forest Trees Amount
      '0', // Fruit Trees Count
      '0', // Fruit Trees Amount
      '0', // Wells Count
      '0', // Wells Amount
      '0', // Total Structures Amount
      '216920', // Total Basic Compensation
      '216920', // 100% Solatium
      '433840', // Determined Compensation
      '108460', // Additional 25%
      '542300', // Total Compensation
      '0', // Deduction Amount
      '542300', // Final Payable Amount
      '' // Remarks
    ];
    
    const csvContent = headers.join(',') + '\n' + sampleRow.map(v => `"${v}"`).join(',');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="parishisht-k-railway-land-compensation-template.csv"');
    res.send('\uFEFF' + csvContent); // Add BOM for proper UTF-8 display in Excel
    
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Template download failed', 
      error: error.message 
    });
  }
});

/**
 * Get upload status and statistics
 */
router.get('/status/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const stats = await LandownerRecord.aggregate([
      { $match: { project_id: projectId } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalAcquiredArea: { $sum: '$acquired_area' },
          totalCompensation: { $sum: '$total_compensation' },
          totalFinalAmount: { $sum: '$final_amount' },
          pendingKyc: { $sum: { $cond: [{ $eq: ['$kyc_status', 'pending'] }, 1, 0] } },
          completedKyc: { $sum: { $cond: [{ $eq: ['$kyc_status', 'completed'] }, 1, 0] } },
          pendingPayments: { $sum: { $cond: [{ $eq: ['$payment_status', 'pending'] }, 1, 0] } },
          completedPayments: { $sum: { $cond: [{ $eq: ['$payment_status', 'completed'] }, 1, 0] } }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalRecords: 0,
      totalAcquiredArea: 0,
      totalCompensation: 0,
      totalFinalAmount: 0,
      pendingKyc: 0,
      completedKyc: 0,
      pendingPayments: 0,
      completedPayments: 0
    };
    
    res.json({
      success: true,
      format: 'परिशिष्ट - क (LARR 2013)',
      projectId,
      statistics: result
    });
    
  } catch (error) {
    console.error('Status retrieval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve upload status', 
      error: error.message 
    });
  }
});

export default router;