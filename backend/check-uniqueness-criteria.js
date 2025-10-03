import mongoose from 'mongoose';
import CompleteEnglishLandownerRecord from './models/mongo/CompleteEnglishLandownerRecord.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi_mvp';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to analyze uniqueness criteria based on survey numbers + village + owner name + acquired land area
const analyzeUniquenessCriteria = async () => {
  console.log('🔍 Analyzing Uniqueness Criteria: Survey Numbers + Village + Owner Name + Acquired Land Area');
  console.log('===========================================================================================\n');

  // 1. Count total documents
  const totalDocs = await CompleteEnglishLandownerRecord.countDocuments();
  console.log(`📊 Total documents in database: ${totalDocs}`);

  // 2. Count active documents (is_active: true)
  const activeDocs = await CompleteEnglishLandownerRecord.countDocuments({ is_active: true });
  console.log(`✅ Active documents (is_active: true): ${activeDocs}`);

  // 3. Count inactive documents
  const inactiveDocs = totalDocs - activeDocs;
  console.log(`❌ Inactive documents (is_active: false): ${inactiveDocs}\n`);

  // 4. Analyze duplicates by new_survey_number + old_survey_number + village + owner_name + acquired_land_area
  console.log('🔄 Analyzing duplicates by new_survey_number + old_survey_number + village + owner_name + acquired_land_area:');
  const duplicatesBySurveyVillageOwner = await CompleteEnglishLandownerRecord.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: { 
          new_survey_number: '$new_survey_number', 
          old_survey_number: '$old_survey_number',
          village: '$village',
          owner_name: '$owner_name',
          acquired_land_area: '$acquired_land_area'
        },
        count: { $sum: 1 },
        documents: { 
          $push: { 
            id: '$_id', 
            project_id: '$project_id',
            serial_number: '$serial_number'
          } 
        }
      }
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } }
  ]);

  console.log(`   Found ${duplicatesBySurveyVillageOwner.length} survey+village+owner+land_area combinations with duplicates`);
  let totalDuplicatesBySurveyVillageOwner = 0;
  duplicatesBySurveyVillageOwner.forEach(dup => {
    totalDuplicatesBySurveyVillageOwner += (dup.count - 1);
    console.log(`   🔄 Duplicate found:`);
    console.log(`      New Survey: ${dup._id.new_survey_number}`);
    console.log(`      Old Survey: ${dup._id.old_survey_number}`);
    console.log(`      Village: ${dup._id.village}`);
    console.log(`      Owner: ${dup._id.owner_name}`);
    console.log(`      Acquired Land Area: ${dup._id.acquired_land_area}`);
    console.log(`      Total copies: ${dup.count}`);
    dup.documents.forEach((doc, index) => {
      if (index === 0) {
        console.log(`      Original: ${doc.id} (Serial: ${doc.serial_number})`);
      } else {
        console.log(`      Duplicate: ${doc.id} (Serial: ${doc.serial_number})`);
      }
    });
    console.log('');
  });

  // 5. Analyze duplicates by new_survey_number + old_survey_number + village + owner_name + project_id
  console.log('🔄 Analyzing duplicates by new_survey_number + old_survey_number + village + owner_name + project_id:');
  const duplicatesBySurveyVillageOwnerProject = await CompleteEnglishLandownerRecord.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: { 
          new_survey_number: '$new_survey_number', 
          old_survey_number: '$old_survey_number',
          village: '$village',
          owner_name: '$owner_name',
          project_id: '$project_id'
        },
        count: { $sum: 1 },
        documents: { 
          $push: { 
            id: '$_id', 
            serial_number: '$serial_number'
          } 
        }
      }
    },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } }
  ]);

  console.log(`   Found ${duplicatesBySurveyVillageOwnerProject.length} survey+village+owner+project combinations with duplicates`);
  let totalDuplicatesBySurveyVillageOwnerProject = 0;
  duplicatesBySurveyVillageOwnerProject.forEach(dup => {
    totalDuplicatesBySurveyVillageOwnerProject += (dup.count - 1);
    console.log(`   🔄 Duplicate:`);
    console.log(`      New Survey: ${dup._id.new_survey_number}, Old Survey: ${dup._id.old_survey_number}`);
    console.log(`      Village: ${dup._id.village}, Owner: ${dup._id.owner_name}`);
    console.log(`      Project: ${dup._id.project_id}`);
    dup.documents.forEach((doc, index) => {
      if (index === 0) {
        console.log(`      Original: ${doc.id} (Serial: ${doc.serial_number})`);
      } else {
        console.log(`      Duplicate: ${doc.id} (Serial: ${doc.serial_number})`);
      }
    });
  });

  // 6. Check for missing critical fields
  console.log('\n🔍 Checking for missing critical survey/village/owner/land_area fields:');
  const missingFields = await CompleteEnglishLandownerRecord.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: null,
        missing_new_survey: { $sum: { $cond: [{ $or: [{ $eq: ['$new_survey_number', null] }, { $eq: ['$new_survey_number', ''] }] }, 1, 0] } },
        missing_old_survey: { $sum: { $cond: [{ $or: [{ $eq: ['$old_survey_number', null] }, { $eq: ['$old_survey_number', ''] }] }, 1, 0] } },
        missing_village: { $sum: { $cond: [{ $or: [{ $eq: ['$village', null] }, { $eq: ['$village', ''] }] }, 1, 0] } },
        missing_owner: { $sum: { $cond: [{ $or: [{ $eq: ['$owner_name', null] }, { $eq: ['$owner_name', ''] }] }, 1, 0] } },
        missing_acquired_land_area: { $sum: { $cond: [{ $or: [{ $eq: ['$acquired_land_area', null] }, { $eq: ['$acquired_land_area', ''] }] }, 1, 0] } },
        missing_project: { $sum: { $cond: [{ $eq: ['$project_id', null] }, 1, 0] } }
      }
    }
  ]);

  if (missingFields.length > 0) {
    const missing = missingFields[0];
    console.log(`   Missing new_survey_number: ${missing.missing_new_survey}`);
    console.log(`   Missing old_survey_number: ${missing.missing_old_survey}`);
    console.log(`   Missing village: ${missing.missing_village}`);
    console.log(`   Missing owner_name: ${missing.missing_owner}`);
    console.log(`   Missing acquired_land_area: ${missing.missing_acquired_land_area}`);
    console.log(`   Missing project_id: ${missing.missing_project}`);
  }

  // 7. Simulate app filtering logic with survey+village+owner+land_area uniqueness
  console.log('\n🎯 Simulating app filtering logic (Survey + Village + Owner + Land Area uniqueness):');
  console.log('   Step 1: Filter by is_active: true');
  console.log(`   Result: ${activeDocs} documents`);
  
  console.log('   Step 2: Apply deduplication by new_survey_number + old_survey_number + village + owner_name + acquired_land_area');
  const uniqueAfterSurveyVillageOwnerDedup = activeDocs - totalDuplicatesBySurveyVillageOwner;
  console.log(`   Result: ${uniqueAfterSurveyVillageOwnerDedup} unique documents`);

  console.log('   Step 3: Apply deduplication by new_survey_number + old_survey_number + village + owner_name + project_id');
  const uniqueAfterFullDedup = activeDocs - totalDuplicatesBySurveyVillageOwnerProject;
  console.log(`   Result: ${uniqueAfterFullDedup} unique documents`);
  
  console.log(`\n📊 Unique documents after survey+village+owner+land_area deduplication: ${uniqueAfterSurveyVillageOwnerDedup}`);
  console.log(`📊 Unique documents after survey+village+owner+project deduplication: ${uniqueAfterFullDedup}`);
  console.log(`📊 Survey+Village+Owner+Land_Area duplicates removed: ${totalDuplicatesBySurveyVillageOwner}`);
  console.log(`📊 Survey+Village+Owner+Project duplicates removed: ${totalDuplicatesBySurveyVillageOwnerProject}`);

  // 8. Project-wise analysis with survey+village+owner+land_area uniqueness
  console.log('\n🏗️  Project-wise Document Distribution (Survey+Village+Owner+Land_Area uniqueness):');
  console.log('=======================================================================');
  const projectStats = await CompleteEnglishLandownerRecord.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: '$project_id',
        total_docs: { $sum: 1 },
        unique_survey_village_owner_land: { 
          $addToSet: { 
            new_survey: '$new_survey_number', 
            old_survey: '$old_survey_number',
            village: '$village',
            owner: '$owner_name',
            acquired_land_area: '$acquired_land_area'
          } 
        }
      }
    },
    {
      $project: {
        project_id: '$_id',
        total_docs: 1,
        unique_combinations_count: { $size: '$unique_survey_village_owner_land' },
        duplicates: { $subtract: ['$total_docs', { $size: '$unique_survey_village_owner_land' }] }
      }
    }
  ]);

  projectStats.forEach(stat => {
    console.log(`   Project ${stat.project_id}:`);
    console.log(`     Total documents: ${stat.total_docs}`);
    console.log(`     Unique survey+village+owner+land_area combinations: ${stat.unique_combinations_count}`);
    console.log(`     Duplicates: ${stat.duplicates}`);
  });

  // 9. Summary
  console.log('\n📋 SUMMARY:');
  console.log('===========');
  console.log(`Database total: ${totalDocs} documents`);
  console.log(`Active documents: ${activeDocs} documents`);
  console.log(`After survey+village+owner+land_area deduplication: ${uniqueAfterSurveyVillageOwnerDedup} documents`);
  console.log(`After survey+village+owner+project deduplication: ${uniqueAfterFullDedup} documents`);
  console.log(`Difference (DB vs App with survey+village+owner+land_area): ${totalDocs - uniqueAfterSurveyVillageOwnerDedup} documents`);

  console.log('\n🎯 UNIQUENESS CRITERIA IDENTIFIED (Survey + Village + Owner + Land Area):');
  console.log('============================================================');
  console.log('The application appears to use the following criteria for uniqueness:');
  console.log('1. Documents must have is_active: true');
  console.log('2. Uniqueness is determined by: new_survey_number + old_survey_number + village + owner_name + acquired_land_area combination');
  console.log('3. When duplicates exist, only one document per unique combination is shown');
  console.log('4. Project_id may or may not be part of the uniqueness constraint');
  

};

// Main execution
const main = async () => {
  await connectDB();
  await analyzeUniquenessCriteria();
  await mongoose.disconnect();
  console.log('\n✅ Analysis completed');
};

main().catch(console.error);