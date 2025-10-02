import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi';

async function analyzeActualFields() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('landownerrecords2');

    console.log('\n=== ANALYZING ACTUAL FIELD STRUCTURE ===\n');

    // Get one complete document
    const sampleDoc = await collection.findOne({});
    if (!sampleDoc) {
      console.log('No documents found in landownerrecords2');
      return;
    }

    console.log('Sample document structure:');
    console.log('==========================');
    
    // Display all fields with their types and values
    Object.keys(sampleDoc).forEach(key => {
      const value = sampleDoc[key];
      const type = typeof value;
      const isObjectId = value && value.constructor && value.constructor.name === 'ObjectID';
      const displayValue = isObjectId ? `ObjectId(${value})` : 
                          typeof value === 'string' ? `"${value}"` : 
                          value;
      
      console.log(`${key}:`);
      console.log(`  Type: ${type}${isObjectId ? ' (ObjectId)' : ''}`);
      console.log(`  Value: ${displayValue}`);
      console.log('');
    });

    // Check if the specific fields from your sample exist
    console.log('\n=== CHECKING SPECIFIC FIELDS ===\n');
    
    const fieldsToCheck = [
      'अ.क्र',
      'अ_क्र', 
      'खातेदाराचे नांव',
      'खातेदाराचे_नांव',
      'Village',
      'Taluka', 
      'District',
      'project_id',
      'is_active',
      'मोबदला वाटप तपशिल'
    ];

    for (const field of fieldsToCheck) {
      const exists = field in sampleDoc;
      console.log(`${field}: ${exists ? 'EXISTS' : 'MISSING'}`);
      if (exists) {
        console.log(`  Value: ${JSON.stringify(sampleDoc[field])}`);
      }
    }

    // Search for records with specific serial number
    console.log('\n=== SEARCHING FOR SERIAL NUMBER 5 ===\n');
    
    const serial5 = await collection.findOne({ 'अ.क्र': 5 });
    if (serial5) {
      console.log('Found record with अ.क्र = 5:');
      console.log('Owner:', serial5['खातेदाराचे नांव']);
      console.log('Village:', serial5.Village);
    } else {
      console.log('No record found with अ.क्र = 5');
    }

    // Try alternative field names for serial number
    console.log('\n=== SEARCHING ALTERNATIVE SERIAL FIELDS ===\n');
    
    const possibleSerialFields = [
      'अ.क्र',
      'अ_क्र',
      'serial_number',
      'Serial',
      'serial',
      'क्रमांक',
      'क्र'
    ];

    for (const field of possibleSerialFields) {
      const count = await collection.countDocuments({ [field]: { $exists: true } });
      if (count > 0) {
        console.log(`${field}: Found ${count} records`);
        const sample = await collection.findOne({ [field]: { $exists: true } });
        console.log(`  Sample value: ${JSON.stringify(sample[field])}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeActualFields();