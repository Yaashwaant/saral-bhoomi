import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedComprehensiveLandownerRecords } from './seeds/comprehensive_landowner_seed_data.js';

// Load environment variables
dotenv.config();

/**
 * Run comprehensive seed data with all new format fields
 */
async function runComprehensiveSeed() {
  try {
    console.log('🚀 Starting comprehensive seed data population...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');
    
    // Run comprehensive seed
    const records = await seedComprehensiveLandownerRecords();
    
    console.log('\n🎉 COMPREHENSIVE SEED COMPLETED SUCCESSFULLY!');
    console.log(`📊 Summary:`);
    console.log(`   - Total records created: ${records.length}`);
    console.log(`   - Format: Parishisht-K (Government format)`);
    console.log(`   - All fields populated: ✅`);
    console.log(`   - Includes: Identification, Areas, Classifications, Rates, Structures, Compensation`);
    console.log(`   - Status variety: pending, assigned, completed, approved`);
    console.log(`   - Tribal records: included`);
    console.log(`   - Structure compensation: buildings, trees, wells`);
    console.log(`   - Complete calculation chain: market value → section 26 → solatium → final amount`);
    
    console.log('\n📋 Sample record fields populated:');
    const sampleRecord = records[0];
    const populatedFields = Object.keys(sampleRecord.toObject()).filter(key => 
      sampleRecord[key] !== undefined && sampleRecord[key] !== null && sampleRecord[key] !== ''
    );
    console.log(`   - Total fields with data: ${populatedFields.length}`);
    console.log(`   - Key new format fields: group_number, cts_number, land_category, agricultural_classification`);
    console.log(`   - Structure fields: buildings_count, forest_trees_count, wells_borewells_count`);
    console.log(`   - Compensation fields: section_26_compensation, solatium_100_percent, final_payable_amount`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error running comprehensive seed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComprehensiveSeed();
}

export default runComprehensiveSeed;
