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

// Function to analyze the English collection
const analyzeEnglishCollection = async () => {
  console.log('🔍 Analyzing landownerrecords_english_complete Collection');
  console.log('====================================================');
  
  const collection = getCollection();
  
  // Get all documents
  const allDocs = await collection.find({}).toArray();
  console.log(`📊 Total documents found: ${allDocs.length}\n`);
  
  if (allDocs.length === 0) {
    console.log('❌ No documents found in the collection');
    return;
  }
  
  // Get field names from the first document
  const sampleDoc = allDocs[0];
  const allFields = Object.keys(sampleDoc);
  
  console.log(`📋 Total fields in collection: ${allFields.length}\n`);
  
  // Identify numeric fields that might be stored as strings
  const potentialNumericFields = [];
  const stringFieldAnalysis = {};
  
  // Check each field across all documents
  allFields.forEach(fieldName => {
    let stringCount = 0;
    let numericCount = 0;
    let emptyCount = 0;
    let numericStringCount = 0;
    const sampleValues = [];
    
    allDocs.forEach(doc => {
      const value = doc[fieldName];
      
      if (value === null || value === undefined || value === '') {
        emptyCount++;
      } else if (typeof value === 'string') {
        stringCount++;
        
        // Check if it's a numeric string
        if (!isNaN(parseFloat(value)) && isFinite(value) && value.trim() !== '') {
          numericStringCount++;
        }
        
        // Collect sample values (first 3)
        if (sampleValues.length < 3) {
          sampleValues.push(value);
        }
      } else if (typeof value === 'number') {
        numericCount++;
      }
    });
    
    // Determine if this field should be numeric
    const isLikelyNumeric = fieldName.toLowerCase().includes('area') ||
                           fieldName.toLowerCase().includes('amount') ||
                           fieldName.toLowerCase().includes('rate') ||
                           fieldName.toLowerCase().includes('value') ||
                           fieldName.toLowerCase().includes('compensation') ||
                           fieldName.toLowerCase().includes('total') ||
                           fieldName.toLowerCase().includes('price') ||
                           fieldName.toLowerCase().includes('cost') ||
                           fieldName.toLowerCase().includes('land') ||
                           numericStringCount > 0;
    
    if (stringCount > 0 && isLikelyNumeric) {
      potentialNumericFields.push(fieldName);
      stringFieldAnalysis[fieldName] = {
        stringCount,
        numericCount,
        emptyCount,
        numericStringCount,
        sampleValues,
        totalDocs: allDocs.length
      };
    }
  });
  
  console.log(`🎯 Found ${potentialNumericFields.length} fields that likely contain numeric data as strings\n`);
  
  if (potentialNumericFields.length === 0) {
    console.log('✅ No string fields found that need conversion to numeric');
    return;
  }
  
  // Display detailed analysis
  console.log('📊 Detailed Field Analysis:');
  console.log('===========================\n');
  
  potentialNumericFields.forEach(fieldName => {
    const analysis = stringFieldAnalysis[fieldName];
    
    console.log(`🔸 Field: "${fieldName}"`);
    console.log(`   Total documents: ${analysis.totalDocs}`);
    console.log(`   String values: ${analysis.stringCount}`);
    console.log(`   Numeric values: ${analysis.numericCount}`);
    console.log(`   Empty/null values: ${analysis.emptyCount}`);
    console.log(`   Numeric strings: ${analysis.numericStringCount}`);
    console.log(`   Sample string values: [${analysis.sampleValues.map(v => `"${v}"`).join(', ')}]`);
    
    const conversionNeeded = analysis.numericStringCount > 0;
    console.log(`   Conversion needed: ${conversionNeeded ? '✅ YES' : '❌ NO'}`);
    
    if (conversionNeeded) {
      console.log(`   Conversion impact: ${analysis.numericStringCount}/${analysis.totalDocs} documents`);
    }
    
    console.log('');
  });
  
  // Summary
  const fieldsNeedingConversion = potentialNumericFields.filter(fieldName => 
    stringFieldAnalysis[fieldName].numericStringCount > 0
  );
  
  console.log('📋 Conversion Summary:');
  console.log('=====================\n');
  console.log(`Fields needing conversion: ${fieldsNeedingConversion.length}`);
  
  if (fieldsNeedingConversion.length > 0) {
    console.log('\nFields to convert:');
    fieldsNeedingConversion.forEach(fieldName => {
      const analysis = stringFieldAnalysis[fieldName];
      console.log(`  • "${fieldName}" - ${analysis.numericStringCount} string values`);
    });
  }
  
  return {
    totalDocuments: allDocs.length,
    fieldsNeedingConversion,
    fieldAnalysis: stringFieldAnalysis
  };
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    const result = await analyzeEnglishCollection();
    
    if (result && result.fieldsNeedingConversion.length > 0) {
      console.log('\n🚀 Ready to create conversion script for these fields!');
    }
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();