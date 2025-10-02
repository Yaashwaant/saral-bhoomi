const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');

const mongoUri = 'mongodb+srv://bhiseyashwant8:wmcdBGmsJvSTjeuh@saral-bhoomi-cluster.ytoaysp.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=saral-bhoomi-cluster';

// ROB Project ID
const ROB_PROJECT_ID = '68da854996a3d559f5005b5c';

// Define the schema for landowner records
const landownerRecordSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  village: String,
  taluka: String,
  district: String,
  survey_number: String,
  sub_division: String,
  owner_name: String,
  area_acquired: Number,
  final_amount: Number,
  final_payable_amount: Number,
  total_final_compensation: Number,
  serial_number: String, // Add serial number to avoid duplicates
  payment_status: { type: String, enum: ['pending', 'completed'], default: 'pending' }, // Add payment status
  data_format: { type: String, default: 'Parishisht-K' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'landownerrecords' });

const LandownerRecord = mongoose.model('LandownerRecord', landownerRecordSchema);

function toNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  const cleaned = String(val).replace(/[\s,₹]/g, '').replace(/[^0-9.+-]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function normalizeRowEnhanced(row) {
  const normalized = {};
  
  // Dongare-specific field mappings based on the Excel structure
  const fieldMappings = {
    // Serial number - column 1 (अ.क्र)
    'serial_number': ['अ.क्र', 'serial_number', 'sr_no', 'अ.क्र.'],
    
    // Survey number - column 3 (स.नं./हि.नं./ग.नं.)
    'survey_number': ['स.नं./हि.नं./ग.नं.', 'survey_number', 'survey no', 'survey', 'sr no', 'sr_no'],
    
    // Owner name - column 2 (खातेदाराचे नांव)
    'owner_name': ['खातेदाराचे नांव', 'owner_name', 'owner name', 'landowner', 'name'],
    
    // Area acquired - column 5 (संपादित जमिनीचे क्षेत्र हेक्टर आर)
    'area_acquired': ['संपादित जमिनीचे क्षेत्र हेक्टर आर', 'area_acquired', 'area acquired', 'area'],
    
    // Final amount - column 27 (हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये)
    'final_amount': ['हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये', 'final_amount', 'final amount'],
    
    // Total compensation - column 25 (एकुण मोबदला)
    'total_final_compensation': ['एकुण मोबदला (23+ 24)', 'total_final_compensation', 'total compensation'],
    
    // Payment status - column 29 (मोबदला वाटप तपशिल)
    'payment_status': ['मोबदला वाटप तपशिल', 'payment_status', 'payment status', 'status'],
    
    // Land type - column 6 (जमिनीचा प्रकार)
    'land_type': ['जमिनीचा प्रकार', 'land_type']
  };

  // Normalize field names and map values
  for (const [standardField, variations] of Object.entries(fieldMappings)) {
    for (const variation of variations) {
      const keys = Object.keys(row);
      const matchingKey = keys.find(key => 
        key && (
          key.trim() === variation ||
          key.toLowerCase().trim() === variation.toLowerCase() ||
          key.includes(variation) ||
          variation.includes(key.trim())
        )
      );
      
      if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== '') {
        normalized[standardField] = row[matchingKey];
        break;
      }
    }
  }

  return normalized;
}

async function importDongareData() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const filePath = 'd:\\LandRecords for Villages\\DONGARE LAND FINAL AWARD.xlsx';
    
    console.log('\n=== Importing Dongare Village Data ===');
    console.log('File:', filePath);
    console.log('Project ID:', ROB_PROJECT_ID);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length === 0) {
      console.log('No data found in Excel file');
      return;
    }
    
    // Headers are in row 4 (index 3) based on the debug output
    const headerRowIndex = 3;
    
    if (rawData.length <= headerRowIndex) {
      console.log('File does not have enough rows');
      return;
    }
    
    const headers = rawData[headerRowIndex];
    console.log('Headers found at row', headerRowIndex + 1, ':', headers);
    
    // Convert data rows to objects
    const records = [];
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;
      
      const rowObj = {};
      headers.forEach((header, index) => {
        if (header && row[index] !== undefined) {
          rowObj[header] = row[index];
        }
      });
      
      // Skip empty rows
      if (Object.values(rowObj).every(val => !val || val === '')) continue;
      
      records.push(rowObj);
    }
    
    console.log(`Found ${records.length} data records`);
    
    if (records.length === 0) {
      console.log('No valid records to import');
      return;
    }
    
    // Process and insert records
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < records.length; i++) {
      try {
        const row = records[i];
        const normalized = normalizeRowEnhanced(row);
        
        // Map payment status: PAID -> completed, anything else -> pending
        let paymentStatus = 'pending';
        if (normalized.payment_status) {
          const statusValue = normalized.payment_status.toString().toUpperCase();
          if (statusValue === 'PAID') {
            paymentStatus = 'completed';
          }
        }

        // Create landowner record
        const landownerRecord = {
          projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
          village: 'Dongare',
          taluka: 'Thane', // Assuming Thane taluka for Dongare
          district: 'Thane', // Assuming Thane district for Dongare
          survey_number: normalized.survey_number || '',
          sub_division: normalized.sub_division || '',
          owner_name: normalized.owner_name || '',
          area_acquired: toNumber(normalized.area_acquired),
          final_amount: toNumber(normalized.final_amount || normalized.total_final_compensation),
          final_payable_amount: toNumber(normalized.final_payable_amount),
          total_final_compensation: toNumber(normalized.total_final_compensation),
          serial_number: normalized.serial_number || `dongare_${i + 1}`, // Use serial number or generate unique ID
          payment_status: paymentStatus, // Add payment status mapping
          data_format: 'Parishisht-K',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Insert record
        await LandownerRecord.create(landownerRecord);
        successCount++;
        
        if (i < 3) {
          console.log(`Sample record ${i + 1}:`, {
            survey_number: landownerRecord.survey_number,
            owner_name: landownerRecord.owner_name,
            area_acquired: landownerRecord.area_acquired,
            final_amount: landownerRecord.final_amount,
            final_payable_amount: landownerRecord.final_payable_amount,
            total_final_compensation: landownerRecord.total_final_compensation
          });
        }
        
      } catch (error) {
        console.error(`Error processing record ${i + 1}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== Import Summary ===');
    console.log(`Successfully imported: ${successCount} records`);
    console.log(`Errors: ${errorCount} records`);
    
    // Verify import
    const totalRecords = await LandownerRecord.countDocuments({ 
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      village: 'Dongare'
    });
    
    console.log(`Total Dongare records in database: ${totalRecords}`);
    
    // Check final_amount population
    const recordsWithFinalAmount = await LandownerRecord.countDocuments({
      projectId: new mongoose.Types.ObjectId(ROB_PROJECT_ID),
      village: 'Dongare',
      final_amount: { $gt: 0 }
    });
    
    console.log(`Records with final_amount > 0: ${recordsWithFinalAmount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

importDongareData();