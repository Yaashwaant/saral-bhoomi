const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
require('dotenv').config();

// Import models
const Project = require('../models/Project');
const LandRecord = require('../models/LandRecord');

// Excel file path
const EXCEL_FILE_PATH = path.join(__dirname, '..', 'Khamloli - Mumbai Vadodara Project.xlsx');

// Helper function to parse numbers safely
function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

async function importKhamloliData() {
  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Find the Khamloli project
    const project = await Project.findOne({ 
      projectName: 'Khamloli - Mumbai Vadodara Project' 
    });
    
    if (!project) {
      throw new Error('Khamloli project not found. Please create the project first.');
    }
    
    console.log('Found project:', project.projectName);
    console.log('Project ID:', project._id);

    // Read Excel file
    console.log('Reading Excel file:', EXCEL_FILE_PATH);
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    console.log('Available sheets:', workbook.SheetNames);

    // Get the main data sheet (first sheet)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('Total rows in Excel:', rawData.length);
    console.log('Headers:', rawData[0]);

    // Process each row (skip header row)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      try {
        // Skip empty rows
        if (!row || row.every(cell => !cell)) continue;

        // Create land record data
        const landRecordData = {
          project_id: project._id,
          serial_number: parseNumber(row[0]) || i,
          survey_number: String(row[1] || ''),
          owner_name: String(row[2] || ''),
          father_name: String(row[3] || ''),
          address: String(row[4] || ''),
          area_hectares: parseNumber(row[5]),
          area_acres: parseNumber(row[6]),
          area_guntas: parseNumber(row[7]),
          land_type: String(row[8] || ''),
          market_value_per_hectare: parseNumber(row[9]),
          factor: parseNumber(row[10]),
          compensation_amount: parseNumber(row[11]),
          buildings_count: parseNumber(row[12]),
          building_compensation: parseNumber(row[13]),
          trees_count: parseNumber(row[14]),
          trees_compensation: parseNumber(row[15]),
          wells_count: parseNumber(row[16]),
          wells_compensation: parseNumber(row[17]),
          total_compensation: parseNumber(row[18]),
          final_compensation: parseNumber(row[19]),
          solatium_amount: parseNumber(row[20]),
          final_amount_with_solatium: parseNumber(row[21]),
          enhanced_compensation: parseNumber(row[22]),
          total_final_compensation: parseNumber(row[23]),
          deduction_amount: parseNumber(row[24]),
          net_amount_payable: parseNumber(row[25]),
          remarks: String(row[26] || ''),
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        };

        // Use upsert to handle duplicates
        const result = await LandRecord.findOneAndUpdate(
          {
            project_id: project._id,
            serial_number: landRecordData.serial_number
          },
          landRecordData,
          {
            upsert: true,
            new: true,
            runValidators: true
          }
        );

        if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
          updatedCount++;
        } else {
          insertedCount++;
        }
        
      } catch (error) {
        failedCount++;
        console.error(`Error processing row ${i + 1}:`, error.message);
      }
    }

    // Update project statistics
    const totalRecords = insertedCount + updatedCount;
    await Project.findByIdAndUpdate(project._id, {
      $set: {
        'landDetails.landAvailable': totalRecords,
        'ownerDetails.totalOwners': totalRecords,
        updatedAt: new Date()
      }
    });

    console.log('\n=== Import Summary ===');
    console.log('Total Excel records:', rawData.length - 1); // -1 for header
    console.log('Successfully inserted:', insertedCount);
    console.log('Successfully updated:', updatedCount);
    console.log('Failed to process:', failedCount);
    console.log('Total processed:', totalRecords);
    
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  importKhamloliData()
    .then(() => {
      console.log('Khamloli data import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Khamloli data import failed:', error);
      process.exit(1);
    });
}

module.exports = { importKhamloliData };