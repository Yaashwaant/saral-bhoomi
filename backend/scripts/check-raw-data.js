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

// Function to check raw data
const checkRawData = async () => {
  console.log('🔍 Raw Data Structure Check');
  console.log('============================');
  
  const collection = getCollection();
  
  // Get total count
  const totalCount = await collection.countDocuments();
  console.log(`📊 Total documents in collection: ${totalCount}\n`);
  
  if (totalCount === 0) {
    console.log('❌ No documents found in the collection');
    return;
  }
  
  // Get one sample document to see its structure
  const sampleDoc = await collection.findOne({});
  
  if (!sampleDoc) {
    console.log('❌ Could not retrieve sample document');
    return;
  }
  
  console.log('🔸 Sample Document Structure:');
  console.log('Document ID:', sampleDoc._id);
  console.log('\n📋 All fields in the document:');
  
  // List all fields and their types
  Object.keys(sampleDoc).forEach(key => {
    const value = sampleDoc[key];
    const type = typeof value;
    
    console.log(`   ${key}:`);
    console.log(`     Value: ${JSON.stringify(value)}`);
    console.log(`     Type: ${type}`);
    
    // Check if it's a numeric-looking string
    if (type === 'string' && value && !isNaN(parseFloat(value)) && isFinite(value)) {
      console.log(`     ⚠️  Numeric string detected!`);
    }
    console.log('');
  });
  
  // Look for fields that contain numeric data
  console.log('\n🔍 Looking for fields with numeric-like values...');
  
  const numericFields = [];
  Object.keys(sampleDoc).forEach(key => {
    const value = sampleDoc[key];
    if (typeof value === 'string' && value && !isNaN(parseFloat(value)) && isFinite(value)) {
      numericFields.push(key);
    }
  });
  
  if (numericFields.length > 0) {
    console.log('\n📊 Fields containing numeric strings:');
    numericFields.forEach(field => {
      console.log(`   - ${field}: "${sampleDoc[field]}"`);
    });
  } else {
    console.log('\n✅ No numeric strings found in this sample');
  }
  
  // Check a few more documents
  console.log('\n🔍 Checking 3 more sample documents...');
  const moreSamples = await collection.find({}).limit(3).skip(1).toArray();
  
  moreSamples.forEach((doc, index) => {
    console.log(`\n🔸 Document ${index + 2} (ID: ${doc._id}):`);
    
    // Look for numeric strings in this document
    const docNumericFields = [];
    Object.keys(doc).forEach(key => {
      const value = doc[key];
      if (typeof value === 'string' && value && !isNaN(parseFloat(value)) && isFinite(value)) {
        docNumericFields.push({ field: key, value: value });
      }
    });
    
    if (docNumericFields.length > 0) {
      console.log('   Numeric strings found:');
      docNumericFields.forEach(item => {
        console.log(`     ${item.field}: "${item.value}"`);
      });
    } else {
      console.log('   No numeric strings found');
    }
  });
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await checkRawData();
  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();