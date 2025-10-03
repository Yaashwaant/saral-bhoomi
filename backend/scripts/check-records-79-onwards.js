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

// Function to check records from serial 79 onwards
const checkRecordsFrom79 = async () => {
  console.log('🔍 Checking Records from Serial 79 Onwards');
  console.log('==========================================');
  
  const collection = getCollection();
  
  // Get all documents
  const allDocs = await collection.find({}).toArray();
  console.log(`📊 Total documents found: ${allDocs.length}\n`);
  
  // Check records from serial 79 onwards (index 78 onwards)
  const recordsToCheck = allDocs.slice(78); // Serial 79 = index 78
  
  console.log(`🎯 Checking ${recordsToCheck.length} records from serial 79 onwards\n`);
  
  recordsToCheck.forEach((doc, index) => {
    const serialNumber = 79 + index;
    
    console.log(`🔸 Serial ${serialNumber} (Document ID: ${doc._id}):`);
    console.log(`   Total fields: ${Object.keys(doc).length}`);
    
    // Show ALL fields and their types
    console.log('   All fields:');
    Object.keys(doc).forEach(fieldName => {
      const value = doc[fieldName];
      const type = typeof value;
      
      // Highlight potential land area fields
      const isLandAreaField = fieldName.toLowerCase().includes('land') || 
                             fieldName.toLowerCase().includes('area') ||
                             fieldName.includes('जमिन') ||
                             fieldName.includes('क्षेत्र') ||
                             fieldName.includes('7/12') ||
                             fieldName.includes('7-12');
      
      const marker = isLandAreaField ? '🏞️ ' : '   ';
      
      if (type === 'string' && value !== '') {
        console.log(`${marker}   "${fieldName}": "${value}" (${type}) ${isLandAreaField ? '⚠️ STRING LAND FIELD' : ''}`);
      } else {
        console.log(`${marker}   "${fieldName}": ${value} (${type})`);
      }
    });
    
    console.log('\n---\n');
  });
  
  // Also check for any fields that might contain "land_acquired" or similar
  console.log('🔍 Searching for fields containing "land" or "acquired":');
  console.log('======================================================\n');
  
  recordsToCheck.forEach((doc, index) => {
    const serialNumber = 79 + index;
    const matchingFields = [];
    
    Object.keys(doc).forEach(fieldName => {
      if (fieldName.toLowerCase().includes('land') || 
          fieldName.toLowerCase().includes('acquired') ||
          fieldName.toLowerCase().includes('area')) {
        matchingFields.push({
          fieldName,
          value: doc[fieldName],
          type: typeof doc[fieldName]
        });
      }
    });
    
    if (matchingFields.length > 0) {
      console.log(`🔸 Serial ${serialNumber}:`);
      matchingFields.forEach(field => {
        console.log(`   "${field.fieldName}": ${field.value} (${field.type})`);
      });
      console.log('');
    }
  });
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await checkRecordsFrom79();
  } catch (error) {
    console.error('❌ Error during record check:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

main();