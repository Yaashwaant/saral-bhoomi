const XLSX = require('xlsx');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Import models (we'll use require since this is CommonJS)
const MongoLandownerRecord = require('../models/mongo/LandownerRecord.js').default;
const MongoProject = require('../models/mongo/Project.js').default;

/**
 * IMPORT ALL 181 ROWS FROM CHANDRAPADA EXCEL FILE
 * This script reads every single row from the Excel file and imports it into the database
 */

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';

// Excel column mapping (based on actual headers from your file)
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
  'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये': 'approved_rate_per_hectare',
  'संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू': 'market_value_acquired_area',
  'कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)': 'section_26_2_factor',
  'कलम 26 नुसार जमिनीचा मोबदला (9X10)': 'section_26_compensation',
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

// Numeric fields that need to be converted to numbers
const NUMERIC_FIELDS = [
  'total_area_village_record', 'acquired_area_sqm_hectare', 'approved_rate_per_hectare',
  'market_value_acquired_area', 'section_26_2_factor', 'section_26_compensation',
  'total_structures_amount', 'total_compensation_amount', 'solatium_100_percent',
  'determined_compensation', 'additional_25_percent_compensation', 'total_final_compensation',
  'deduction_amount', 'final_payable_amount'
];

function cleanValue(value, isNumeric = false) {
  if (value === null || value === undefined || value === '') {
    return isNumeric ? 0 : '';
  }
  
  if (isNumeric) {
    // Convert to string first, then clean
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  return String(value).trim();
}

async function readExcelData() {
  try {
    console.log('🔍 Reading Excel file...');
    
    // Path to Excel file
    const excelPath = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');
    
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Excel file not found: ${excelPath}`);
    }
    
    // Read workbook
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📊 Sheet: ${sheetName}`);
    console.log(`📊 Range: ${worksheet['!ref']}`);
    
    // Parse range
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`📊 Rows: ${range.s.r} to ${range.e.r} (${range.e.r - range.s.r + 1} total)`);
    console.log(`📊 Cols: ${range.s.c} to ${range.e.c} (${range.e.c - range.s.c + 1} total)`);
    
    // Get headers from row 4 (0-indexed row 3)
    const headers = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col });
      const cell = worksheet[cellAddress];
      headers.push(cell ? cell.v : `Column_${col}`);
    }
    
    console.log(`📋 Found ${headers.length} headers`);
    console.log('📋 First 10 headers:', headers.slice(0, 10));
    
    // Extract all data rows starting from row 6 (0-indexed row 5)
    const records = [];
    for (let row = 5; row <= range.e.r; row++) {
      const record = {};
      let hasData = false;
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        const header = headers[col - range.s.c];
        const value = cell ? cell.v : '';
        
        if (header && value !== '') {
          record[header] = value;
          hasData = true;
        }
      }
      
      if (hasData) {
        records.push(record);
      }
    }
    
    console.log(`✅ Extracted ${records.length} records from Excel`);
    
    // Show sample record
    if (records.length > 0) {
      console.log('\n📋 Sample record (first row):');
      const sample = records[0];
      Object.keys(sample).slice(0, 8).forEach(key => {
        console.log(`   ${key}: ${sample[key]}`);
      });
    }
    
    return records;
    
  } catch (error) {
    console.error('❌ Error reading Excel:', error);
    throw error;
  }
}

function convertToDbRecord(excelRow, projectId) {
  // Create base record with required fields
  const dbRecord = {
    project_id: projectId,
    
    // Required fields with fallbacks
    survey_number: cleanValue(excelRow['नविन स.नं.'] || excelRow['जुना स.नं.'] || 'UNKNOWN'),
    landowner_name: cleanValue(excelRow['खातेदाराचे नांव'] || 'Unknown Owner'),
    area: cleanValue(excelRow['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)'] || 0, true),
    
    // Location defaults
    village: 'चंद्रपदा',
    taluka: 'Unknown',
    district: 'Unknown',
    
    // Status defaults
    kyc_status: 'pending',
    payment_status: 'pending',
    notice_generated: false,
    is_active: true,
    
    // Format tracking
    data_format: 'parishisht_k',
    source_file_name: 'Chandrapada New 20.01.23-.xlsx',
    import_batch_id: Date.now().toString()
  };
  
  // Map all Excel columns to DB fields
  Object.keys(COLUMN_MAPPING).forEach(excelCol => {
    const dbField = COLUMN_MAPPING[excelCol];
    if (excelRow[excelCol] !== undefined) {
      const isNumeric = NUMERIC_FIELDS.includes(dbField);
      dbRecord[dbField] = cleanValue(excelRow[excelCol], isNumeric);
    }
  });
  
  return dbRecord;
}

async function importToDatabase() {
  let connection;
  
  try {
    console.log('🚀 Starting Excel import process...');
    
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find or create project
    let project = await MongoProject.findOne({ name: 'Chandrapada Import Project' });
    if (!project) {
      project = new MongoProject({
        name: 'Chandrapada Import Project',
        projectNumber: 'CHANDRAPADA-2023',
        schemeName: 'Chandrapada Land Acquisition',
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
        createdBy: 'excel-import',
        isActive: true
      });
      
      await project.save();
      console.log('📁 Created project:', project.name);
    } else {
      console.log('📁 Using existing project:', project.name);
    }
    
    // Read Excel data
    const excelRecords = await readExcelData();
    
    if (excelRecords.length === 0) {
      console.log('⚠️ No records found in Excel file');
      return;
    }
    
    // Clear existing records for clean import
    const existingCount = await MongoLandownerRecord.countDocuments({ project_id: project._id });
    if (existingCount > 0) {
      console.log(`🗑️ Clearing ${existingCount} existing records...`);
      await MongoLandownerRecord.deleteMany({ project_id: project._id });
    }
    
    // Convert and prepare records
    console.log(`🔄 Converting ${excelRecords.length} Excel records to database format...`);
    const dbRecords = [];
    let successCount = 0;
    let skipCount = 0;
    
    excelRecords.forEach((excelRow, index) => {
      try {
        const dbRecord = convertToDbRecord(excelRow, project._id);
        
        // Basic validation
        if (!dbRecord.survey_number || dbRecord.survey_number === 'UNKNOWN') {
          console.warn(`⚠️ Row ${index + 1}: No survey number, skipping`);
          skipCount++;
          return;
        }
        
        if (!dbRecord.landowner_name || dbRecord.landowner_name === 'Unknown Owner') {
          console.warn(`⚠️ Row ${index + 1}: No landowner name, skipping`);
          skipCount++;
          return;
        }
        
        dbRecords.push(dbRecord);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing row ${index + 1}:`, error.message);
        skipCount++;
      }
    });
    
    console.log(`📊 Conversion complete: ${successCount} records ready, ${skipCount} skipped`);
    
    if (dbRecords.length === 0) {
      console.log('❌ No valid records to import');
      return;
    }
    
    // Insert records in batches
    console.log(`💾 Inserting ${dbRecords.length} records into database...`);
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < dbRecords.length; i += batchSize) {
      const batch = dbRecords.slice(i, i + batchSize);
      await MongoLandownerRecord.insertMany(batch);
      insertedCount += batch.length;
      console.log(`   Inserted ${insertedCount}/${dbRecords.length} records...`);
    }
    
    // Final verification
    const finalCount = await MongoLandownerRecord.countDocuments({ project_id: project._id });
    
    console.log('\n🎉 IMPORT COMPLETED SUCCESSFULLY!');
    console.log('📊 Final Summary:');
    console.log(`   📄 Excel file: Chandrapada New 20.01.23-.xlsx`);
    console.log(`   📊 Excel records found: ${excelRecords.length}`);
    console.log(`   ✅ Successfully imported: ${insertedCount}`);
    console.log(`   ⚠️ Skipped/Errors: ${skipCount}`);
    console.log(`   📦 Database records: ${finalCount}`);
    console.log(`   📁 Project: ${project.name} (ID: ${project._id})`);
    
    // Show sample of imported data
    const sampleRecord = await MongoLandownerRecord.findOne({ project_id: project._id });
    if (sampleRecord) {
      console.log('\n📋 Sample imported record:');
      console.log(`   🆔 Serial: ${sampleRecord.serial_number || 'N/A'}`);
      console.log(`   👤 Name: ${sampleRecord.landowner_name}`);
      console.log(`   📍 Survey: ${sampleRecord.survey_number} (Old: ${sampleRecord.old_survey_number || 'N/A'})`);
      console.log(`   🏷️ Group: ${sampleRecord.group_number || 'N/A'}`);
      console.log(`   📏 Area: ${sampleRecord.total_area_village_record || 'N/A'} Ha`);
      console.log(`   💰 Final Amount: ₹${sampleRecord.final_payable_amount || 'N/A'}`);
      console.log(`   📊 Format: ${sampleRecord.data_format}`);
    }
    
    console.log('\n✨ All Excel rows have been imported into the database!');
    console.log('🌐 You can now view them in the frontend Land Records Management section.');
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    throw error;
  } finally {
    if (connection) {
      await mongoose.disconnect();
      console.log('📦 Disconnected from MongoDB');
    }
  }
}

// Run the import
importToDatabase()
  .then(() => {
    console.log('🏁 Import process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Import process failed:', error);
    process.exit(1);
  });
