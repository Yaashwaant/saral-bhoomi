import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Get the collection directly
const getCollection = () => {
  return mongoose.connection.db.collection('landownerrecords2');
};

// Function to check specific records from serial number 79 onwards
const checkSpecificRecords = async () => {
  console.log('🔍 Checking Records from Serial Number 79 Onwards');
  console.log('==================================================');
  
  const collection = getCollection();
  
  // Get all documents and sort them to find records from position 79
  const allDocs = await collection.find({}).toArray();
  console.log(`📊 Total documents found: ${allDocs.length}\n`);
  
  if (allDocs.length < 79) {
    console.log('❌ Not enough documents to check from serial number 79');
    return;
  }
  
  // Check records from index 78 (serial 79) onwards
  const recordsToCheck = allDocs.slice(78); // Start from index 78 (serial 79)
  console.log(`🔍 Checking ${recordsToCheck.length} records from serial number 79 onwards...\n`);
  
  // Fields to check
  const landAreaFields = [
    'गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर', // 7/12 land area
    'संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर'      // acquired land area
  ];
  
  let foundStringValues = false;
  
  recordsToCheck.forEach((doc, index) => {
    const serialNumber = 79 + index;
    console.log(`🔸 Serial ${serialNumber} (Document ID: ${doc._id}):`);
    
    landAreaFields.forEach(field => {
      const value = doc[field];
      const type = typeof value;
      
      console.log(`   ${field === 'गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर' ? '7/12 Land Area' : 'Acquired Land Area'}:`);
      console.log(`     Value: ${JSON.stringify(value)}`);
      console.log(`     Type: ${type}`);
      
      if (type === 'string' && value !== '' && value !== null) {
        console.log(`     ⚠️  STRING VALUE DETECTED!`);
        foundStringValues = true;
      } else if (type === 'number') {
        console.log(`     ✅ Numeric value`);
      } else {
        console.log(`     ℹ️  Empty/null value`);
      }
    });
    
    console.log('');
  });
  
  // Summary
  console.log('\n🎯 SUMMARY:');
  console.log('===========');
  
  if (foundStringValues) {
    console.log('⚠️  STRING VALUES FOUND in land area fields!');
    console.log('📝 These records need to be converted to numeric values.');
    
    // Count string values in each field
    console.log('\n📊 Detailed Analysis:');
    
    for (const field of landAreaFields) {
      const fieldName = field === 'गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर' ? '7/12 Land Area' : 'Acquired Land Area';
      
      let stringCount = 0;
      let numericCount = 0;
      let emptyCount = 0;
      const stringValues = [];
      
      recordsToCheck.forEach((doc, index) => {
        const value = doc[field];
        const type = typeof value;
        const serialNumber = 79 + index;
        
        if (type === 'string' && value !== '' && value !== null) {
          stringCount++;
          stringValues.push({ serial: serialNumber, value: value });
        } else if (type === 'number') {
          numericCount++;
        } else {
          emptyCount++;
        }
      });
      
      console.log(`\n🔸 ${fieldName}:`);
      console.log(`   String values: ${stringCount}`);
      console.log(`   Numeric values: ${numericCount}`);
      console.log(`   Empty/null values: ${emptyCount}`);
      
      if (stringCount > 0) {
        console.log(`   String value examples:`);
        stringValues.slice(0, 5).forEach(item => {
          console.log(`     Serial ${item.serial}: "${item.value}"`);
        });
      }
    }
  } else {
    console.log('✅ All land area fields contain proper numeric values');
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await checkSpecificRecords();
  } catch (error) {
    console.error('❌ Error during specific records check:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();