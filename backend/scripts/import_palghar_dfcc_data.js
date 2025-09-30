import XLSX from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import path from 'path';
import { fileURLToPath } from 'url';

console.log('📄 Palghar DFCC Import Script - Starting...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * PALGHAR DFCC PROJECT EXCEL TO DATABASE IMPORT SCRIPT
 * This script imports ALL rows from the Palghar DFCC Project.xlsx file into the database
 * with proper field mapping to the new database schema
 */

// Excel column to database field mapping (based on actual Excel headers)
const EXCEL_TO_DB_MAPPING = {
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
  'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये': 'approved_rate_per_hectare',
  'संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू': 'market_value_acquired_area',
  'कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)': 'section_26_2_factor',
  'कलम 26 नुसार जमिनीचा मोबदला (9X10)': 'section_26_compensation',
  'बांधकामे': 'buildings_count',
  'वनझाडे': 'forest_trees_count',
  'फळझाडे': 'fruit_trees_count',
  'विहिरी/बोअरवेल': 'wells_borewells_count',
  'एकुण रक्कम रुपये (16+18+ 20+22)': 'total_structures_amount',
  'एकुण रक्कम (14+23)': 'total_compensation_amount',
  '100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5': 'solatium_100_percent',
  'निर्धारित मोबदला 26 = (24+25)': 'determined_compensation',
  'एकूण रक्कमेवर  25%  वाढीव मोबदला\\n(अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)': 'additional_25_percent_compensation',
  'एकुण मोबदला (26+ 27)': 'total_final_compensation',
  'वजावट रक्कम रुपये': 'deduction_amount',
  'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)': 'final_payable_amount',
  'शेरा': 'remarks'
};

/**
 * Clean and convert value to appropriate type
 */
function cleanValue(value, type = 'string') {
  if (value === null || value === undefined || value === '') {
    return type === 'number' ? 0 : '';
  }
  
  if (type === 'number') {
    // Remove any non-numeric characters except decimal point
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  return String(value).trim();
}

/**
 * Read Excel file and extract data
 */
function readExcelFile(filePath) {
  try {
    console.log(`📖 Reading Excel file: ${filePath}`);
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get the range of data
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`📊 Excel range: ${worksheet['!ref']}`);
    
    // Extract headers from row 3 (0-indexed) - actual header row
    const headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = worksheet[XLSX.utils.encode_cell({r: 3, c: C})];
      headers.push(headerCell ? headerCell.v : `Column_${C}`);
    }
    
    console.log(`📋 Found ${headers.length} headers from row 3`);
    console.log('📋 Headers:', headers.filter(h => h && !h.startsWith('Column_')).slice(0, 10));
    
    // Extract data starting from row 4 (0-indexed) - right after headers
    const records = [];
    for (let R = 4; R <= range.e.r; ++R) {
      const row = {};
      let hasData = false;
      
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({r: R, c: C})];
        const header = headers[C - range.s.c];
        const value = cell ? cell.v : '';
        
        if (header && value !== '') {
          row[header] = value;
          hasData = true;
        }
      }
      
      if (hasData) {
        records.push(row);
      }
    }
    
    console.log(`✅ Successfully extracted ${records.length} records from Excel`);
    return records;
    
  } catch (error) {
    console.error('❌ Error reading Excel file:', error);
    throw error;
  }
}

/**
 * Convert Excel row to database record
 */
function convertExcelRowToDbRecord(excelRow, projectId) {
  const dbRecord = {
    project_id: projectId,
    
    // Set location for Palghar DFCC Project
    village: 'पालघर', // Palghar
    taluka: 'पालघर', // Palghar
    district: 'पालघर', // Palghar
    
    // Basic required fields
    survey_number: cleanValue(excelRow['नविन स.नं.'] || excelRow['जुना स.नं.'] || 'Unknown'),
    landowner_name: cleanValue(excelRow['खातेदाराचे नांव'] || 'Unknown'),
    area: cleanValue(excelRow['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)'] || 0, 'number'),
    
    // Status fields
    kyc_status: 'pending',
    payment_status: 'pending',
    notice_generated: false,
    
    // Format tracking
    data_format: 'parishisht_k',
    source_file_name: 'Palghar DFCC Project.xlsx',
    import_batch_id: Date.now().toString()
  };
  
  // Map all Excel columns to database fields
  for (const [excelCol, dbField] of Object.entries(EXCEL_TO_DB_MAPPING)) {
    if (excelRow[excelCol] !== undefined) {
      const fieldType = [
        'total_area_village_record', 'acquired_area_sqm_hectare', 'approved_rate_per_hectare',
        'market_value_acquired_area', 'section_26_2_factor', 'section_26_compensation',
        'buildings_count', 'forest_trees_count', 'fruit_trees_count', 'wells_borewells_count',
        'total_structures_amount', 'total_compensation_amount', 'solatium_100_percent',
        'determined_compensation', 'additional_25_percent_compensation', 'total_final_compensation',
        'deduction_amount', 'final_payable_amount'
      ].includes(dbField) ? 'number' : 'string';
      
      dbRecord[dbField] = cleanValue(excelRow[excelCol], fieldType);
    }
  }
  
  // Handle special cases for structure amounts (if they exist as separate columns)
  if (excelRow['बांधकामे रक्कम रुपये']) {
    dbRecord.buildings_amount = cleanValue(excelRow['बांधकामे रक्कम रुपये'], 'number');
  }
  if (excelRow['वनझाडे झाडांची रक्कम रु.']) {
    dbRecord.forest_trees_amount = cleanValue(excelRow['वनझाडे झाडांची रक्कम रु.'], 'number');
  }
  if (excelRow['फळझाडे झाडांची रक्कम रु.']) {
    dbRecord.fruit_trees_amount = cleanValue(excelRow['फळझाडे झाडांची रक्कम रु.'], 'number');
  }
  if (excelRow['विहिरी/बोअरवेल रक्कम रुपये']) {
    dbRecord.wells_borewells_amount = cleanValue(excelRow['विहिरी/बोअरवेल रक्कम रुपये'], 'number');
  }
  
  return dbRecord;
}

/**
 * Main import function for Palghar DFCC Project
 */
async function importPalgharDFCCData() {
  try {
    console.log('🚀 Starting Palghar DFCC Project data import...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');
    
    // Find or create a project for the Palghar DFCC data
    let project = await MongoProject.findOne({ projectName: 'Palghar DFCC Project' });
    if (!project) {
      project = new MongoProject({
        projectName: 'Palghar DFCC Project',
        projectNumber: 'PALGHAR-DFCC-2024',
        schemeName: 'Dedicated Freight Corridor - Palghar',
        landRequired: 150, // Estimated based on project scope
        landAvailable: 0,
        landToBeAcquired: 150,
        type: 'railway',
        district: 'पालघर', // Palghar
        taluka: 'पालघर', // Palghar
        villages: ['पालघर'], // Palghar
        status: {
          stage3A: 'pending',
          stage3D: 'pending',
          corrigendum: 'pending',
          award: 'pending'
        },
        // createdBy: 'system', // Commented out - will be set by pre-save hook
        isActive: true
      });
      await project.save();
      console.log('📁 Created new project for Palghar DFCC data');
    } else {
      console.log('📁 Found existing Palghar DFCC project');
    }
    
    // Read Excel file
    const excelFilePath = 'd:\\Desk_backup\\bhoomi saral mvp\\ABC\\new_saral_bhoomi\\saral-bhoomi\\Palghar DFCC Project.xlsx';
    const excelRecords = readExcelFile(excelFilePath);
    
    if (excelRecords.length === 0) {
      console.log('⚠️  No records found in Excel file');
      return;
    }
    
    console.log(`📊 Processing ${excelRecords.length} records...`);
    
    // Convert and save records
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < excelRecords.length; i++) {
      try {
        const excelRow = excelRecords[i];
        const dbRecord = convertExcelRowToDbRecord(excelRow, project._id);
        
        // Check if record already exists (by survey number and landowner)
        const existingRecord = await MongoLandownerRecord.findOne({
          survey_number: dbRecord.survey_number,
          landowner_name: dbRecord.landowner_name,
          project_id: project._id
        });
        
        if (existingRecord) {
          console.log(`⚠️  Skipping duplicate record: ${dbRecord.survey_number} - ${dbRecord.landowner_name}`);
          continue;
        }
        
        // Create new record
        const newRecord = new MongoLandownerRecord(dbRecord);
        await newRecord.save();
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`✅ Processed ${successCount} records...`);
        }
        
      } catch (error) {
        errorCount++;
        errors.push({
          row: i + 1,
          error: error.message,
          data: excelRecords[i]
        });
        console.error(`❌ Error processing row ${i + 1}:`, error.message);
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} records`);
    console.log(`⚠️  Skipped (duplicates): ${excelRecords.length - successCount - errorCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    
    if (errors.length > 0) {
      console.log('\n❌ Error Details:');
      errors.slice(0, 10).forEach(error => {
        console.log(`  Row ${error.row}: ${error.error}`);
      });
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
      }
    }
    
    // Update project statistics
    const totalRecords = await MongoLandownerRecord.countDocuments({ project_id: project._id });
    const totalArea = await MongoLandownerRecord.aggregate([
      { $match: { project_id: project._id } },
      { $group: { _id: null, totalArea: { $sum: '$area' } } }
    ]);
    
    console.log(`\n📈 Project Statistics:`);
    console.log(`📋 Total records: ${totalRecords}`);
    console.log(`📏 Total area: ${totalArea[0]?.totalArea || 0} hectares`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the import if this script is executed directly
console.log('🚀 Script executed directly, starting import...');
importPalgharDFCCData().catch(console.error);

export { importPalgharDFCCData };