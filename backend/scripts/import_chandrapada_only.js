import mongoose from 'mongoose';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Import models
import LandownerRecord from '../models/mongo/LandownerRecord.js';
import Project from '../models/mongo/Project.js';

const EXCEL_FILE_PATH = path.join(__dirname, '../../Chandrapada New 20.01.23-.xlsx');
const PROJECT_NAME = 'Chandrapada';

async function importChandrapadaData() {
  try {
    console.log('🚀 Starting Chandrapada data import...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi');
    console.log('✅ Connected to MongoDB');

    // Check if Chandrapada project exists
    let project = await Project.findOne({ projectName: PROJECT_NAME });
    if (!project) {
      console.log(`Creating new project: ${PROJECT_NAME}`);
      project = new Project({
        projectName: PROJECT_NAME,
        schemeName: 'Chandrapada Land Acquisition',
        landRequired: 100, // Default value in hectares
        landAvailable: 0,
        landToBeAcquired: 100,
        type: 'other',
        description: 'Chandrapada village land records',
        district: 'Palghar',
        taluka: 'Dahanu',
        villages: ['Chandrapada'],
        status: { overall: 'active' }
      });
      await project.save();
      console.log(`✅ Created project: ${PROJECT_NAME} (Number: ${project.projectNumber})`);
    } else {
      console.log(`Found existing project: ${PROJECT_NAME} (ID: ${project._id})`);
    }

    // Delete existing Chandrapada landowner records only (preserve other projects)
    console.log('🧹 Cleaning existing Chandrapada records...');
    const deleteResult = await LandownerRecord.deleteMany({ project_id: project._id });
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing Chandrapada records`);

    // Read Excel file
    console.log(`📖 Reading Excel file: ${EXCEL_FILE_PATH}`);
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
    console.log(`📊 Total rows in Excel: ${jsonData.length}`);

    // Extract headers from row 3 (0-indexed row 2)
    const headers = jsonData[2]; // Row 3 in Excel is index 2
    console.log(`📋 Headers found: ${headers.length} columns`);
    console.log('First few headers:', headers.slice(0, 10));

    // Process data starting from row 4 (0-indexed row 3)
    const dataStartRow = 3;
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = dataStartRow; i < jsonData.length; i++) {
      const row = jsonData[i];
      
      // Skip empty rows
      if (!row || row.every(cell => !cell)) {
        console.log(`⏭️  Skipping empty row ${i + 1}`);
        skippedCount++;
        continue;
      }

      try {
        // Calculate total area (using hectares as primary area field)
        const areaHectares = parseFloat(row[3]) || 0;
        const areaAcres = parseFloat(row[4]) || 0;
        const areaGuntas = parseFloat(row[5]) || 0;
        const areaSqMeters = parseFloat(row[6]) || 0;
        
        // Use the first available area measurement, default to 0
        const totalArea = areaHectares || areaAcres * 0.404686 || areaGuntas * 0.010117 || areaSqMeters * 0.0001 || 0.001; // Minimum 0.001 to avoid validation error
        
        // Create landowner record
        const record = new LandownerRecord({
          project_id: project._id,
          serial_number: row[0] ? String(row[0]).trim() : `CHANDRA_${i + 1}`,
          survey_number: row[1] ? String(row[1]).trim() : `SURVEY_${i + 1}`, // Ensure survey_number is not empty
          landowner_name: row[2] ? String(row[2]).trim() : `Owner_${i + 1}`, // Ensure landowner_name is not empty
          area: totalArea, // Required field
          area_hectares: areaHectares,
          area_acres: areaAcres,
          area_guntas: areaGuntas,
          area_sq_meters: areaSqMeters,
          land_type: row[7] ? String(row[7]).trim() : 'Unknown',
          cultivation_type: row[8] ? String(row[8]).trim() : 'Unknown',
          owner_count: parseInt(row[9]) || 1,
          shared_owners: row[10] ? String(row[10]).trim() : '',
          village: 'Chandrapada',
          taluka: 'Dahanu',
          district: 'Palghar',
          source_file_name: 'Chandrapada New 20.01.23-.xlsx',
          row_number: i + 1,
          data_format: 'legacy'
        });

        await record.save();
        importedCount++;
        
        if (importedCount % 10 === 0) {
          console.log(`📈 Progress: ${importedCount} records imported...`);
        }
        
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⏭️  Skipping duplicate record at row ${i + 1}: ${row[2] || 'Unknown'} - ${row[1] || 'Unknown'}`);
          skippedCount++;
        } else {
          console.error(`❌ Error importing row ${i + 1}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${importedCount} records`);
    console.log(`⏭️  Skipped duplicates: ${skippedCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    
    // Calculate total area
    const totalArea = await LandownerRecord.aggregate([
      { $match: { project_id: project._id } },
      { $group: { _id: null, totalHectares: { $sum: '$area_hectares' } } }
    ]);
    
    if (totalArea.length > 0) {
      console.log(`📏 Total area imported: ${totalArea[0].totalHectares.toFixed(3)} hectares`);
    }

    console.log('\n✅ Chandrapada data import completed successfully!');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the import
importChandrapadaData();