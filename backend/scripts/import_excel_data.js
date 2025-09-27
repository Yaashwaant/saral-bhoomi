import XLSX from 'xlsx';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

/**
 * COMPLETE EXCEL TO DATABASE IMPORT SCRIPT
 * This script imports ALL rows from the Chandrapada Excel file into the database
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
  'बांधकामे': 'buildings_count', // This might have count and amount in separate columns
  'वनझाडे': 'forest_trees_count',
  'फळझाडे': 'fruit_trees_count',
  'विहिरी/बोअरवेल': 'wells_borewells_count',
  'एकुण रक्कम रुपये (16+18+ 20+22)': 'total_structures_amount',
  'एकुण रक्कम (14+23)': 'total_compensation_amount',
  '100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5': 'solatium_100_percent',
  'निर्धारित मोबदला 26 = (24+25)': 'determined_compensation',
  'एकूण रक्कमेवर  25%  वाढीव मोबदला\n(अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)': 'additional_25_percent_compensation',
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
    
    // Extract headers from row 3 (0-indexed)
    const headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerCell = worksheet[XLSX.utils.encode_cell({r: 3, c: C})];
      headers.push(headerCell ? headerCell.v : `Column_${C}`);
    }
    
    console.log(`📋 Found ${headers.length} headers`);
    console.log('📋 Headers:', headers.filter(h => h && !h.startsWith('Column_')).slice(0, 10));
    
    // Extract data starting from row 6 (0-indexed row 5)
    const records = [];
    for (let R = 5; R <= range.e.r; ++R) {
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
    
    // Set default location (you can modify these)
    village: 'चंद्रपदा', // Chandrapada
    taluka: 'Unknown',
    district: 'Unknown',
    
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
    source_file_name: 'Chandrapada New 20.01.23-.xlsx',
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
  // You might need to adjust these based on actual Excel structure
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
 * Main import function
 */
async function importExcelData() {
  try {
    console.log('🚀 Starting Excel data import...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');
    
    // Find or create a project for the imported data
    let project = await MongoProject.findOne({ name: 'Chandrapada Project' });
    if (!project) {
      project = new MongoProject({
        name: 'Chandrapada Project',
        projectNumber: 'CHANDRAPADA-2023',
        schemeName: 'Land Acquisition - Chandrapada',
        landRequired: 100,
        landAvailable: 0,
        landToBeAcquired: 100,
        type: 'other',
        district: 'Unknown',
        taluka: 'Unknown',
        villages: ['चंद्रपदा'],
        status: {
          stage3A: 'pending',
          stage3D: 'pending',
          corrigendum: 'pending',
          award: 'pending'
        },
        createdBy: 'system',
        isActive: true
      });
      await project.save();
      console.log('📁 Created new project for Chandrapada data');
    }
    
    // Read Excel file
    const excelFilePath = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');
    const excelRecords = readExcelFile(excelFilePath);
    
    if (excelRecords.length === 0) {
      console.log('⚠️ No records found in Excel file');
      return;
    }
    
    console.log(`📊 Processing ${excelRecords.length} records...`);
    
    // Clear existing records for this project (optional)
    const existingCount = await MongoLandownerRecord.countDocuments({ project_id: project._id });
    if (existingCount > 0) {
      console.log(`🗑️ Found ${existingCount} existing records. Clearing them...`);
      await MongoLandownerRecord.deleteMany({ project_id: project._id });
    }
    
    // Convert and insert records
    const dbRecords = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < excelRecords.length; i++) {
      try {
        const excelRow = excelRecords[i];
        const dbRecord = convertExcelRowToDbRecord(excelRow, project._id);
        
        // Validate required fields
        if (!dbRecord.survey_number || !dbRecord.landowner_name) {
          console.warn(`⚠️ Skipping row ${i + 1}: Missing required fields`);
          errorCount++;
          continue;
        }
        
        dbRecords.push(dbRecord);
        successCount++;
        
        // Show progress every 50 records
        if ((i + 1) % 50 === 0) {
          console.log(`📈 Processed ${i + 1}/${excelRecords.length} records...`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing row ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    // Bulk insert all records
    if (dbRecords.length > 0) {
      console.log(`💾 Inserting ${dbRecords.length} records into database...`);
      await MongoLandownerRecord.insertMany(dbRecords);
      console.log('✅ Successfully inserted all records');
    }
    
    // Final summary
    console.log('\n🎉 EXCEL IMPORT COMPLETED!');
    console.log(`📊 Summary:`);
    console.log(`   - Total Excel records: ${excelRecords.length}`);
    console.log(`   - Successfully imported: ${successCount}`);
    console.log(`   - Errors/Skipped: ${errorCount}`);
    console.log(`   - Project: ${project.name}`);
    console.log(`   - Database records: ${await MongoLandownerRecord.countDocuments({ project_id: project._id })}`);
    
    // Show sample of imported data
    const sampleRecord = await MongoLandownerRecord.findOne({ project_id: project._id });
    if (sampleRecord) {
      console.log('\n📋 Sample imported record:');
      console.log(`   - Serial: ${sampleRecord.serial_number}`);
      console.log(`   - Name: ${sampleRecord.landowner_name}`);
      console.log(`   - Survey: ${sampleRecord.survey_number}`);
      console.log(`   - Old Survey: ${sampleRecord.old_survey_number}`);
      console.log(`   - Group: ${sampleRecord.group_number}`);
      console.log(`   - Area: ${sampleRecord.total_area_village_record}`);
      console.log(`   - Final Amount: ₹${sampleRecord.final_payable_amount}`);
    }
    
  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importExcelData()
    .then(() => {
      console.log('🏁 Import process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import process failed:', error);
      process.exit(1);
    });
}

export default importExcelData;
