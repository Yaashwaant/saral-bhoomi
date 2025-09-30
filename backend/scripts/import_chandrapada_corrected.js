import mongoose from 'mongoose';
import dotenv from 'dotenv';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
// Use backend .env to ensure Atlas connection
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import Project from '../models/mongo/Project.js';
import LandownerRecord from '../models/mongo/LandownerRecord.js';

// Excel to Database mapping (Marathi columns to English fields)
const EXCEL_TO_DB_MAPPING = {
  'अ.क्र.': 'serial_number',
  'खातेदाराचे नांव': 'landowner_name',
  'नविन स.नं.': 'survey_number',
  'जुना स.नं.': 'old_survey_number',
  'गट नं.': 'group_number',
  'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)': 'total_area_village_record',
  'सदर जमिनीचे क्षेत्रफळ (हे.आर)': 'acquired_area_sqm_hectare',
  'दर रक्कमा': 'approved_rate_per_hectare',
  'बांधकामे': 'buildings_count',
  'रक्कम रुपये': 'buildings_amount', // This is __EMPTY in the data
  'वनझाडे': 'forest_trees_count',
  'झाडांची रक्कम रु.': 'forest_trees_amount', // This is __EMPTY_1
  'फळझाडे': 'fruit_trees_count',
  'झाडांची रक्कम रु._1': 'fruit_trees_amount', // This is __EMPTY_2
  'विहिरी/बोअरवेल': 'wells_borewells_count',
  'रक्कम रुपये_1': 'wells_borewells_amount', // This is __EMPTY_3
  'एकुण रक्कम रुपये (16+18+ 20+22)': 'total_structures_amount',
  'एकुण रक्कम (14+23)': 'total_compensation_amount',
  '100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5': 'solatium_100_percent',
  'निर्धारित मोबदला 26 = (24+25)': 'determined_compensation',
  'एकूण रक्कमेवर  25%  वाढीव मोबदला': 'additional_25_percent_compensation',
  'एकुण मोबदला (26+ 27)': 'total_final_compensation',
  'वजावट रक्कम रुपये': 'deduction_amount',
  'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)': 'final_payable_amount'
};

/**
 * Clean and convert Excel values to appropriate data types
 */
function cleanValue(value, type = 'string') {
  if (value === null || value === undefined || value === '') {
    return type === 'number' ? 0 : '';
  }
  
  if (type === 'number') {
    // Remove commas and convert to number
    const numValue = parseFloat(value.toString().replace(/,/g, ''));
    return isNaN(numValue) ? 0 : numValue;
  }
  
  return value.toString().trim();
}

/**
 * Read Excel file and return array of records
 */
function readExcelFile(filePath) {
  try {
    console.log(`📖 Reading Excel file: ${filePath}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found: ${filePath}`);
    }
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log(`📋 Excel file loaded. Sheet name: ${sheetName}`);
    
    // Convert to JSON starting from row 6 (assuming headers are in row 5)
    const data = XLSX.utils.sheet_to_json(worksheet, { range: 4, defval: '' });
    
    console.log(`📊 Found ${data.length} records in Excel file`);
    
    // Show first few column headers for debugging
    if (data.length > 0) {
      console.log('📋 First record keys:', Object.keys(data[0]));
    }
    
    return data;
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
    
    // Set location information
    village: 'चंद्रपदा', // Chandrapada in Marathi
    taluka: 'Bhiwandi',
    district: 'Thane',
    
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
    if (excelRow[excelCol] !== undefined && excelRow[excelCol] !== '') {
      const fieldType = [
        'serial_number',
        'total_area_village_record', 'acquired_area_sqm_hectare', 'approved_rate_per_hectare',
        'buildings_count', 'forest_trees_count', 'fruit_trees_count', 'wells_borewells_count',
        'buildings_amount', 'forest_trees_amount', 'fruit_trees_amount', 'wells_borewells_amount',
        'total_structures_amount', 'total_compensation_amount', 'solatium_100_percent',
        'determined_compensation', 'additional_25_percent_compensation', 'total_final_compensation',
        'deduction_amount', 'final_payable_amount'
      ].includes(dbField) ? 'number' : 'string';
      
      dbRecord[dbField] = cleanValue(excelRow[excelCol], fieldType);
    }
  }

  // Handle special cases for the __EMPTY columns that contain amounts
  if (excelRow['__EMPTY'] !== undefined && excelRow['__EMPTY'] !== '') {
    dbRecord.buildings_amount = cleanValue(excelRow['__EMPTY'], 'number');
  }
  if (excelRow['__EMPTY_1'] !== undefined && excelRow['__EMPTY_1'] !== '') {
    dbRecord.forest_trees_amount = cleanValue(excelRow['__EMPTY_1'], 'number');
  }
  if (excelRow['__EMPTY_2'] !== undefined && excelRow['__EMPTY_2'] !== '') {
    dbRecord.fruit_trees_amount = cleanValue(excelRow['__EMPTY_2'], 'number');
  }
  if (excelRow['__EMPTY_3'] !== undefined && excelRow['__EMPTY_3'] !== '') {
    dbRecord.wells_borewells_amount = cleanValue(excelRow['__EMPTY_3'], 'number');
  }
  
  return dbRecord;
}

/**
 * Main import function
 */
async function importChandrapadaData() {
  try {
    console.log('🚀 Starting Chandrapada Excel data import...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
    console.log(`🔗 Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');
    
    // Create the Chandrapada project with all required fields
    console.log('🏗️ Creating Chandrapada project...');
    const projectData = {
      projectName: 'Chandrapada Land Acquisition Project',
      schemeName: 'Chandrapada Village Land Acquisition Scheme',
      landRequired: 150.50, // Estimated land required in hectares
      landAvailable: 0,
      landToBeAcquired: 150.50,
      type: 'other',
      district: 'Thane',
      taluka: 'Bhiwandi',
      villages: ['चंद्रपदा', 'Chandrapada'],
      estimatedCost: 50000000, // Estimated cost in rupees
      allocatedBudget: 50000000,
      startDate: new Date('2023-01-01'),
      expectedCompletion: new Date('2025-12-31'),
      createdBy: null, // Will be set to system user if needed
      status: {
        overall: 'active',
        stage3A: 'pending',
        stage3D: 'pending',
        corrigendum: 'pending',
        award: 'pending'
      },
      isActive: true,
      description: 'Land acquisition project for Chandrapada village development'
    };
    
    let project = await Project.findOne({ projectName: projectData.projectName });
    if (!project) {
      project = new Project(projectData);
      await project.save();
      console.log(`✅ Created new project: ${project.projectName} (Project Number: ${project.projectNumber})`);
    } else {
      console.log(`ℹ️ Project already exists: ${project.projectName} (Project Number: ${project.projectNumber})`);
    }
    
    // Read Excel file
    const excelFilePath = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');
    console.log(`📖 Reading Excel file from: ${excelFilePath}`);
    const excelRecords = readExcelFile(excelFilePath);
    console.log(`📊 Found ${excelRecords.length} records in Excel file`);
    
    if (excelRecords.length === 0) {
      console.log('⚠️ No records found in Excel file');
      return;
    }
    
    console.log(`📊 Processing ${excelRecords.length} records...`);
    
    // Clear existing records for this project
    const existingCount = await LandownerRecord.countDocuments({ project_id: project._id });
    if (existingCount > 0) {
      console.log(`🗑️ Found ${existingCount} existing records. Clearing them...`);
      await LandownerRecord.deleteMany({ project_id: project._id });
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
          console.warn(`⚠️ Skipping row ${i + 1}: Missing required fields (survey: ${dbRecord.survey_number}, name: ${dbRecord.landowner_name})`);
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
      await LandownerRecord.insertMany(dbRecords, { ordered: false });
      console.log('✅ Successfully inserted all records');
    }
    
    // Final summary
    console.log('\n🎉 CHANDRAPADA IMPORT COMPLETED!');
    console.log(`📊 Summary:`);
    console.log(`   - Total Excel records: ${excelRecords.length}`);
    console.log(`   - Successfully imported: ${successCount}`);
    console.log(`   - Errors/Skipped: ${errorCount}`);
    console.log(`   - Project: ${project.projectName}`);
    console.log(`   - Project Number: ${project.projectNumber}`);
    const dbCount = await LandownerRecord.countDocuments({ project_id: project._id });
    console.log(`   - Database records: ${dbCount}`);

    // Write summary to file for reliable verification
    const summaryPath = path.join(__dirname, 'chandrapada_import_output.txt');
    const summaryLines = [
      `Project: ${project.projectName}`,
      `Project Number: ${project.projectNumber}`,
      `Total Excel records: ${excelRecords.length}`,
      `Successfully imported: ${successCount}`,
      `Errors/Skipped: ${errorCount}`,
      `Database records for project: ${dbCount}`
    ];
    fs.writeFileSync(summaryPath, summaryLines.join('\n'));
    console.log(`📝 Wrote import summary to: ${summaryPath}`);
    
    // Show sample of imported data
    const sampleRecord = await LandownerRecord.findOne({ project_id: project._id });
    if (sampleRecord) {
      console.log('\n📋 Sample imported record:');
      console.log(`   - Serial: ${sampleRecord.serial_number}`);
      console.log(`   - Name: ${sampleRecord.landowner_name}`);
      console.log(`   - Survey: ${sampleRecord.survey_number}`);
      console.log(`   - Old Survey: ${sampleRecord.old_survey_number}`);
      console.log(`   - Group: ${sampleRecord.group_number}`);
      console.log(`   - Area: ${sampleRecord.total_area_village_record} hectares`);
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
  importChandrapadaData()
    .then(() => {
      console.log('🏁 Import process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Import process failed:', error);
      process.exit(1);
    });
}

export default importChandrapadaData;