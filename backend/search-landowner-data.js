import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function findLandownerData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const db = mongoose.connection.db;
    
    // List all collections
    console.log('=== ALL COLLECTIONS ===');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Check for landowner-related collections
    console.log('\n=== LANDOWNER-RELATED COLLECTIONS ===');
    const landownerCollections = collections.filter(col => 
      col.name.toLowerCase().includes('landowner') || 
      col.name.toLowerCase().includes('land') ||
      col.name.toLowerCase().includes('record')
    );
    
    for (const collection of landownerCollections) {
      const coll = db.collection(collection.name);
      const count = await coll.countDocuments();
      console.log(`\n${collection.name}: ${count} documents`);
      
      // Sample first document
      const sample = await coll.findOne({});
      if (sample) {
        console.log('Sample document keys:', Object.keys(sample));
        console.log('Has अ.क्र:', 'अ.क्र' in sample);
        console.log('Has खातेदाराचे नांव:', 'खातेदाराचे नांव' in sample);
        console.log('Has is_active:', 'is_active' in sample);
      }
    }

    // Specifically check if there's a collection with your sample data
    console.log('\n=== SEARCHING FOR YOUR SAMPLE DATA ===');
    const sampleSerial = 4; // From your example
    const sampleOwner = "विदयाधर रामकृष्ण पाटील"; // From your example
    
    for (const collection of landownerCollections) {
      const coll = db.collection(collection.name);
      
      // Search by serial number
      const bySerial = await coll.findOne({ 'अ.क्र': sampleSerial });
      if (bySerial) {
        console.log(`\nFound document with serial ${sampleSerial} in ${collection.name}:`);
        console.log('Document:', JSON.stringify(bySerial, null, 2));
      }
      
      // Search by owner name
      const byOwner = await coll.findOne({ 'खातेदाराचे नांव': sampleOwner });
      if (byOwner) {
        console.log(`\nFound document with owner "${sampleOwner}" in ${collection.name}:`);
        console.log('Document:', JSON.stringify(byOwner, null, 2));
      }
    }

    // Also check if there might be data with different field names
    console.log('\n=== CHECKING FOR ALTERNATIVE FIELD NAMES ===');
    const possibleFields = [
      'serial_number', 'serial', 'sr_no', 'srno',
      'owner_name', 'owner', 'name',
      'अ_क्र', 'अ.क्र',
      'खातेदाराचे_नांव', 'खातेदाराचे नांव'
    ];
    
    for (const collection of landownerCollections) {
      const coll = db.collection(collection.name);
      
      for (const field of possibleFields) {
        const hasField = await coll.findOne({ [field]: { $exists: true } });
        if (hasField) {
          console.log(`\nFound field "${field}" in ${collection.name}:`);
          console.log('Sample value:', hasField[field]);
        }
      }
    }

  } catch (error) {
    console.error('Error during search:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findLandownerData();