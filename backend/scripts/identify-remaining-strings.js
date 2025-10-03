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

// Function to identify remaining string fields
const identifyRemainingStrings = async () => {
  console.log('🔍 Identifying Remaining Empty String Fields');
  console.log('===========================================');
  
  const collection = getCollection();
  
  // Get all documents
  const allDocs = await collection.find({}).toArray();
  console.log(`📊 Total documents found: ${allDocs.length}\n`);
  
  // Check records from serial 79 onwards (index 78 onwards)
  const recordsToCheck = allDocs.slice(78); // Serial 79 = index 78
  
  console.log(`🎯 Checking ${recordsToCheck.length} records from serial 79 onwards\n`);
  
  const emptyStringFields = {};
  let totalEmptyStrings = 0;
  
  recordsToCheck.forEach((doc, index) => {
    const serialNumber = 79 + index;
    
    console.log(`🔸 Serial ${serialNumber} (Document ID: ${doc._id}):`);
    
    let recordEmptyStrings = 0;
    
    // Check ALL fields in the document
    Object.keys(doc).forEach(fieldName => {
      const value = doc[fieldName];
      
      if (value === '' || (typeof value === 'string' && value.trim() === '')) {
        if (!emptyStringFields[fieldName]) {
          emptyStringFields[fieldName] = {
            count: 0,
            serials: []
          };
        }
        
        emptyStringFields[fieldName].count++;
        emptyStringFields[fieldName].serials.push(serialNumber);
        recordEmptyStrings++;
        totalEmptyStrings++;
        
        console.log(`   ⚠️  "${fieldName}": Empty string`);
      }
    });
    
    if (recordEmptyStrings === 0) {
      console.log(`   ✅ No empty strings found`);
    } else {
      console.log(`   📊 Found ${recordEmptyStrings} empty string fields`);
    }
    
    console.log('');
  });
  
  console.log(`📋 Summary of Empty String Fields:`);
  console.log(`=================================\n`);
  console.log(`Total empty strings found: ${totalEmptyStrings}\n`);
  
  if (Object.keys(emptyStringFields).length === 0) {
    console.log('✅ No empty string fields found!');
    return;
  }
  
  // Sort fields by count (most frequent first)
  const sortedFields = Object.entries(emptyStringFields)
    .sort(([,a], [,b]) => b.count - a.count);
  
  sortedFields.forEach(([fieldName, data]) => {
    console.log(`🔸 "${fieldName}":`);
    console.log(`   Count: ${data.count} records`);
    console.log(`   Serials: ${data.serials.join(', ')}`);
    console.log('');
  });
  
  // Check if these are fields that should be numeric or can remain empty
  console.log(`🤔 Field Analysis:`);
  console.log(`=================\n`);
  
  sortedFields.forEach(([fieldName, data]) => {
    const isLikelyNumeric = fieldName.includes('रक्कम') || 
                           fieldName.includes('मोबदला') || 
                           fieldName.includes('क्षेत्र') || 
                           fieldName.includes('बाजारमुल्य') ||
                           fieldName.includes('Factor') ||
                           fieldName.includes('सोलेशियम') ||
                           fieldName.includes('वाढीव') ||
                           fieldName.includes('एकुण') ||
                           fieldName.includes('निर्धारित');
    
    const isLikelyText = fieldName.includes('नाव') || 
                        fieldName.includes('पत्ता') || 
                        fieldName.includes('टिप्पणी') ||
                        fieldName.includes('note') ||
                        fieldName === '' ||
                        fieldName.includes('वाटप तपशिल');
    
    console.log(`🔸 "${fieldName}":`);
    console.log(`   Likely Numeric: ${isLikelyNumeric ? '✅ YES' : '❌ NO'}`);
    console.log(`   Likely Text: ${isLikelyText ? '✅ YES' : '❌ NO'}`);
    console.log(`   Recommendation: ${isLikelyNumeric ? 'Convert to 0' : isLikelyText ? 'Leave as empty string or null' : 'Needs manual review'}`);
    console.log('');
  });
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await identifyRemainingStrings();
  } catch (error) {
    console.error('❌ Error during string identification:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

main();