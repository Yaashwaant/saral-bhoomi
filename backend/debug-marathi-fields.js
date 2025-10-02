import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugMarathiFieldNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    const collection = db.collection('landownerrecords2');

    console.log('=== DEBUGGING MARATHI FIELD NAMES ===\n');

    // Get raw field names from the database
    console.log('1. RAW FIELD NAMES FROM DATABASE:');
    const sampleDoc = await collection.findOne({});
    if (sampleDoc) {
      console.log('Raw field names:');
      Object.keys(sampleDoc).forEach(key => {
        console.log(`   "${key}"`);
        console.log(`   Hex: ${Buffer.from(key).toString('hex')}`);
        console.log(`   Length: ${key.length}`);
        console.log('');
      });
    }

    // Check for your specific record
    console.log('2. CHECKING YOUR SAMPLE RECORD:');
    const sampleOwner = "विदयाधर रामकृष्ण पाटील";
    const sampleRecord = await collection.findOne({ 'खातेदाराचे नांव': sampleOwner });
    
    if (sampleRecord) {
      console.log(`Found record with owner "${sampleOwner}":`);
      
      // Look for any field that might be the serial number
      console.log('\nLooking for serial number field:');
      Object.keys(sampleRecord).forEach(key => {
        const value = sampleRecord[key];
        
        // Check if this could be a serial number (small integer)
        if (typeof value === 'number' && value > 0 && value < 1000 && Number.isInteger(value)) {
          console.log(`   Potential serial field: "${key}" = ${value}`);
          console.log(`   Field hex: ${Buffer.from(key).toString('hex')}`);
        }
      });
    }

    // Try to find the serial field by searching for value 4
    console.log('\n3. SEARCHING FOR SERIAL NUMBER 4:');
    const allFields = await collection.findOne({});
    if (allFields) {
      for (const field of Object.keys(allFields)) {
        const recordWith4 = await collection.findOne({ [field]: 4 });
        if (recordWith4) {
          console.log(`   Found serial 4 in field: "${field}"`);
          console.log(`   Field hex: ${Buffer.from(field).toString('hex')}`);
          console.log(`   Owner: ${recordWith4['खातेदाराचे नांव']}`);
          break;
        }
      }
    }

    // Try different Marathi encodings
    console.log('\n4. TESTING MARATHI ENCODINGS:');
    const possibleSerialFields = [
      'अ.क्र',      // Standard
      'अ_क्र',      // Underscore
      'अ.क्र.',     // With dot
      'अ_क्र_',     // Double underscore
      'serial',     // English fallback
      'serial_number',
      'sr_no',
      'अक्र',       // Without dot
      'अ.क',       // Abbreviated
      'क्र',        // Just the number part
      'क्रमांक'     // Alternative Marathi
    ];

    for (const field of possibleSerialFields) {
      const count = await collection.countDocuments({ [field]: { $exists: true } });
      if (count > 0) {
        console.log(`   Found field "${field}": ${count} records`);
        const sample = await collection.findOne({ [field]: 4 });
        if (sample) {
          console.log(`   ✅ Found serial 4! Owner: ${sample['खातेदाराचे नांव']}`);
        }
      }
    }

    // Check if the issue is with Unicode normalization
    console.log('\n5. UNICODE NORMALIZATION CHECK:');
    const testRecord = await collection.findOne({ 'खातेदाराचे नांव': sampleOwner });
    if (testRecord) {
      console.log('Checking Unicode normalization for field names:');
      Object.keys(testRecord).forEach(key => {
        try {
          const normalized = key.normalize('NFC');
          const denormalized = key.normalize('NFD');
          console.log(`   Field: "${key}"`);
          console.log(`   Normalized (NFC): "${normalized}"`);
          console.log(`   Denormalized (NFD): "${denormalized}"`);
          console.log(`   Values match: ${key === normalized}`);
          console.log('');
        } catch (e) {
          console.log(`   Error with field "${key}": ${e.message}`);
        }
      });
    }

    // Final check: Get a complete record and show all fields
    console.log('\n6. COMPLETE RECORD SAMPLE:');
    const completeRecord = await collection.findOne({ 'खातेदाराचे नांव': sampleOwner });
    if (completeRecord) {
      console.log('Complete record with all fields:');
      Object.entries(completeRecord).forEach(([key, value]) => {
        if (typeof value === 'number' && value > 0 && value < 1000) {
          console.log(`   🔍 POTENTIAL SERIAL: "${key}" = ${value}`);
        } else {
          console.log(`   "${key}": ${value}`);
        }
      });
    }

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugMarathiFieldNames();