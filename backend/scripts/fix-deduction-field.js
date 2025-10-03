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

// Function to fix deduction field
const fixDeductionField = async () => {
  console.log('🔧 Deduction Field Fix Tool');
  console.log('============================');
  
  const collection = getCollection();
  const deductionField = 'वजावट रक्कम रुपये';
  
  // Find documents with string values in deduction field
  const docsWithStringDeductions = await collection.find({
    [deductionField]: { $type: "string", $ne: "", $ne: null }
  }).toArray();
  
  console.log(`📊 Found ${docsWithStringDeductions.length} documents with string deduction values\n`);
  
  if (docsWithStringDeductions.length === 0) {
    console.log('✅ No string values found in deduction field');
    return;
  }
  
  // Display the problematic records
  console.log('🔍 Documents with string deduction values:');
  docsWithStringDeductions.forEach((doc, index) => {
    console.log(`\n${index + 1}. Document ID: ${doc._id}`);
    console.log(`   Current deduction value: "${doc[deductionField]}"`);
    console.log(`   Owner: ${doc['हितसंबंधिताचे नाव'] || 'N/A'}`);
    console.log(`   Village: ${doc['गाव'] || 'N/A'}`);
  });
  
  console.log('\n🤔 These appear to be administrative notes rather than numeric amounts.');
  console.log('💡 Recommended action: Set these to 0 and preserve notes in a separate field.\n');
  
  // Create a backup field for the original string values
  const updates = [];
  
  for (const doc of docsWithStringDeductions) {
    const originalValue = doc[deductionField];
    
    updates.push({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            [deductionField]: 0, // Set numeric value to 0
            'वजावट_टिप्पणी': originalValue, // Preserve original string as a note
            'deduction_note': originalValue // English field name for reference
          }
        }
      }
    });
  }
  
  if (updates.length > 0) {
    console.log('🚀 Applying fixes...');
    
    const result = await collection.bulkWrite(updates);
    
    console.log(`✅ Successfully updated ${result.modifiedCount} documents`);
    console.log('📝 Original string values preserved in "वजावट_टिप्पणी" and "deduction_note" fields');
  }
  
  // Verify the fix
  console.log('\n🔍 Verifying fixes...');
  
  const remainingStringDeductions = await collection.countDocuments({
    [deductionField]: { $type: "string", $ne: "", $ne: null }
  });
  
  const numericDeductions = await collection.countDocuments({
    [deductionField]: { $type: "number" }
  });
  
  console.log(`📊 Verification results:`);
  console.log(`   String deduction values remaining: ${remainingStringDeductions}`);
  console.log(`   Numeric deduction values: ${numericDeductions}`);
  
  if (remainingStringDeductions === 0) {
    console.log('✅ All deduction values are now numeric!');
  } else {
    console.log('⚠️  Some string values still remain');
  }
  
  // Show sample of fixed records
  console.log('\n📋 Sample of fixed records:');
  const fixedDocs = await collection.find({
    'वजावट_टिप्पणी': { $exists: true }
  }).limit(3).toArray();
  
  fixedDocs.forEach((doc, index) => {
    console.log(`\n${index + 1}. Document ID: ${doc._id}`);
    console.log(`   Deduction amount (numeric): ${doc[deductionField]}`);
    console.log(`   Original note: "${doc['वजावट_टिप्पणी']}"`);
  });
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await fixDeductionField();
  } catch (error) {
    console.error('❌ Error during deduction field fix:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();