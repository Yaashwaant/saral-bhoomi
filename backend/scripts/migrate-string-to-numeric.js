import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Safe numeric conversion function (same as frontend)
const safeNumericConversion = (value) => {
  // Handle null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  // If already a number, return as is
  if (typeof value === 'number') {
    return value;
  }
  
  // Convert string to number
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point and minus sign
    const cleanedValue = value.replace(/[^\d.-]/g, '');
    const numericValue = parseFloat(cleanedValue);
    
    // Return 0 if conversion failed
    return isNaN(numericValue) ? 0 : numericValue;
  }
  
  // Default fallback
  return 0;
};

// Fields that need to be converted from string to numeric
const numericFields = [
  'गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर', // land_area_as_per_7_12
  'संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर', // acquired_land_area
  'मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये', // approved_rate_per_hectare
  'संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू', // market_value_as_per_acquired_area
  'कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8', // factor_as_per_section_26_2
  'कलम_26_नुसार_जमिनीचा_मोबदला_9X10', // land_compensation_as_per_section_26
  'बांधकामे', // structures
  'वनझाडे', // forest_trees
  'फळझाडे', // fruit_trees
  'विहिरी_बोअरवेल', // wells_borewells
  'एकुण_रक्कम_रुपये_16_18_20_22', // total_structures_amount
  'एकुण_रक्कम_14_23', // total_amount_14_23
  'सोलेशियम_दिलासा_रक्कम', // solatium_amount
  'निर्धारित_मोबदला_26', // determined_compensation_26
  'एकूण_रक्कमेवर_25_वाढीव_मोबदला', // enhanced_compensation_25_percent
  'एकुण_मोबदला_26_27', // total_compensation_26_27
  'वजावट_रक्कम_रुपये', // deduction_amount
  'हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये' // final_payable_compensation
];

// Migration function
const migrateStringToNumeric = async () => {
  try {
    console.log('🚀 Starting string to numeric migration...');
    
    // Get the collection directly
    const collection = mongoose.connection.db.collection('landownerrecords2');
    
    // Get all documents
    const documents = await collection.find({}).toArray();
    console.log(`📊 Found ${documents.length} documents to process`);
    
    let processedCount = 0;
    let updatedCount = 0;
    
    for (const doc of documents) {
      const updates = {};
      let hasUpdates = false;
      
      // Process each numeric field
      for (const field of numericFields) {
        if (doc[field] !== undefined) {
          const originalValue = doc[field];
          const numericValue = safeNumericConversion(originalValue);
          
          // Only update if the value is different (string to number conversion)
          if (typeof originalValue === 'string' && originalValue !== '' && numericValue !== originalValue) {
            updates[field] = numericValue;
            hasUpdates = true;
            console.log(`  📝 ${doc.अ_क्र || doc._id}: ${field} "${originalValue}" → ${numericValue}`);
          }
        }
      }
      
      // Update document if there are changes
      if (hasUpdates) {
        await collection.updateOne(
          { _id: doc._id },
          { $set: updates }
        );
        updatedCount++;
      }
      
      processedCount++;
      
      // Progress indicator
      if (processedCount % 10 === 0) {
        console.log(`⏳ Processed ${processedCount}/${documents.length} documents...`);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Total documents processed: ${processedCount}`);
    console.log(`   - Documents updated: ${updatedCount}`);
    console.log(`   - Documents unchanged: ${processedCount - updatedCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Verification function to check the migration results
const verifyMigration = async () => {
  try {
    console.log('🔍 Verifying migration results...');
    
    const collection = mongoose.connection.db.collection('landownerrecords2');
    
    // Sample a few documents to verify
    const sampleDocs = await collection.find({}).limit(5).toArray();
    
    console.log('📋 Sample verification:');
    for (const doc of sampleDocs) {
      console.log(`\n🔸 Document ${doc.अ_क्र || doc._id}:`);
      for (const field of numericFields.slice(0, 5)) { // Check first 5 fields
        if (doc[field] !== undefined) {
          console.log(`   ${field}: ${doc[field]} (${typeof doc[field]})`);
        }
      }
    }
    
    // Count documents with string values in numeric fields
    let stringFieldsFound = 0;
    for (const field of numericFields) {
      const stringCount = await collection.countDocuments({
        [field]: { $type: "string", $ne: "" }
      });
      if (stringCount > 0) {
        console.log(`⚠️  Found ${stringCount} documents with string values in ${field}`);
        stringFieldsFound += stringCount;
      }
    }
    
    if (stringFieldsFound === 0) {
      console.log('✅ Verification passed: All numeric fields contain proper numeric values');
    } else {
      console.log(`⚠️  Verification warning: ${stringFieldsFound} string values still found in numeric fields`);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
};

// Main execution function
const main = async () => {
  try {
    await connectDB();
    
    console.log('🎯 Land Records String-to-Numeric Migration Tool');
    console.log('================================================');
    
    // Run migration
    await migrateStringToNumeric();
    
    // Verify results
    await verifyMigration();
    
    console.log('\n🎉 Migration process completed!');
    
  } catch (error) {
    console.error('💥 Migration process failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

// Run the migration
main();