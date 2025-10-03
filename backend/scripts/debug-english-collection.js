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
  return mongoose.connection.db.collection('landownerrecords_english_complete');
};

// Function to debug the English collection
const debugEnglishCollection = async () => {
  console.log('🔍 Debugging landownerrecords_english_complete Collection');
  console.log('======================================================');
  
  const collection = getCollection();
  
  // Get first few documents to examine structure
  const sampleDocs = await collection.find({}).limit(3).toArray();
  console.log(`📊 Sample documents found: ${sampleDocs.length}\n`);
  
  if (sampleDocs.length === 0) {
    console.log('❌ No documents found in the collection');
    return;
  }
  
  // Examine the first document in detail
  console.log('📋 First Document Structure:');
  console.log('============================\n');
  
  const firstDoc = sampleDocs[0];
  const fields = Object.keys(firstDoc);
  
  console.log(`Total fields: ${fields.length}\n`);
  
  // Show all fields with their types and sample values
  fields.forEach(fieldName => {
    const value = firstDoc[fieldName];
    const type = typeof value;
    const isArray = Array.isArray(value);
    
    console.log(`🔸 ${fieldName}:`);
    console.log(`   Type: ${isArray ? 'array' : type}`);
    console.log(`   Value: ${JSON.stringify(value)}`);
    
    // Check if it's a numeric string
    if (type === 'string' && value !== '' && !isNaN(parseFloat(value)) && isFinite(value)) {
      console.log(`   ⚠️  NUMERIC STRING DETECTED!`);
    }
    
    console.log('');
  });
  
  // Look specifically for the fields we saw in MongoDB Compass
  const targetFields = ['land_area_as_per_7_12', 'acquired_land_area'];
  
  console.log('🎯 Target Fields Analysis:');
  console.log('==========================\n');
  
  targetFields.forEach(fieldName => {
    console.log(`🔸 Field: "${fieldName}"`);
    
    sampleDocs.forEach((doc, index) => {
      const value = doc[fieldName];
      const type = typeof value;
      
      console.log(`   Doc ${index + 1}: ${type} = ${JSON.stringify(value)}`);
      
      if (type === 'string' && value !== '' && !isNaN(parseFloat(value)) && isFinite(value)) {
        console.log(`   ⚠️  Doc ${index + 1} has numeric string!`);
      }
    });
    
    console.log('');
  });
  
  // Count total documents with string values in target fields
  console.log('📊 Collection-wide Analysis:');
  console.log('============================\n');
  
  const allDocs = await collection.find({}).toArray();
  
  targetFields.forEach(fieldName => {
    let stringCount = 0;
    let numericStringCount = 0;
    let numericCount = 0;
    let emptyCount = 0;
    const sampleStringValues = [];
    
    allDocs.forEach(doc => {
      const value = doc[fieldName];
      
      if (value === null || value === undefined || value === '') {
        emptyCount++;
      } else if (typeof value === 'string') {
        stringCount++;
        
        if (!isNaN(parseFloat(value)) && isFinite(value) && value.trim() !== '') {
          numericStringCount++;
          if (sampleStringValues.length < 5) {
            sampleStringValues.push(value);
          }
        }
      } else if (typeof value === 'number') {
        numericCount++;
      }
    });
    
    console.log(`🔸 ${fieldName}:`);
    console.log(`   Total docs: ${allDocs.length}`);
    console.log(`   String values: ${stringCount}`);
    console.log(`   Numeric strings: ${numericStringCount}`);
    console.log(`   Numeric values: ${numericCount}`);
    console.log(`   Empty/null: ${emptyCount}`);
    
    if (numericStringCount > 0) {
      console.log(`   Sample numeric strings: [${sampleStringValues.map(v => `"${v}"`).join(', ')}]`);
      console.log(`   ⚠️  NEEDS CONVERSION!`);
    } else {
      console.log(`   ✅ No conversion needed`);
    }
    
    console.log('');
  });
  
  return {
    totalDocuments: allDocs.length,
    sampleDoc: firstDoc
  };
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await debugEnglishCollection();
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

main();