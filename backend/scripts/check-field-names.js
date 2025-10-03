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

// Function to check field names in specific records
const checkFieldNames = async () => {
  console.log('🔍 Checking Field Names from Serial Number 79 Onwards');
  console.log('=====================================================');
  
  const collection = getCollection();
  
  // Get all documents
  const allDocs = await collection.find({}).toArray();
  console.log(`📊 Total documents found: ${allDocs.length}\n`);
  
  if (allDocs.length < 79) {
    console.log('❌ Not enough documents to check from serial number 79');
    return;
  }
  
  // Check a few records from index 78 (serial 79) onwards
  const recordsToCheck = allDocs.slice(78, 85); // Check serials 79-85
  
  recordsToCheck.forEach((doc, index) => {
    const serialNumber = 79 + index;
    console.log(`🔸 Serial ${serialNumber} (Document ID: ${doc._id}):`);
    
    // List all field names and their values
    const fieldNames = Object.keys(doc);
    console.log(`   Total fields: ${fieldNames.length}`);
    
    // Look for fields that might contain land area data
    const landAreaLikeFields = fieldNames.filter(field => 
      field.includes('क्षेत्र') || 
      field.includes('area') || 
      field.includes('जमीन') ||
      field.includes('land') ||
      field.includes('7') ||
      field.includes('12') ||
      field.includes('संपादित') ||
      field.includes('acquired')
    );
    
    if (landAreaLikeFields.length > 0) {
      console.log(`   Land area related fields found:`);
      landAreaLikeFields.forEach(field => {
        const value = doc[field];
        const type = typeof value;
        console.log(`     ${field}:`);
        console.log(`       Value: ${JSON.stringify(value)}`);
        console.log(`       Type: ${type}`);
        
        if (type === 'string' && value !== '' && value !== null) {
          console.log(`       ⚠️  STRING VALUE!`);
        }
      });
    } else {
      console.log(`   No land area related fields found`);
      
      // Show first 10 fields to understand the structure
      console.log(`   First 10 fields:`);
      fieldNames.slice(0, 10).forEach(field => {
        const value = doc[field];
        console.log(`     ${field}: ${JSON.stringify(value)} (${typeof value})`);
      });
    }
    
    console.log('');
  });
  
  // Also check if there are any fields with string values that look like numbers
  console.log('\n🔍 Looking for numeric-looking string values in all fields...\n');
  
  recordsToCheck.forEach((doc, index) => {
    const serialNumber = 79 + index;
    const numericStrings = [];
    
    Object.keys(doc).forEach(field => {
      const value = doc[field];
      if (typeof value === 'string' && value && !isNaN(parseFloat(value)) && isFinite(value)) {
        numericStrings.push({ field, value });
      }
    });
    
    if (numericStrings.length > 0) {
      console.log(`🔸 Serial ${serialNumber} - Numeric strings found:`);
      numericStrings.forEach(item => {
        console.log(`   ${item.field}: "${item.value}"`);
      });
      console.log('');
    }
  });
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await checkFieldNames();
  } catch (error) {
    console.error('❌ Error during field names check:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();