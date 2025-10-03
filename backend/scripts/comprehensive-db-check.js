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

// Function to perform comprehensive database check
const comprehensiveCheck = async () => {
  console.log('🔍 Comprehensive Database Check');
  console.log('===============================');
  
  const collection = getCollection();
  
  // Get accurate total count
  const totalCount = await collection.countDocuments();
  console.log(`📊 Total documents in collection: ${totalCount}\n`);
  
  if (totalCount === 0) {
    console.log('❌ No documents found in the collection');
    return;
  }
  
  // Fields to check for numeric conversion
  const numericFields = [
    'गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर',
    'संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर',
    'मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये',
    'संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू',
    'कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8',
    'कलम_26_नुसार_जमिनीचा_मोबदला_9X10',
    'बांधकामे',
    'वनझाडे',
    'फळझाडे',
    'विहिरी/बोअरवेल',
    'एकुण रक्कम रुपये (16+18+ 20+22)',
    'एकुण रक्कम (14+23)',
    '100 %  सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1)  RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5      5',
    'निर्धारित मोबदला 26 = (24+25)',
    'एकूण रक्कमेवर  25%  वाढीव मोबदला\n(अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)',
    'एकुण मोबदला (26+ 27)',
    'वजावट रक्कम रुपये',
    'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)'
  ];
  
  console.log('🔍 Analyzing data types across all documents...\n');
  
  // Initialize counters
  const fieldStats = {};
  numericFields.forEach(field => {
    fieldStats[field] = {
      total: 0,
      strings: 0,
      numbers: 0,
      nulls: 0,
      empties: 0,
      stringValues: []
    };
  });
  
  // Process all documents
  const cursor = collection.find({});
  let processedCount = 0;
  
  await cursor.forEach(doc => {
    processedCount++;
    
    numericFields.forEach(field => {
      const value = doc[field];
      
      if (value === null || value === undefined) {
        fieldStats[field].nulls++;
      } else if (value === '' || value === 0) {
        fieldStats[field].empties++;
      } else if (typeof value === 'string') {
        fieldStats[field].strings++;
        fieldStats[field].total++;
        // Store first few string values as examples
        if (fieldStats[field].stringValues.length < 5) {
          fieldStats[field].stringValues.push(value);
        }
      } else if (typeof value === 'number') {
        fieldStats[field].numbers++;
        fieldStats[field].total++;
      }
    });
    
    // Progress indicator
    if (processedCount % 10 === 0) {
      console.log(`⏳ Processed ${processedCount}/${totalCount} documents...`);
    }
  });
  
  console.log(`\n✅ Completed analysis of ${processedCount} documents\n`);
  
  // Report findings
  console.log('📊 FIELD ANALYSIS RESULTS:');
  console.log('==========================\n');
  
  let hasStringFields = false;
  
  numericFields.forEach(field => {
    const stats = fieldStats[field];
    
    if (stats.total > 0 || stats.strings > 0) {
      console.log(`🔸 ${field}:`);
      console.log(`   Total non-empty values: ${stats.total}`);
      console.log(`   String values: ${stats.strings}`);
      console.log(`   Number values: ${stats.numbers}`);
      console.log(`   Null/undefined: ${stats.nulls}`);
      console.log(`   Empty/zero: ${stats.empties}`);
      
      if (stats.strings > 0) {
        hasStringFields = true;
        console.log(`   ⚠️  STRING VALUES DETECTED!`);
        console.log(`   Example string values: ${stats.stringValues.join(', ')}`);
      } else if (stats.numbers > 0) {
        console.log(`   ✅ All values are numeric`);
      }
      console.log('');
    }
  });
  
  // Summary
  console.log('\n🎯 SUMMARY:');
  console.log('===========');
  
  if (hasStringFields) {
    console.log('⚠️  STRING VALUES FOUND - Migration needed!');
    console.log('📝 Fields with string values need to be converted to numbers.');
  } else {
    console.log('✅ All numeric fields contain proper numeric values');
    console.log('🎉 Database is already optimized for numeric operations');
  }
  
  console.log(`\n📊 Total documents processed: ${processedCount}`);
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await comprehensiveCheck();
  } catch (error) {
    console.error('❌ Error during comprehensive check:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

main();