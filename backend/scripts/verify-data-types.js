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

// Function to check data types of specific fields
const verifyDataTypes = async () => {
  console.log('🔍 Data Type Verification Tool');
  console.log('===============================');
  
  const collection = getCollection();
  
  // Get a sample of documents
  const sampleDocs = await collection.find({}).limit(5).toArray();
  
  if (sampleDocs.length === 0) {
    console.log('❌ No documents found in the collection');
    return;
  }
  
  console.log(`📊 Analyzing ${sampleDocs.length} sample documents...\n`);
  
  // Fields to check
  const fieldsToCheck = [
    'गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर',
    'संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर',
    'मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये',
    'संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू',
    'कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8',
    'कलम_26_नुसार_जमिनीचा_मोबदला_9X10',
    'एकुण_रक्कम_रुपये_16_18_20_22',
    'एकुण_रक्कम_14_23',
    'निर्धारित_मोबदला_26',
    'एकुण_मोबदला_26_27',
    'वजावट_रक्कम_रुपये',
    'हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये'
  ];
  
  sampleDocs.forEach((doc, index) => {
    console.log(`🔸 Document ${index + 1} (ID: ${doc._id}):`);
    
    fieldsToCheck.forEach(field => {
      const value = doc[field];
      const type = typeof value;
      const isString = type === 'string';
      const isNumber = type === 'number';
      
      if (value !== undefined && value !== null && value !== '') {
        console.log(`   ${field}:`);
        console.log(`     Value: ${value}`);
        console.log(`     Type: ${type}`);
        console.log(`     Is String: ${isString}`);
        console.log(`     Is Number: ${isNumber}`);
        
        if (isString) {
          console.log(`     ⚠️  STRING DETECTED - needs conversion`);
        } else if (isNumber) {
          console.log(`     ✅ Already numeric`);
        }
        console.log('');
      }
    });
    
    console.log('---\n');
  });
  
  // Count documents with string values in numeric fields
  console.log('🔍 Counting documents with string values in numeric fields...\n');
  
  for (const field of fieldsToCheck) {
    const stringCount = await collection.countDocuments({
      [field]: { $type: "string", $ne: "", $ne: null }
    });
    
    const numberCount = await collection.countDocuments({
      [field]: { $type: "number" }
    });
    
    const totalCount = await collection.countDocuments({
      [field]: { $exists: true, $ne: null, $ne: "" }
    });
    
    if (totalCount > 0) {
      console.log(`📊 Field: ${field}`);
      console.log(`   Total non-empty values: ${totalCount}`);
      console.log(`   String values: ${stringCount}`);
      console.log(`   Number values: ${numberCount}`);
      
      if (stringCount > 0) {
        console.log(`   ⚠️  ${stringCount} string values need conversion`);
      } else {
        console.log(`   ✅ All values are already numeric`);
      }
      console.log('');
    }
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await verifyDataTypes();
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

main();