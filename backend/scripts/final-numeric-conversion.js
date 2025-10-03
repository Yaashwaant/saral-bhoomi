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

// Function to perform final numeric conversion
const finalNumericConversion = async () => {
  console.log('🔧 Final Numeric Field Conversion');
  console.log('=================================');
  
  const collection = getCollection();
  
  // Get all documents
  const allDocs = await collection.find({}).toArray();
  console.log(`📊 Total documents found: ${allDocs.length}\n`);
  
  // Fields that should definitely be numeric (based on analysis)
  const numericFieldsToFix = [
    'जमिनीचे दर (प्रति हेक्टर) रक्कम रुपये',
    'संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू',
    'कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)',
    'एकूण रक्कमेवर  25%  वाढीव मोबदला\n(अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)',
    'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)',
    '100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.न     नं. 5'
  ];
  
  let updatedCount = 0;
  const updates = [];
  
  // Check records from serial 79 onwards (index 78 onwards)
  const recordsToFix = allDocs.slice(78); // Serial 79 = index 78
  
  console.log(`🎯 Checking ${recordsToFix.length} records from serial 79 onwards\n`);
  
  for (let i = 0; i < recordsToFix.length; i++) {
    const doc = recordsToFix[i];
    const serialNumber = 79 + i;
    const updateFields = {};
    let hasUpdates = false;
    
    console.log(`🔸 Checking Serial ${serialNumber} (Document ID: ${doc._id}):`);
    
    // Check each numeric field that needs fixing
    numericFieldsToFix.forEach(fieldName => {
      const value = doc[fieldName];
      
      if (value === '' || (typeof value === 'string' && value.trim() === '')) {
        console.log(`   ⚠️  Field "${fieldName}": Empty string -> Converting to 0`);
        updateFields[fieldName] = 0;
        hasUpdates = true;
      } else if (typeof value === 'string' && value !== '' && !isNaN(parseFloat(value))) {
        // Convert numeric strings to numbers
        const numericValue = parseFloat(value);
        console.log(`   🔄 Field "${fieldName}": String "${value}" -> Number ${numericValue}`);
        updateFields[fieldName] = numericValue;
        hasUpdates = true;
      }
    });
    
    if (hasUpdates) {
      updates.push({
        documentId: doc._id,
        serialNumber,
        updateFields
      });
      console.log(`   ✅ Will update ${Object.keys(updateFields).length} fields`);
    } else {
      console.log(`   ✅ No updates needed`);
    }
    
    console.log('');
  }
  
  console.log(`📋 Summary: Found ${updates.length} records that need updates\n`);
  
  if (updates.length === 0) {
    console.log('✅ No updates needed - all numeric fields are already properly formatted');
    return;
  }
  
  // Apply the updates
  console.log('🔧 Applying updates...\n');
  
  for (const update of updates) {
    try {
      const result = await collection.updateOne(
        { _id: update.documentId },
        { $set: update.updateFields }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
        console.log(`✅ Updated Serial ${update.serialNumber} - ${Object.keys(update.updateFields).length} fields`);
      } else {
        console.log(`⚠️  No changes made to Serial ${update.serialNumber}`);
      }
    } catch (error) {
      console.error(`❌ Error updating Serial ${update.serialNumber}:`, error);
    }
  }
  
  console.log(`\n🎉 Update Complete!`);
  console.log(`📊 Records updated: ${updatedCount}/${updates.length}`);
  
  // Final comprehensive verification
  console.log('\n🔍 Final Comprehensive Verification...');
  
  const verificationDocs = await collection.find({}).toArray();
  
  // Check all records for string values in numeric fields
  let totalStringValues = 0;
  let totalEmptyStrings = 0;
  let totalProperNumerics = 0;
  
  // All possible numeric field names
  const allNumericFieldNames = [
    'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)',
    'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)',
    'जमिनीचे दर (प्रति हेक्टर) रक्कम रुपये',
    'संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू',
    'कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)',
    'कलम 26 नुसार जमिनीचा मोबदला (9X10)',
    'बांधकामे',
    'वनझाडे',
    'फळझाडे',
    'विहिरी/बोअरवेल',
    'एकुण रक्कम रुपये (16+18+ 20+22)',
    'एकुण रक्कम (14+23)',
    '100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.न     नं. 5',
    'निर्धारित मोबदला 26 = (24+25)',
    'एकूण रक्कमेवर  25%  वाढीव मोबदला\n(अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)',
    'एकुण मोबदला (26+ 27)',
    'वजावट रक्कम रुपये',
    'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)'
  ];
  
  verificationDocs.forEach((doc, index) => {
    const serialNumber = index + 1;
    
    allNumericFieldNames.forEach(fieldName => {
      const value = doc[fieldName];
      
      if (value === '' || (typeof value === 'string' && value.trim() === '')) {
        totalEmptyStrings++;
      } else if (typeof value === 'string' && value !== '' && !isNaN(parseFloat(value))) {
        totalStringValues++;
      } else if (typeof value === 'number') {
        totalProperNumerics++;
      }
    });
  });
  
  console.log(`📊 Final Database Status:`);
  console.log(`========================`);
  console.log(`   Total documents: ${verificationDocs.length}`);
  console.log(`   Empty strings in numeric fields: ${totalEmptyStrings}`);
  console.log(`   Numeric strings remaining: ${totalStringValues}`);
  console.log(`   Proper numeric values: ${totalProperNumerics}`);
  console.log(`   Conversion status: ${totalStringValues === 0 ? '✅ COMPLETE - All numeric strings converted' : '⚠️ INCOMPLETE - Some numeric strings remain'}`);
  
  if (totalStringValues > 0) {
    console.log(`\n⚠️  Note: ${totalStringValues} numeric strings still remain. These may need manual review.`);
  }
  
  if (totalEmptyStrings > 0) {
    console.log(`\n📝 Note: ${totalEmptyStrings} empty strings remain. These are likely in text fields and can be left as-is.`);
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await finalNumericConversion();
  } catch (error) {
    console.error('❌ Error during final conversion:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();