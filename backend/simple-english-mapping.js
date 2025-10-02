import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi';

// Simple mapping function
function mapMarathiToEnglish(doc) {
  return {
    serial_number: doc['अ.क्र'] || doc['serial_number'],
    owner_name: doc['खातेदाराचे नांव'] || doc['owner_name'],
    old_survey_number: doc['जुना स.नं.'],
    new_survey_number: doc['नविन स.नं.'],
    group_number: doc['गट नंबर'],
    cts_number: doc['सी.टी.एस. नंबर'],
    village: doc['Village'],
    taluka: doc['Taluka'],
    district: doc['District'],
    land_area_as_per_7_12: doc['गांव नमुना 7/12 नुसार जमिनीचे क्षेत्र (हे.आर)'],
    acquired_land_area: doc['संपादित जमिनीचे क्षेत्र (चौ.मी/हेक्टर आर)'],
    land_type: doc['जमिनीचा प्रकार'],
    land_classification: doc['जमिनीचा प्रकार शेती/ बिनशेती/ धारणाधिकार'],
    approved_rate_per_hectare: doc['मंजुर केलेला दर (प्रति हेक्टर) रक्कम रुपये'],
    market_value_as_per_acquired_area: doc['संपादीत होणाऱ्या जमिनीच्या क्षेत्रानुसार येणारे बाजारमुल्य र.रू'],
    factor_as_per_section_26_2: doc['कलम 26 (2) नुसार गावास लागु असलेले गणक Factor (अ.क्र. 5 X 8)'],
    land_compensation_as_per_section_26: doc['कलम 26 नुसार जमिनीचा मोबदला (9X10)'],
    structures: doc['बांधकामे'],
    forest_trees: doc['वनझाडे'],
    fruit_trees: doc['फळझाडे'],
    wells_borewells: doc['विहिरी/बोअरवेल'],
    total_structures_amount: doc['एकुण रक्कम रुपये (16+18+ 20+22)'],
    total_amount_14_23: doc['एकुण रक्कम (14+23)'],
    solatium_amount: doc['100 % सोलेशियम (दिलासा रक्कम) सेक्शन 30 (1) RFCT-LARR 2013 अनुसूचि 1 अ.नं. 5'],
    determined_compensation_26: doc['निर्धारित मोबदला 26 = (24+25)'],
    enhanced_compensation_25_percent: doc['एकूण रक्कमेवर 25% वाढीव मोबदला (अ.क्र. 26 नुसार येणाऱ्या रक्कमेवर)'],
    total_compensation_26_27: doc['एकुण मोबदला (26+ 27)'],
    deduction_amount: doc['वजावट रक्कम रुपये'],
    final_payable_compensation: doc['हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये (अ.क्र. 28 वजा 29)'],
    remarks: doc['शेरा'],
    compensation_distribution_status: doc['मोबदला वाटप तपशिल'],
    project_id: doc['project_id'],
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  };
}

async function createSimpleEnglishCollection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const sourceCollection = db.collection('landownerrecords2');
    const targetCollection = db.collection('landownerrecords_english');
    
    console.log('\n=== CREATING SIMPLE ENGLISH MAPPED COLLECTION ===\n');

    // Get count of source documents
    const sourceCount = await sourceCollection.countDocuments();
    console.log(`Found ${sourceCount} documents in landownerrecords2`);

    // Check if English collection exists and drop it
    const collections = await db.listCollections({ name: 'landownerrecords_english' }).toArray();
    if (collections.length > 0) {
      console.log('English collection exists. Dropping it first...');
      await targetCollection.drop();
    }

    console.log('Creating English collection...');

    // Process all documents
    const documents = await sourceCollection.find({}).toArray();
    let processed = 0;
    let skipped = 0;

    for (const doc of documents) {
      try {
        // Check if document has required fields
        if (doc['अ.क्र'] && doc['खातेदाराचे नांव']) {
          const englishDoc = mapMarathiToEnglish(doc);
          await targetCollection.insertOne(englishDoc);
          processed++;
        } else {
          skipped++;
          console.log(`Skipped document ${doc._id} - missing required fields`);
        }
      } catch (error) {
        console.log(`Error processing document ${doc._id}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total source documents: ${sourceCount}`);
    console.log(`Successfully mapped: ${processed}`);
    console.log(`Skipped: ${skipped}`);

    // Verify the English collection
    const englishCount = await targetCollection.countDocuments();
    console.log(`English collection now has ${englishCount} documents`);

    // Show sample of mapped data
    const sampleEnglish = await targetCollection.findOne({});
    if (sampleEnglish) {
      console.log('\nSample mapped document:');
      console.log('Serial Number:', sampleEnglish.serial_number);
      console.log('Owner Name:', sampleEnglish.owner_name);
      console.log('Village:', sampleEnglish.village);
      console.log('Taluka:', sampleEnglish.taluka);
      console.log('District:', sampleEnglish.district);
      console.log('Compensation Status:', sampleEnglish.compensation_distribution_status);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSimpleEnglishCollection();