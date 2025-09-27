/**
 * Ghol Village Seed Data - घोळ गाव डेटा
 * Complete seed data for Ghol village in both Parikshit 16 and Parishisht-K formats
 * This data represents typical land records for Ghol village
 */

import mongoose from 'mongoose';
import EnhancedJMRRecord from '../models/mongo/EnhancedJMRRecord.js';
import Project from '../models/mongo/Project.js';
import User from '../models/mongo/User.js';

const GHOL_VILLAGE_DATA = [
  {
    // PARISHSHT-K FORMAT - घोळ गाव पहिला रेकॉर्ड
    serial_number: "1",
    landowner_name: "रामचंद्र भिकू पाटील",
    father_husband_name: "भिकू रामचंद्र पाटील",
    
    // Survey Details
    old_survey_number: "245/1",
    new_survey_number: "245/1",
    group_number: "245/1/अ",
    cts_number: "142",
    
    // Area Information
    total_area_village_record: 0.85,
    acquired_area: 0.12,
    acquired_area_sqm_hectare: 0.12,
    area_hectares: 0.12,
    area_unit: 'hectare',
    
    // Land Classification
    land_category: "शेती",
    land_type_classification: "agricultural",
    agricultural_type: "शेती",
    agricultural_classification: "शेती/वर्ग -1",
    
    // Rate and Compensation
    approved_rate_per_hectare: 87500000,
    market_value_acquired_area: 10500000,
    section_26_2_factor: 1,
    section_26_compensation: 10500000,
    
    // Structure Compensation
    buildings_count: 2,
    buildings_amount: 125000,
    forest_trees_count: 8,
    forest_trees_amount: 24000,
    fruit_trees_count: 5,
    fruit_trees_amount: 18750,
    wells_borewells_count: 1,
    wells_borewells_amount: 45000,
    total_structures_amount: 212750,
    
    // Parikshit 16 Structure Fields
    trees_amount: 42750, // forest_trees_amount + fruit_trees_amount
    wells_amount: 45000,
    
    // Final Compensation
    total_compensation_amount: 10712750,
    solatium_100_percent: 1071275,
    determined_compensation: 11784025,
    additional_25_percent_compensation: 2946006,
    total_final_compensation: 14730031,
    deduction_amount: 0,
    final_payable_amount: 14730031,
    
    // Location
    village: "घोळ",
    village_name: "घोळ",
    taluka: "मुळशी",
    taluka_name: "मुळशी",
    district: "पुणे",
    district_name: "पुणे",
    
    // Contact Information
    contact_phone: "+919876543210",
    contact_email: "ram.patil@example.com",
    contact_address: "घोळ गाव, मुळशी तालुका, पुणे जिल्हा",
    
    // Banking Details
    bank_account_number: "1234567890123456",
    bank_ifsc_code: "SBIN0004567",
    bank_name: "State Bank of India",
    bank_branch_name: "मुळशी शाखा",
    bank_account_holder_name: "रामचंद्र भिकू पाटील",
    
    // Parikshit 16 Banking Fields
    bank_account_number: "1234567890123456",
    bank_ifsc_code: "SBIN0004567",
    
    // Tribal Information
    is_tribal: false,
    tribal_certificate_no: "",
    tribal_lag: "",
    
    // Measurement Details
    measurement_date: new Date('2024-01-15'),
    measured_by: "सर्वेक्षण विभाग",
    measurement_method: 'gps',
    
    // Status and Remarks
    status: 'draft',
    remarks: "घोळ गाव पहिला रेकॉर्ड - शेती जमीन संपादन",
    notes: "Ghol village first record - agricultural land acquisition",
    
    // Metadata
    data_format: "parishisht_k",
    source_file_name: "घोळ_गाव_परिशिष्ट_क.xlsx",
    import_batch_id: "GHOL_BATCH_2024_001"
  },
  {
    // PARISHSHT-K FORMAT - घोळ गाव दुसरा रेकॉर्ड
    serial_number: "2",
    landowner_name: "सविता दत्तात्रेय काळे",
    father_husband_name: "दत्तात्रेय काळे",
    
    // Survey Details
    old_survey_number: "246/2",
    new_survey_number: "246/2",
    group_number: "246/2/ब",
    cts_number: "143",
    
    // Area Information
    total_area_village_record: 1.25,
    acquired_area: 0.18,
    acquired_area_sqm_hectare: 0.18,
    area_hectares: 0.18,
    area_unit: 'hectare',
    
    // Land Classification
    land_category: "शेती",
    land_type_classification: "agricultural",
    agricultural_type: "शेती",
    agricultural_classification: "शेती/वर्ग -1",
    
    // Rate and Compensation
    approved_rate_per_hectare: 87500000,
    market_value_acquired_area: 15750000,
    section_26_2_factor: 1,
    section_26_compensation: 15750000,
    
    // Structure Compensation
    buildings_count: 1,
    buildings_amount: 85000,
    forest_trees_count: 12,
    forest_trees_amount: 36000,
    fruit_trees_count: 8,
    fruit_trees_amount: 30000,
    wells_borewells_count: 2,
    wells_borewells_amount: 75000,
    total_structures_amount: 226000,
    
    // Parikshit 16 Structure Fields
    trees_amount: 66000, // forest_trees_amount + fruit_trees_amount
    wells_amount: 75000,
    
    // Final Compensation
    total_compensation_amount: 15976000,
    solatium_100_percent: 1597600,
    determined_compensation: 17573600,
    additional_25_percent_compensation: 4393400,
    total_final_compensation: 21967000,
    deduction_amount: 0,
    final_payable_amount: 21967000,
    
    // Location
    village: "घोळ",
    village_name: "घोळ",
    taluka: "मुळशी",
    taluka_name: "मुळशी",
    district: "पुणे",
    district_name: "पुणे",
    
    // Contact Information
    contact_phone: "+919876543211",
    contact_email: "savita.kale@example.com",
    contact_address: "घोळ गाव, मुळशी तालुका, पुणे जिल्हा",
    
    // Banking Details
    bank_account_number: "1234567890123457",
    bank_ifsc_code: "SBIN0004567",
    bank_name: "State Bank of India",
    bank_branch_name: "मुळशी शाखा",
    bank_account_holder_name: "सविता दत्तात्रेय काळे",
    
    // Parikshit 16 Banking Fields
    bank_account_number: "1234567890123457",
    bank_ifsc_code: "SBIN0004567",
    
    // Tribal Information
    is_tribal: false,
    tribal_certificate_no: "",
    tribal_lag: "",
    
    // Measurement Details
    measurement_date: new Date('2024-01-16'),
    measured_by: "सर्वेक्षण विभाग",
    measurement_method: 'gps',
    
    // Status and Remarks
    status: 'draft',
    remarks: "घोळ गाव दुसरा रेकॉर्ड - शेती जमीन संपादन",
    notes: "Ghol village second record - agricultural land acquisition",
    
    // Metadata
    data_format: "parishisht_k",
    source_file_name: "घोळ_गाव_परिशिष्ट_क.xlsx",
    import_batch_id: "GHOL_BATCH_2024_001"
  },
  {
    // PARIKSHIT 16 FORMAT - घोळ गाव तिसरा रेकॉर्ड
    serial_number: "3",
    landowner_name: "अनिल शिवाजी ढोरे",
    
    // Survey Details (Parikshit 16 simplified)
    survey_number: "247/3",
    old_survey_number: "247/3",
    new_survey_number: "247/3",
    
    // Area Information (Parikshit 16 format)
    area_hectares: 0.25,
    area: 0.25,
    acquired_area: 0.25,
    acquired_area_sqm_hectare: 0.25,
    total_area_village_record: 0.25,
    
    // Land Classification
    land_type: "शेती",
    land_category: "शेती",
    land_type_classification: "agricultural",
    
    // Rate and Compensation (Parikshit 16 format)
    approved_rate_per_hectare: 87500000,
    rate: 87500000,
    market_value: 21875000, // Parikshit 16 simplified
    market_value_acquired_area: 21875000,
    section_26_compensation: 21875000,
    
    // Structure Compensation (Parikshit 16 direct amounts)
    buildings_amount: 150000,
    trees_amount: 45000,
    wells_amount: 60000,
    total_structures_amount: 255000,
    
    // Compensation Calculations
    total_compensation: 22130000,
    total_compensation_amount: 22130000,
    solatium_100_percent: 2213000,
    solatium: 2213000,
    determined_compensation: 24343000,
    additional_25_percent_compensation: 6085750,
    total_final_compensation: 30428750,
    final_amount: 30428750,
    final_payable_amount: 30428750,
    
    // Location
    village: "घोळ",
    village_name: "घोळ",
    taluka: "मुळशी",
    taluka_name: "मुळशी",
    district: "पुणे",
    district_name: "पुणे",
    
    // Contact Information
    contact_phone: "+919876543212",
    contact_email: "anil.dhore@example.com",
    contact_address: "घोळ गाव, मुळशी तालुका, पुणे जिल्हा",
    
    // Banking Details (Parikshit 16 format)
    bank_account_number: "1234567890123458",
    bank_ifsc_code: "SBIN0004567",
    
    // Tribal Information
    is_tribal: false,
    tribal_certificate_no: "",
    tribal_lag: "",
    
    // Measurement Details
    measurement_date: new Date('2024-01-17'),
    measured_by: "सर्वेक्षण विभाग",
    measurement_method: 'gps',
    
    // Status and Remarks
    status: 'draft',
    remarks: "घोळ गाव तिसरा रेकॉर्ड - परिक्षित 16 स्वरूप",
    notes: "Ghol village third record - Parikshit 16 format",
    
    // Metadata
    data_format: "parikshit-16",
    source_file_name: "घोळ_गाव_परिक्षित_16.xlsx",
    import_batch_id: "GHOL_BATCH_2024_001"
  },
  {
    // PARIKSHIT 16 FORMAT - घोळ गाव चौथा रेकॉर्ड (आदिवासी लाभार्थी)
    serial_number: "4",
    landowner_name: "सुनिता बाळू वाघ",
    father_husband_name: "बाळू वाघ",
    
    // Survey Details (Parikshit 16 simplified)
    survey_number: "248/4",
    old_survey_number: "248/4",
    new_survey_number: "248/4",
    
    // Area Information (Parikshit 16 format)
    area_hectares: 0.32,
    area: 0.32,
    acquired_area: 0.32,
    acquired_area_sqm_hectare: 0.32,
    total_area_village_record: 0.32,
    
    // Land Classification
    land_type: "शेती",
    land_category: "शेती",
    land_type_classification: "agricultural",
    
    // Rate and Compensation (Parikshit 16 format)
    approved_rate_per_hectare: 87500000,
    rate: 87500000,
    market_value: 28000000, // Parikshit 16 simplified
    market_value_acquired_area: 28000000,
    section_26_compensation: 28000000,
    
    // Structure Compensation (Parikshit 16 direct amounts)
    buildings_amount: 95000,
    trees_amount: 35000,
    wells_amount: 45000,
    total_structures_amount: 175000,
    
    // Compensation Calculations
    total_compensation: 28175000,
    total_compensation_amount: 28175000,
    solatium_100_percent: 2817500,
    solatium: 2817500,
    determined_compensation: 30992500,
    additional_25_percent_compensation: 7748125,
    total_final_compensation: 38740625,
    final_amount: 38740625,
    final_payable_amount: 38740625,
    
    // Location
    village: "घोळ",
    village_name: "घोळ",
    taluka: "मुळशी",
    taluka_name: "मुळशी",
    district: "पुणे",
    district_name: "पुणे",
    
    // Contact Information
    contact_phone: "+919876543213",
    contact_email: "sunita.wagh@example.com",
    contact_address: "घोळ गाव, मुळशी तालुका, पुणे जिल्हा",
    
    // Banking Details (Parikshit 16 format)
    bank_account_number: "1234567890123459",
    bank_ifsc_code: "SBIN0004567",
    
    // Tribal Information (आदिवासी लाभार्थी)
    is_tribal: true,
    tribal_certificate_no: "TRIBAL/GHOL/2024/001",
    tribal_lag: "हो",
    
    // Measurement Details
    measurement_date: new Date('2024-01-18'),
    measured_by: "सर्वेक्षण विभाग",
    measurement_method: 'gps',
    
    // Status and Remarks
    status: 'draft',
    remarks: "घोळ गाव चौथा रेकॉर्ड - आदिवासी लाभार्थी",
    notes: "Ghol village fourth record - tribal beneficiary",
    
    // Metadata
    data_format: "parikshit-16",
    source_file_name: "घोळ_गाव_परिक्षित_16.xlsx",
    import_batch_id: "GHOL_BATCH_2024_001"
  }
];

/**
 * Seed Ghol village data into the database
 */
async function seedGholVillageData() {
  try {
    console.log('🌱 Starting Ghol village data seeding...');
    console.log('📍 Location: घोळ गाव, मुळशी तालुका, पुणे जिल्हा');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saral-bhoomi', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Get default officer first
    const officer = await User.findOne({ role: 'officer' }) || 
                   await User.findOne() ||
                   await User.create({
                     name: 'घोळ गाव अधिकारी',
                     email: 'ghol.officer@example.com',
                     role: 'officer',
                     password: 'temp123'
                   });
    
    // Get default project and officer
    let project = await Project.findOne({ projectName: /demo/i }) || 
                  await Project.findOne({ projectName: 'घोळ गाव प्रकल्प' });
    
    if (!project) {
      project = await Project.create({
        projectName: 'घोळ गाव प्रकल्प',
        projectNumber: 'GHOL-2024-001',
        schemeName: 'घोळ गाव जमीन संपादन',
        district: 'Pune',
        taluka: 'Mulshi',
        villages: ['घोळ'],
        landRequired: 100.00,
        landAvailable: 80.00,
        landToBeAcquired: 20.00,
        type: 'greenfield',
        estimatedCost: 5000000.00,
        allocatedBudget: 4500000.00,
        startDate: new Date('2024-01-01'),
        expectedCompletion: new Date('2024-12-31'),
        description: 'घोळ गाव जमीन संपादन प्रकल्प',
        createdBy: officer.id
      });
    }
    
    console.log(`✅ Found project: ${project.projectName}`);
    console.log(`✅ Found officer: ${officer.name}`);
    
    // Prepare records with project and officer references
    const recordsToInsert = GHOL_VILLAGE_DATA.map(record => ({
      ...record,
      project_id: project._id,
      officer_id: officer._id,
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    // Clear existing Ghol village data
    const deleteResult = await EnhancedJMRRecord.deleteMany({ 
      village: 'घोळ',
      village_name: 'घोळ'
    });
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing Ghol village records`);
    
    // Insert new Ghol village data
    const insertResult = await EnhancedJMRRecord.insertMany(recordsToInsert);
    console.log(`✅ Successfully seeded ${insertResult.length} Ghol village records`);
    
    // Display summary
    const parikshit16Count = insertResult.filter(r => r.data_format === 'parikshit-16').length;
    const parishishtKCount = insertResult.filter(r => r.data_format === 'parishisht_k').length;
    
    console.log('\n📊 Ghol Village Data Summary:');
    console.log(`   • Total records: ${insertResult.length}`);
    console.log(`   • Parikshit 16 format: ${parikshit16Count}`);
    console.log(`   • Parishisht-K format: ${parishishtKCount}`);
    console.log(`   • Village: घोळ (Ghol)`);
    console.log(`   • Taluka: मुळशी (Mulshi)`);
    console.log(`   • District: पुणे (Pune)`);
    console.log(`   • Total compensation: ₹${insertResult.reduce((sum, r) => sum + r.final_payable_amount, 0).toLocaleString('hi-IN')}`);
    
    return insertResult;
    
  } catch (error) {
    console.error('❌ Error seeding Ghol village data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
}

/**
 * Export for use in other scripts
 */
export { GHOL_VILLAGE_DATA, seedGholVillageData };

/**
 * Run seeding if this file is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  seedGholVillageData()
    .then(() => {
      console.log('\n🎉 Ghol village data seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Ghol village data seeding failed:', error);
      process.exit(1);
    });
}