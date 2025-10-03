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

// Function to find all string land area values
const findStringLandAreas = async () => {
  console.log('🔍 Finding All String Values in Land Area Fields');
  console.log('=================================================');
  
  const collection = getCollection();
  
  // Get all documents
  const allDocs = await collection.find({}).toArray();
  console.log(`📊 Total documents found: ${allDocs.length}\n`);
  
  // All possible field name variations for land areas
  const landAreaFieldVariations = [
    // Original field names
    'गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर',
    'संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर',
    
    // Alternative field names with spaces and different punctuation
    'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)',
    'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)',
    
    // Other possible variations
    'गांव नमुना 7-12 नुसार जमिनीचे क्षेत्र हे.आर',
    'संपादित जमिनीचे क्षेत्र चौ.मी हेक्टर आर',
    
    // English equivalents
    'land_area_as_per_7_12',
    'acquired_land_area'
  ];
  
  const recordsWithStringAreas = [];
  
  allDocs.forEach((doc, index) => {
    const serialNumber = index + 1;
    const stringFields = [];
    
    // Check each possible field name variation
    landAreaFieldVariations.forEach(fieldName => {
      const value = doc[fieldName];
      
      if (value !== undefined && value !== null && typeof value === 'string' && value !== '') {
        // Check if it's a numeric string
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
          stringFields.push({
            fieldName,
            value,
            isNumericString: true
          });
        } else {
          stringFields.push({
            fieldName,
            value,
            isNumericString: false
          });
        }
      }
    });
    
    if (stringFields.length > 0) {
      recordsWithStringAreas.push({
        serialNumber,
        documentId: doc._id,
        stringFields
      });
    }
  });
  
  console.log(`🎯 Found ${recordsWithStringAreas.length} records with string values in land area fields\n`);
  
  if (recordsWithStringAreas.length === 0) {
    console.log('✅ No string values found in any land area fields');
    return;
  }
  
  // Display the problematic records
  console.log('📋 Records with string land area values:');
  console.log('========================================\n');
  
  recordsWithStringAreas.forEach(record => {
    console.log(`🔸 Serial ${record.serialNumber} (Document ID: ${record.documentId}):`);
    
    record.stringFields.forEach(field => {
      console.log(`   Field: ${field.fieldName}`);
      console.log(`   Value: "${field.value}"`);
      console.log(`   Is Numeric String: ${field.isNumericString ? '✅ YES' : '❌ NO'}`);
      
      if (field.isNumericString) {
        console.log(`   Converted Value: ${parseFloat(field.value)}`);
      }
      console.log('');
    });
    
    console.log('---\n');
  });
  
  // Summary by field
  console.log('📊 Summary by Field:');
  console.log('====================\n');
  
  const fieldSummary = {};
  
  recordsWithStringAreas.forEach(record => {
    record.stringFields.forEach(field => {
      if (!fieldSummary[field.fieldName]) {
        fieldSummary[field.fieldName] = {
          count: 0,
          numericStrings: 0,
          nonNumericStrings: 0,
          examples: []
        };
      }
      
      fieldSummary[field.fieldName].count++;
      
      if (field.isNumericString) {
        fieldSummary[field.fieldName].numericStrings++;
      } else {
        fieldSummary[field.fieldName].nonNumericStrings++;
      }
      
      if (fieldSummary[field.fieldName].examples.length < 3) {
        fieldSummary[field.fieldName].examples.push({
          serial: record.serialNumber,
          value: field.value
        });
      }
    });
  });
  
  Object.keys(fieldSummary).forEach(fieldName => {
    const summary = fieldSummary[fieldName];
    console.log(`🔸 ${fieldName}:`);
    console.log(`   Total string values: ${summary.count}`);
    console.log(`   Numeric strings: ${summary.numericStrings}`);
    console.log(`   Non-numeric strings: ${summary.nonNumericStrings}`);
    console.log(`   Examples:`);
    
    summary.examples.forEach(example => {
      console.log(`     Serial ${example.serial}: "${example.value}"`);
    });
    
    console.log('');
  });
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await findStringLandAreas();
  } catch (error) {
    console.error('❌ Error during string land area search:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

main();