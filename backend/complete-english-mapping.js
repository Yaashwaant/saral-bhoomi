import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi';

// Complete field mapping from Marathi to English - ALL FIELDS
const completeFieldMapping = {
  // Core identification fields
  'अ.क्र': 'serial_number',
  'खातेदाराचे नांव': 'owner_name',
  'जुना स.नं.': 'old_survey_number',
  'नविन स.नं.': 'new_survey_number',
  'गट नंबर': 'group_number',
  'सी.टी.एस. नंबर': 'cts_number',
  
  // Location fields
  'Village': 'village',
  'Taluka': 'taluka',
  'District': 'district',
  
  // Land area fields
  'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)': 'land_area_as_per_7_12',
  'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)': 'acquired_land_area',
  
  // Land type and classification
  'जमिनीचा प्रकार': 'land_type',
  'जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार': 'land_classification',
  
  // Compensation calculation fields
  'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये': 'approved_rate_per_hectare',
  'संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू': 'market_value_as_per_acquired_area',
  'कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)': 'factor_as_per_section_26_2',
  'कलम 26 नुसार जमिनीचा मोबदला (9X10)': 'land_compensation_as_per_section_26',
  
  // Structure and asset fields
  'बांधकामे': 'structures',
  'वनझाडे': 'forest_trees',
  'फळझाडे': 'fruit_trees',
  'विहिरी/बोअरवेल': 'wells_borewells',
  
  // Amount calculations
  'एकुण रक्कम रुपये (16+18+ 20+22)': 'total_structures_amount',
  'एकुण रक्कम (14+23)': 'total_amount_14_23',
  '100 % सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1) RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5': 'solatium_amount',
  'निर्धारित मोबदला 26 = (24+25)': 'determined_compensation_26',
  'एकूण रक्कमेवर 25% वाढीव मोबदला (अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)': 'enhanced_compensation_25_percent',
  'एकुण मोबदला (26+ 27)': 'total_compensation_26_27',
  'वजावट रक्कम रुपये': 'deduction_amount',
  'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)': 'final_payable_compensation',
  
  // Additional fields
  'शेरा': 'remarks',
  'मोबदला वाटप तपशिल': 'compensation_distribution_status',
  'project_id': 'project_id',
  
  // System fields (if they exist)
  'created_by': 'created_by',
  'created_at': 'created_at',
  'updated_at': 'updated_at',
  'is_active': 'is_active'
};

// Complete English collection schema with ALL fields
const completeEnglishLandownerSchema = new mongoose.Schema({
  // Core identification fields
  serial_number: { type: mongoose.Schema.Types.Mixed, required: false },
  owner_name: { type: String, required: false },
  old_survey_number: { type: mongoose.Schema.Types.Mixed, required: false },
  new_survey_number: { type: mongoose.Schema.Types.Mixed, required: false },
  group_number: { type: String, required: false },
  cts_number: { type: mongoose.Schema.Types.Mixed, required: false },
  
  // Location fields
  village: { type: String, required: false },
  taluka: { type: String, required: false },
  district: { type: String, required: false },
  
  // Land area fields
  land_area_as_per_7_12: { type: mongoose.Schema.Types.Mixed, required: false },
  acquired_land_area: { type: mongoose.Schema.Types.Mixed, required: false },
  
  // Land type and classification
  land_type: { type: String, required: false },
  land_classification: { type: String, required: false },
  
  // Compensation calculation fields
  approved_rate_per_hectare: { type: mongoose.Schema.Types.Mixed, required: false },
  market_value_as_per_acquired_area: { type: mongoose.Schema.Types.Mixed, required: false },
  factor_as_per_section_26_2: { type: mongoose.Schema.Types.Mixed, required: false },
  land_compensation_as_per_section_26: { type: mongoose.Schema.Types.Mixed, required: false },
  
  // Structure and asset fields
  structures: { type: mongoose.Schema.Types.Mixed, required: false },
  forest_trees: { type: mongoose.Schema.Types.Mixed, required: false },
  fruit_trees: { type: mongoose.Schema.Types.Mixed, required: false },
  wells_borewells: { type: mongoose.Schema.Types.Mixed, required: false },
  
  // Amount calculations
  total_structures_amount: { type: mongoose.Schema.Types.Mixed, required: false },
  total_amount_14_23: { type: mongoose.Schema.Types.Mixed, required: false },
  solatium_amount: { type: mongoose.Schema.Types.Mixed, required: false },
  determined_compensation_26: { type: mongoose.Schema.Types.Mixed, required: false },
  enhanced_compensation_25_percent: { type: mongoose.Schema.Types.Mixed, required: false },
  total_compensation_26_27: { type: mongoose.Schema.Types.Mixed, required: false },
  deduction_amount: { type: mongoose.Schema.Types.Mixed, required: false },
  final_payable_compensation: { type: mongoose.Schema.Types.Mixed, required: false },
  
  // Additional fields
  remarks: { type: String, required: false },
  compensation_distribution_status: { type: String, required: false },
  project_id: { type: mongoose.Schema.Types.ObjectId, required: false },
  
  // System fields
  created_by: { type: mongoose.Schema.Types.ObjectId, required: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
}, {
  collection: 'landownerrecords_english_complete'
});

const CompleteEnglishLandownerRecord = mongoose.model('CompleteEnglishLandownerRecord', completeEnglishLandownerSchema);

// Safe conversion functions
function safeConvertValue(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return value;
  }
  
  // For numeric fields, try to convert to number
  if (fieldName.includes('number') || fieldName.includes('amount') || 
      fieldName.includes('area') || fieldName.includes('rate') ||
      fieldName.includes('compensation') || fieldName.includes('factor')) {
    if (typeof value === 'string') {
      const cleanedValue = value.toString().replace(/,/g, '').trim();
      const numValue = parseFloat(cleanedValue);
      return isNaN(numValue) ? value : numValue;
    }
    return typeof value === 'number' ? value : value;
  }
  
  // For string fields, ensure it's a string
  return typeof value === 'string' ? value.trim() : value;
}

async function createCompleteEnglishCollection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const sourceCollection = db.collection('landownerrecords2');
    const targetCollectionName = 'landownerrecords_english_complete';
    
    console.log('\n=== CREATING COMPLETE ENGLISH MAPPED COLLECTION ===\n');

    // Get count of source documents
    const sourceCount = await sourceCollection.countDocuments();
    console.log(`Found ${sourceCount} documents in landownerrecords2`);

    // Check if target collection exists and drop it
    const collections = await db.listCollections({ name: targetCollectionName }).toArray();
    if (collections.length > 0) {
      console.log(`Collection ${targetCollectionName} exists. Dropping it first...`);
      await db.collection(targetCollectionName).drop();
    }

    console.log('Creating complete English collection with ALL fields...');

    // Process all documents
    const documents = await sourceCollection.find({}).toArray();
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of documents) {
      try {
        const englishDoc = {};
        
        // Map ALL fields from the source document
        for (const [marathiField, englishField] of Object.entries(completeFieldMapping)) {
          if (doc.hasOwnProperty(marathiField)) {
            let value = doc[marathiField];
            
            // Apply safe conversion based on field type
            value = safeConvertValue(value, englishField);
            
            englishDoc[englishField] = value;
          }
        }

        // Add any additional fields that exist in the source but aren't in our mapping
        for (const [fieldName, value] of Object.entries(doc)) {
          if (!completeFieldMapping.hasOwnProperty(fieldName) && 
              !['__v', '_id'].includes(fieldName)) {
            // Add unmapped fields with their original names prefixed
            englishDoc[`original_${fieldName}`] = value;
            console.log(`Added unmapped field: ${fieldName} as original_${fieldName}`);
          }
        }

        // Add system fields
        englishDoc.is_active = true;
        englishDoc.created_at = new Date();
        englishDoc.updated_at = new Date();

        // Insert the complete document
        await db.collection(targetCollectionName).insertOne(englishDoc);
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`Processed ${processed}/${sourceCount} documents...`);
        }
        
      } catch (error) {
        console.log(`Error processing document ${doc._id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total source documents: ${sourceCount}`);
    console.log(`Successfully mapped: ${processed}`);
    console.log(`Errors: ${errors}`);

    // Verify the English collection
    const englishCount = await db.collection(targetCollectionName).countDocuments();
    console.log(`English collection now has ${englishCount} documents`);

    // Show detailed sample of mapped data
    const sampleEnglish = await db.collection(targetCollectionName).findOne({});
    if (sampleEnglish) {
      console.log('\n=== SAMPLE MAPPED DOCUMENT ===');
      console.log('All mapped fields in sample:');
      
      Object.keys(sampleEnglish).forEach(key => {
        if (sampleEnglish[key] !== null && sampleEnglish[key] !== undefined && sampleEnglish[key] !== '') {
          console.log(`  ${key}: ${sampleEnglish[key]}`);
        }
      });
    }

    // Show field mapping summary
    console.log('\n=== FIELD MAPPING SUMMARY ===');
    console.log('Marathi -> English mappings:');
    Object.entries(completeFieldMapping).forEach(([marathi, english]) => {
      console.log(`  "${marathi}" -> "${english}"`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createCompleteEnglishCollection();