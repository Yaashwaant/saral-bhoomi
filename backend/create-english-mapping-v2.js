import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi';

// Field mapping from Marathi to English
const fieldMapping = {
  'अ.क्र': 'serial_number',
  'खातेदाराचे नांव': 'owner_name',
  'जुना स.नं.': 'old_survey_number',
  'नविन स.नं.': 'new_survey_number',
  'गट नंबर': 'group_number',
  'सी.टी.एस. नंबर': 'cts_number',
  'Village': 'village',
  'Taluka': 'taluka',
  'District': 'district',
  'गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)': 'land_area_as_per_7_12',
  'संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)': 'acquired_land_area',
  'जमिनीचा प्रकार': 'land_type',
  'जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार': 'land_classification',
  'मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये': 'approved_rate_per_hectare',
  'संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू': 'market_value_as_per_acquired_area',
  'कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)': 'factor_as_per_section_26_2',
  'कलम 26 नुसार जमिनीचा मोबदला (9X10)': 'land_compensation_as_per_section_26',
  'बांधकामे': 'structures',
  'वनझाडे': 'forest_trees',
  'फळझाडे': 'fruit_trees',
  'विहिरी/बोअरवेल': 'wells_borewells',
  'एकुण रक्कम रुपये (16+18+ 20+22)': 'total_structures_amount',
  'एकुण रक्कम (14+23)': 'total_amount_14_23',
  '100 % सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1) RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5': 'solatium_amount',
  'निर्धारित मोबदला 26 = (24+25)': 'determined_compensation_26',
  'एकूण रक्कमेवर 25% वाढीव मोबदला (अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)': 'enhanced_compensation_25_percent',
  'एकुण मोबदला (26+ 27)': 'total_compensation_26_27',
  'वजावट रक्कम रुपये': 'deduction_amount',
  'हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)': 'final_payable_compensation',
  'शेरा': 'remarks',
  'मोबदला वाटप तपशिल': 'compensation_distribution_status',
  'project_id': 'project_id',
  'created_by': 'created_by',
  'created_at': 'created_at',
  'updated_at': 'updated_at',
  'is_active': 'is_active'
};

// English collection schema with flexible data types
const englishLandownerSchema = new mongoose.Schema({
  serial_number: { type: mongoose.Schema.Types.Mixed, required: false },
  owner_name: { type: String, required: false },
  old_survey_number: { type: mongoose.Schema.Types.Mixed, required: false },
  new_survey_number: { type: mongoose.Schema.Types.Mixed, required: false },
  group_number: { type: String, required: false },
  cts_number: { type: mongoose.Schema.Types.Mixed, required: false },
  village: { type: String, required: false },
  taluka: { type: String, required: false },
  district: { type: String, required: false },
  land_area_as_per_7_12: { type: mongoose.Schema.Types.Mixed, required: false },
  acquired_land_area: { type: mongoose.Schema.Types.Mixed, required: false },
  land_type: { type: String, required: false },
  land_classification: { type: String, required: false },
  approved_rate_per_hectare: { type: mongoose.Schema.Types.Mixed, required: false },
  market_value_as_per_acquired_area: { type: mongoose.Schema.Types.Mixed, required: false },
  factor_as_per_section_26_2: { type: mongoose.Schema.Types.Mixed, required: false },
  land_compensation_as_per_section_26: { type: mongoose.Schema.Types.Mixed, required: false },
  structures: { type: mongoose.Schema.Types.Mixed, required: false },
  forest_trees: { type: mongoose.Schema.Types.Mixed, required: false },
  fruit_trees: { type: mongoose.Schema.Types.Mixed, required: false },
  wells_borewells: { type: mongoose.Schema.Types.Mixed, required: false },
  total_structures_amount: { type: mongoose.Schema.Types.Mixed, required: false },
  total_amount_14_23: { type: mongoose.Schema.Types.Mixed, required: false },
  solatium_amount: { type: mongoose.Schema.Types.Mixed, required: false },
  determined_compensation_26: { type: mongoose.Schema.Types.Mixed, required: false },
  enhanced_compensation_25_percent: { type: mongoose.Schema.Types.Mixed, required: false },
  total_compensation_26_27: { type: mongoose.Schema.Types.Mixed, required: false },
  deduction_amount: { type: mongoose.Schema.Types.Mixed, required: false },
  final_payable_compensation: { type: mongoose.Schema.Types.Mixed, required: false },
  remarks: { type: String, required: false },
  compensation_distribution_status: { type: String, required: false },
  project_id: { type: mongoose.Schema.Types.ObjectId, required: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, required: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
}, {
  collection: 'landownerrecords_english'
});

const EnglishLandownerRecord = mongoose.model('EnglishLandownerRecord', englishLandownerSchema);

// Safe number conversion function
function safeConvertToNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return 0;
    const num = parseFloat(trimmed.replace(/,/g, '')); // Remove commas
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

// Safe string conversion function
function safeConvertToString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

async function createEnglishCollection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const sourceCollection = db.collection('landownerrecords2');
    
    console.log('\n=== CREATING ENGLISH MAPPED COLLECTION ===\n');

    // Get count of source documents
    const sourceCount = await sourceCollection.countDocuments();
    console.log(`Found ${sourceCount} documents in landownerrecords2`);

    // Get sample document to verify field mapping
    const sampleDoc = await sourceCollection.findOne({});
    if (!sampleDoc) {
      console.log('No documents found in source collection');
      return;
    }

    console.log('\nSample source document fields:');
    Object.keys(sampleDoc).forEach(key => {
      const englishName = fieldMapping[key] || 'NO_MAPPING';
      console.log(`  "${key}" -> "${englishName}"`);
    });

    // Check if English collection exists
    const collections = await db.listCollections({ name: 'landownerrecords_english' }).toArray();
    if (collections.length > 0) {
      console.log('\nEnglish collection already exists. Dropping it first...');
      await db.collection('landownerrecords_english').drop();
    }

    console.log('\nCreating English collection with mapped fields...');

    // Process documents in batches
    const batchSize = 50;
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    while (processed < sourceCount) {
      const batch = await sourceCollection
        .find({})
        .skip(processed)
        .limit(batchSize)
        .toArray();

      const englishDocuments = [];

      for (const doc of batch) {
        try {
          const englishDoc = {};
          let hasSerialNumber = false;
          let hasOwnerName = false;

          // Map fields using the field mapping
          for (const [marathiField, englishField] of Object.entries(fieldMapping)) {
            if (doc.hasOwnProperty(marathiField)) {
              let value = doc[marathiField];
              
              // Convert data types appropriately based on field type
              if (value !== null && value !== undefined && value !== '') {
                // Handle numeric fields
                if (englishField.includes('number') || englishField.includes('amount') || 
                    englishField.includes('area') || englishField.includes('rate') ||
                    englishField.includes('compensation') || englishField.includes('factor') ||
                    englishField === 'serial_number' || englishField === 'old_survey_number' || 
                    englishField === 'new_survey_number' || englishField === 'cts_number') {
                  value = safeConvertToNumber(value);
                } else if (englishField === 'project_id') {
                  // Handle ObjectId fields
                  if (mongoose.Types.ObjectId.isValid(value)) {
                    value = new mongoose.Types.ObjectId(value);
                  } else {
                    continue; // Skip invalid ObjectIds
                  }
                } else {
                  // Handle string fields
                  value = safeConvertToString(value);
                }
                
                englishDoc[englishField] = value;
                
                // Check if we have the required fields
                if (englishField === 'serial_number' && value) {
                  hasSerialNumber = true;
                }
                if (englishField === 'owner_name' && value) {
                  hasOwnerName = true;
                }
              }
            }
          }

          // Add missing fields with default values
          if (!englishDoc.is_active) {
            englishDoc.is_active = true;
          }
          if (!englishDoc.created_at) {
            englishDoc.created_at = new Date();
          }
          if (!englishDoc.updated_at) {
            englishDoc.updated_at = new Date();
          }

          // Only include documents with required fields
          if (hasSerialNumber && hasOwnerName) {
            englishDocuments.push(englishDoc);
          } else {
            skipped++;
            console.log(`Skipped document ${doc._id} - missing serial_number or owner_name`);
          }
        } catch (docError) {
          errors++;
          console.log(`Error processing document ${doc._id}:`, docError.message);
        }
      }

      if (englishDocuments.length > 0) {
        try {
          await EnglishLandownerRecord.insertMany(englishDocuments);
          processed += englishDocuments.length;
          console.log(`Processed ${processed}/${sourceCount} documents...`);
        } catch (insertError) {
          console.log('Batch insert error:', insertError.message);
          errors += englishDocuments.length;
        }
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total source documents: ${sourceCount}`);
    console.log(`Successfully mapped: ${processed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);

    // Verify the English collection
    const englishCount = await EnglishLandownerRecord.countDocuments();
    console.log(`English collection now has ${englishCount} documents`);

    // Show sample of mapped data
    const sampleEnglish = await EnglishLandownerRecord.findOne({});
    if (sampleEnglish) {
      console.log('\nSample mapped document:');
      console.log(JSON.stringify(sampleEnglish, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createEnglishCollection();