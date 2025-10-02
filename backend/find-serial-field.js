import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findSerialFieldInLandownerRecords2() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    const collection = db.collection('landownerrecords2');

    console.log('=== FINDING SERIAL NUMBER FIELD IN LANDOWNERRECORDS2 ===\n');

    // Get all field names from the collection
    const allFields = new Set();
    const cursor = collection.find({});
    
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      Object.keys(doc).forEach(field => allFields.add(field));
    }
    
    const fieldArray = Array.from(allFields).sort();
    console.log('All field names in landownerrecords2:');
    fieldArray.forEach(field => console.log(`   - "${field}"`));

    // Look for serial number related fields
    console.log('\n=== SEARCHING FOR SERIAL NUMBER FIELDS ===');
    const serialFields = fieldArray.filter(field => 
      field.toLowerCase().includes('क्र') || 
      field.toLowerCase().includes('serial') || 
      field.toLowerCase().includes('number') ||
      field.toLowerCase().includes('no') ||
      field.toLowerCase().includes('sr')
    );

    console.log('Potential serial number fields:');
    serialFields.forEach(field => {
      console.log(`   - "${field}"`);
    });

    // Check each potential serial field
    console.log('\n=== CHECKING POTENTIAL SERIAL FIELDS ===');
    for (const field of serialFields) {
      const count = await collection.countDocuments({ [field]: { $exists: true } });
      if (count > 0) {
        console.log(`\nField "${field}": ${count} records`);
        
        // Get sample values
        const samples = await collection.find({ [field]: { $exists: true } })
          .limit(5)
          .project({ [field]: 1, _id: 0 })
          .toArray();
        
        console.log('Sample values:');
        samples.forEach((sample, index) => {
          console.log(`   ${index + 1}. ${sample[field]}`);
        });

        // Check if it has the value 4 (your sample)
        const hasFour = await collection.findOne({ [field]: 4 });
        if (hasFour) {
          console.log(`   ✅ Found record with value 4!`);
          console.log(`   Owner: ${hasFour['खातेदाराचे नांव']}`);
          console.log(`   Village: ${hasFour['Village']}`);
        }
      }
    }

    // Also check for your specific record by owner name
    console.log('\n=== FINDING YOUR SAMPLE RECORD BY OWNER NAME ===');
    const sampleOwner = "विदयाधर रामकृष्ण पाटील";
    const sampleRecord = await collection.findOne({ 'खातेदाराचे नांव': sampleOwner });
    
    if (sampleRecord) {
      console.log(`Found record with owner "${sampleOwner}":`);
      console.log('All fields in this record:');
      Object.keys(sampleRecord).forEach(key => {
        const value = sampleRecord[key];
        console.log(`   "${key}": ${value} (${typeof value})`);
      });
    }

    // Check if there are any numeric fields that could be serial numbers
    console.log('\n=== CHECKING FOR NUMERIC FIELDS ===');
    const numericFields = [];
    
    for (const field of fieldArray) {
      const sample = await collection.findOne({ [field]: { $type: 'number' } });
      if (sample) {
        numericFields.push(field);
      }
    }

    console.log('Numeric fields that could be serial numbers:');
    numericFields.forEach(field => {
      console.log(`   - "${field}"`);
    });

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findSerialFieldInLandownerRecords2();