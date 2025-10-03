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

// Fields that need conversion based on analysis
const FIELDS_TO_CONVERT = [
  'serial_number',
  'old_survey_number',
  'new_survey_number',
  'group_number',
  'cts_number',
  'land_area_as_per_7_12',
  'acquired_land_area',
  'approved_rate_per_hectare',
  'market_value_as_per_acquired_area',
  'factor_as_per_section_26_2',
  'land_compensation_as_per_section_26',
  'structures',
  'forest_trees',
  'fruit_trees',
  'wells_borewells',
  'total_structures_amount',
  'total_amount_14_23',
  'determined_compensation_26',
  'total_compensation_26_27',
  'deduction_amount',
  'final_payable_compensation',
  'original_'
];

// Function to safely convert string to number
const convertToNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0; // Convert empty strings to 0
  }
  
  if (typeof value === 'number') {
    return value; // Already a number
  }
  
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Handle empty strings
    if (trimmed === '') {
      return 0;
    }
    
    // Try to parse as number
    const parsed = parseFloat(trimmed);
    
    // Check if it's a valid number
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
    
    // If it's not a valid number, return the original string
    // (for text fields that shouldn't be converted)
    return value;
  }
  
  return value; // Return as-is for other types
};

// Function to convert string fields to numeric
const convertStringFieldsToNumeric = async () => {
  console.log('🔄 Converting String Fields to Numeric in English Collection');
  console.log('===========================================================');
  
  const collection = getCollection();
  
  // Get all documents
  const allDocs = await collection.find({}).toArray();
  console.log(`📊 Total documents found: ${allDocs.length}\n`);
  
  if (allDocs.length === 0) {
    console.log('❌ No documents found in the collection');
    return;
  }
  
  let totalUpdated = 0;
  let totalFieldsConverted = 0;
  const conversionStats = {};
  
  // Initialize stats for each field
  FIELDS_TO_CONVERT.forEach(field => {
    conversionStats[field] = {
      converted: 0,
      skipped: 0,
      errors: 0
    };
  });
  
  console.log('🔄 Processing documents...\n');
  
  // Process each document
  for (let i = 0; i < allDocs.length; i++) {
    const doc = allDocs[i];
    const updates = {};
    let hasUpdates = false;
    
    // Check each field that needs conversion
    FIELDS_TO_CONVERT.forEach(fieldName => {
      if (doc.hasOwnProperty(fieldName)) {
        const originalValue = doc[fieldName];
        const convertedValue = convertToNumber(originalValue);
        
        // Only update if the value actually changed
        if (originalValue !== convertedValue) {
          updates[fieldName] = convertedValue;
          hasUpdates = true;
          conversionStats[fieldName].converted++;
          totalFieldsConverted++;
        } else if (typeof originalValue === 'string' && originalValue.trim() !== '' && isNaN(parseFloat(originalValue))) {
          // This is a text field that shouldn't be converted
          conversionStats[fieldName].skipped++;
        }
      }
    });
    
    // Update the document if there are changes
    if (hasUpdates) {
      try {
        await collection.updateOne(
          { _id: doc._id },
          { $set: updates }
        );
        totalUpdated++;
        
        if (totalUpdated % 10 === 0) {
          console.log(`✅ Updated ${totalUpdated} documents so far...`);
        }
      } catch (error) {
        console.error(`❌ Error updating document ${doc._id}:`, error);
        // Mark errors for each field in this document
        Object.keys(updates).forEach(field => {
          conversionStats[field].errors++;
        });
      }
    }
  }
  
  console.log('\n📊 Conversion Results:');
  console.log('======================\n');
  console.log(`Total documents processed: ${allDocs.length}`);
  console.log(`Total documents updated: ${totalUpdated}`);
  console.log(`Total fields converted: ${totalFieldsConverted}\n`);
  
  // Display detailed stats for each field
  console.log('📋 Field-by-field Conversion Stats:');
  console.log('===================================\n');
  
  FIELDS_TO_CONVERT.forEach(fieldName => {
    const stats = conversionStats[fieldName];
    const total = stats.converted + stats.skipped + stats.errors;
    
    if (total > 0) {
      console.log(`🔸 ${fieldName}:`);
      console.log(`   Converted: ${stats.converted}`);
      console.log(`   Skipped: ${stats.skipped}`);
      console.log(`   Errors: ${stats.errors}`);
      console.log(`   Total: ${total}\n`);
    }
  });
  
  return {
    totalDocuments: allDocs.length,
    totalUpdated,
    totalFieldsConverted,
    conversionStats
  };
};

// Function to verify the conversion
const verifyConversion = async () => {
  console.log('🔍 Verifying Conversion Results');
  console.log('===============================\n');
  
  const collection = getCollection();
  
  // Get all documents and check for remaining string values
  const allDocs = await collection.find({}).toArray();
  let remainingStringCount = 0;
  const remainingStringDocs = [];
  
  allDocs.forEach(doc => {
    const stringFields = [];
    
    FIELDS_TO_CONVERT.forEach(fieldName => {
      if (doc.hasOwnProperty(fieldName)) {
        const value = doc[fieldName];
        
        // Check if it's a string that looks like a number
        if (typeof value === 'string' && value.trim() !== '' && !isNaN(parseFloat(value)) && isFinite(value)) {
          stringFields.push({ field: fieldName, value: value });
          remainingStringCount++;
        }
      }
    });
    
    if (stringFields.length > 0) {
      remainingStringDocs.push({
        _id: doc._id,
        stringFields: stringFields
      });
    }
  });
  
  if (remainingStringCount === 0) {
    console.log('✅ All numeric string values have been successfully converted!');
  } else {
    console.log(`⚠️  Found ${remainingStringCount} remaining numeric strings in ${remainingStringDocs.length} documents:`);
    remainingStringDocs.slice(0, 5).forEach(doc => {
      console.log(`   Document ${doc._id}:`);
      doc.stringFields.forEach(field => {
        console.log(`     ${field.field}: "${field.value}"`);
      });
    });
    
    if (remainingStringDocs.length > 5) {
      console.log(`   ... and ${remainingStringDocs.length - 5} more documents`);
    }
  }
  
  return remainingStringCount;
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting String to Numeric Conversion for English Collection\n');
    
    // Perform the conversion
    const result = await convertStringFieldsToNumeric();
    
    if (result.totalUpdated > 0) {
      console.log('\n🔍 Verifying conversion...\n');
      const remainingStrings = await verifyConversion();
      
      if (remainingStrings === 0) {
        console.log('\n🎉 Conversion completed successfully!');
        console.log('All string numeric values have been converted to proper numeric types.');
      } else {
        console.log('\n⚠️  Some string values may still need attention.');
      }
    } else {
      console.log('\n✅ No conversions were needed - all fields are already in correct format.');
    }
    
  } catch (error) {
    console.error('❌ Error during conversion:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();