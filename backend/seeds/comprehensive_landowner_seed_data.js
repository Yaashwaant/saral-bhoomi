import mongoose from 'mongoose';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';

/**
 * Comprehensive seed data with ALL new format fields populated
 * This demonstrates the complete Parishisht-K format structure
 */

const COMPREHENSIVE_LANDOWNER_RECORDS = [
  {
    // BASIC IDENTIFICATION FIELDS
    serial_number: "1",
    survey_number: "67",
    landowner_name: "जनार्दन लक्ष्मण म्हात्रे",
    
    // NEW FORMAT IDENTIFICATION FIELDS
    old_survey_number: "357",
    new_survey_number: "67",
    group_number: "67/4/अ",
    cts_number: "232",
    
    // AREA FIELDS
    area: 0.131,
    acquired_area: 0.0022,
    total_area_village_record: 0.131,
    acquired_area_sqm_hectare: 0.0022,
    
    // LAND CLASSIFICATION FIELDS
    land_category: "शेती",
    land_type_classification: "शेती/वर्ग -1",
    agricultural_type: "शेती",
    agricultural_classification: "शेती/वर्ग -1",
    
    // RATE AND MARKET VALUE FIELDS
    rate: 98600000,
    approved_rate_per_hectare: 98600000,
    market_value_acquired_area: 216920,
    
    // SECTION 26 CALCULATION FIELDS
    section_26_2_factor: 1,
    section_26_compensation: 216920,
    
    // STRUCTURE COMPENSATION FIELDS
    structure_trees_wells_amount: 0,
    buildings_count: 0,
    buildings_amount: 0,
    forest_trees_count: 0,
    forest_trees_amount: 0,
    fruit_trees_count: 0,
    fruit_trees_amount: 0,
    wells_borewells_count: 0,
    wells_borewells_amount: 0,
    total_structures_amount: 0,
    
    // COMPENSATION CALCULATION FIELDS
    total_compensation: 216920,
    total_compensation_amount: 216920,
    solatium: 21692,
    solatium_100_percent: 21692,
    determined_compensation: 238612,
    additional_25_percent_compensation: 59653,
    total_final_compensation: 298265,
    deduction_amount: 0,
    final_amount: 298265,
    final_payable_amount: 298265,
    
    // LOCATION FIELDS
    village: "चंद्रपाडा",
    taluka: "वसई",
    district: "पालघर",
    
    // CONTACT FIELDS
    contact_phone: "+919876543210",
    contact_email: "janardhan.mhatre@example.com",
    contact_address: "चंद्रपाडा, वसई, पालघर",
    
    // TRIBAL FIELDS
    is_tribal: false,
    tribal_certificate_no: "",
    tribal_lag: "",
    
    // BANKING FIELDS
    bank_account_number: "123456789012",
    bank_ifsc_code: "SBIN0001234",
    bank_name: "State Bank of India",
    bank_branch_name: "Vasai Branch",
    bank_account_holder_name: "जनार्दन लक्ष्मण म्हात्रे",
    
    // STATUS FIELDS
    kyc_status: "pending",
    payment_status: "pending",
    notice_generated: false,
    assigned_agent: "",
    
    // ADDITIONAL FIELDS
    notes: "Sample record with complete Parishisht-K data",
    remarks: "प्रथम नमुना रेकॉर्ड",
    
    // METADATA FIELDS
    data_format: "parishisht_k",
    source_file_name: "Chandrapada_Parishisht_K_Sample.xlsx",
    import_batch_id: "BATCH_2024_001"
  },
  {
    // BASIC IDENTIFICATION FIELDS
    serial_number: "2",
    survey_number: "67",
    landowner_name: "देवयानी दयानंद म्हात्रे",
    
    // NEW FORMAT IDENTIFICATION FIELDS
    old_survey_number: "357",
    new_survey_number: "67",
    group_number: "67/3/ब",
    cts_number: "238",
    
    // AREA FIELDS
    area: 0.045,
    acquired_area: 0.0051,
    total_area_village_record: 0.045,
    acquired_area_sqm_hectare: 0.0051,
    
    // LAND CLASSIFICATION FIELDS
    land_category: "शेती",
    land_type_classification: "शेती/वर्ग -1",
    agricultural_type: "शेती",
    agricultural_classification: "शेती/वर्ग -1",
    
    // RATE AND MARKET VALUE FIELDS
    rate: 98600000,
    approved_rate_per_hectare: 98600000,
    market_value_acquired_area: 502860,
    
    // SECTION 26 CALCULATION FIELDS
    section_26_2_factor: 1,
    section_26_compensation: 502860,
    
    // STRUCTURE COMPENSATION FIELDS
    structure_trees_wells_amount: 25143,
    buildings_count: 0,
    buildings_amount: 0,
    forest_trees_count: 5,
    forest_trees_amount: 12500,
    fruit_trees_count: 3,
    fruit_trees_amount: 7500,
    wells_borewells_count: 1,
    wells_borewells_amount: 5143,
    total_structures_amount: 25143,
    
    // COMPENSATION CALCULATION FIELDS
    total_compensation: 528003,
    total_compensation_amount: 528003,
    solatium: 52800,
    solatium_100_percent: 52800,
    determined_compensation: 580803,
    additional_25_percent_compensation: 145201,
    total_final_compensation: 726004,
    deduction_amount: 0,
    final_amount: 726004,
    final_payable_amount: 726004,
    
    // LOCATION FIELDS
    village: "चंद्रपाडा",
    taluka: "वसई",
    district: "पालघर",
    
    // CONTACT FIELDS
    contact_phone: "+919876543211",
    contact_email: "devyani.mhatre@example.com",
    contact_address: "चंद्रपाडा, वसई, पालघर",
    
    // TRIBAL FIELDS
    is_tribal: false,
    tribal_certificate_no: "",
    tribal_lag: "",
    
    // BANKING FIELDS
    bank_account_number: "123456789013",
    bank_ifsc_code: "SBIN0001234",
    bank_name: "State Bank of India",
    bank_branch_name: "Vasai Branch",
    bank_account_holder_name: "देवयानी दयानंद म्हात्रे",
    
    // STATUS FIELDS
    kyc_status: "assigned",
    payment_status: "pending",
    notice_generated: true,
    assigned_agent: "Agent_001",
    
    // ADDITIONAL FIELDS
    notes: "Record with structure compensation",
    remarks: "संरचना भरपाईसह रेकॉर्ड",
    
    // METADATA FIELDS
    data_format: "parishisht_k",
    source_file_name: "Chandrapada_Parishisht_K_Sample.xlsx",
    import_batch_id: "BATCH_2024_001"
  },
  {
    // BASIC IDENTIFICATION FIELDS
    serial_number: "3",
    survey_number: "68",
    landowner_name: "विदयाधर रामकृष्ण पाटील",
    
    // NEW FORMAT IDENTIFICATION FIELDS
    old_survey_number: "357",
    new_survey_number: "68",
    group_number: "68/2",
    cts_number: "339",
    
    // AREA FIELDS
    area: 0.215,
    acquired_area: 0.0026,
    total_area_village_record: 0.215,
    acquired_area_sqm_hectare: 0.0026,
    
    // LAND CLASSIFICATION FIELDS
    land_category: "शेती",
    land_type_classification: "शेती/वर्ग -2",
    agricultural_type: "शेती",
    agricultural_classification: "शेती/वर्ग -2",
    
    // RATE AND MARKET VALUE FIELDS
    rate: 98600000,
    approved_rate_per_hectare: 98600000,
    market_value_acquired_area: 256360,
    
    // SECTION 26 CALCULATION FIELDS
    section_26_2_factor: 1.2,
    section_26_compensation: 307632,
    
    // STRUCTURE COMPENSATION FIELDS
    structure_trees_wells_amount: 45000,
    buildings_count: 2,
    buildings_amount: 25000,
    forest_trees_count: 8,
    forest_trees_amount: 15000,
    fruit_trees_count: 0,
    fruit_trees_amount: 0,
    wells_borewells_count: 1,
    wells_borewells_amount: 5000,
    total_structures_amount: 45000,
    
    // COMPENSATION CALCULATION FIELDS
    total_compensation: 352632,
    total_compensation_amount: 352632,
    solatium: 35263,
    solatium_100_percent: 35263,
    determined_compensation: 387895,
    additional_25_percent_compensation: 96974,
    total_final_compensation: 484869,
    deduction_amount: 5000,
    final_amount: 479869,
    final_payable_amount: 479869,
    
    // LOCATION FIELDS
    village: "चंद्रपाडा",
    taluka: "वसई",
    district: "पालघर",
    
    // CONTACT FIELDS
    contact_phone: "+919876543212",
    contact_email: "vidyadhar.patil@example.com",
    contact_address: "चंद्रपाडा, वसई, पालघर",
    
    // TRIBAL FIELDS
    is_tribal: true,
    tribal_certificate_no: "TC001",
    tribal_lag: "LAG001",
    
    // BANKING FIELDS
    bank_account_number: "123456789014",
    bank_ifsc_code: "HDFC0001234",
    bank_name: "HDFC Bank",
    bank_branch_name: "Vasai Branch",
    bank_account_holder_name: "विदयाधर रामकृष्ण पाटील",
    
    // STATUS FIELDS
    kyc_status: "completed",
    payment_status: "initiated",
    notice_generated: true,
    assigned_agent: "Agent_002",
    
    // ADDITIONAL FIELDS
    notes: "Tribal landowner with multiple structures",
    remarks: "आदिवासी भूमालक - अनेक संरचना",
    
    // METADATA FIELDS
    data_format: "parishisht_k",
    source_file_name: "Chandrapada_Parishisht_K_Sample.xlsx",
    import_batch_id: "BATCH_2024_001"
  },
  {
    // BASIC IDENTIFICATION FIELDS
    serial_number: "4",
    survey_number: "69",
    landowner_name: "सुनीता देवी शर्मा",
    
    // NEW FORMAT IDENTIFICATION FIELDS
    old_survey_number: "358",
    new_survey_number: "69",
    group_number: "69/1",
    cts_number: "241",
    
    // AREA FIELDS
    area: 0.18,
    acquired_area: 0.0089,
    total_area_village_record: 0.18,
    acquired_area_sqm_hectare: 0.0089,
    
    // LAND CLASSIFICATION FIELDS
    land_category: "शेती",
    land_type_classification: "शेती/वर्ग -1",
    agricultural_type: "शेती",
    agricultural_classification: "शेती/वर्ग -1",
    
    // RATE AND MARKET VALUE FIELDS
    rate: 98600000,
    approved_rate_per_hectare: 98600000,
    market_value_acquired_area: 877540,
    
    // SECTION 26 CALCULATION FIELDS
    section_26_2_factor: 1,
    section_26_compensation: 877540,
    
    // STRUCTURE COMPENSATION FIELDS
    structure_trees_wells_amount: 12500,
    buildings_count: 1,
    buildings_amount: 10000,
    forest_trees_count: 0,
    forest_trees_amount: 0,
    fruit_trees_count: 10,
    fruit_trees_amount: 2500,
    wells_borewells_count: 0,
    wells_borewells_amount: 0,
    total_structures_amount: 12500,
    
    // COMPENSATION CALCULATION FIELDS
    total_compensation: 890040,
    total_compensation_amount: 890040,
    solatium: 89004,
    solatium_100_percent: 89004,
    determined_compensation: 979044,
    additional_25_percent_compensation: 244761,
    total_final_compensation: 1223805,
    deduction_amount: 0,
    final_amount: 1223805,
    final_payable_amount: 1223805,
    
    // LOCATION FIELDS
    village: "चंद्रपाडा",
    taluka: "वसई",
    district: "पालघर",
    
    // CONTACT FIELDS
    contact_phone: "+919876543213",
    contact_email: "sunita.sharma@example.com",
    contact_address: "चंद्रपाडा, वसई, पालघर",
    
    // TRIBAL FIELDS
    is_tribal: false,
    tribal_certificate_no: "",
    tribal_lag: "",
    
    // BANKING FIELDS
    bank_account_number: "123456789015",
    bank_ifsc_code: "ICICI001234",
    bank_name: "ICICI Bank",
    bank_branch_name: "Vasai Branch",
    bank_account_holder_name: "सुनीता देवी शर्मा",
    
    // STATUS FIELDS
    kyc_status: "approved",
    payment_status: "completed",
    notice_generated: true,
    assigned_agent: "Agent_001",
    
    // ADDITIONAL FIELDS
    notes: "Completed payment - fruit trees compensation",
    remarks: "पूर्ण पेमेंट - फळबागेची भरपाई",
    
    // METADATA FIELDS
    data_format: "parishisht_k",
    source_file_name: "Chandrapada_Parishisht_K_Sample.xlsx",
    import_batch_id: "BATCH_2024_001"
  },
  {
    // BASIC IDENTIFICATION FIELDS
    serial_number: "5",
    survey_number: "70",
    landowner_name: "राम कृष्ण पाटील",
    
    // NEW FORMAT IDENTIFICATION FIELDS
    old_survey_number: "359",
    new_survey_number: "70",
    group_number: "70/2",
    cts_number: "242",
    
    // AREA FIELDS
    area: 0.25,
    acquired_area: 0.0095,
    total_area_village_record: 0.25,
    acquired_area_sqm_hectare: 0.0095,
    
    // LAND CLASSIFICATION FIELDS
    land_category: "शेती",
    land_type_classification: "शेती/वर्ग -1",
    agricultural_type: "शेती",
    agricultural_classification: "शेती/वर्ग -1",
    
    // RATE AND MARKET VALUE FIELDS
    rate: 98600000,
    approved_rate_per_hectare: 98600000,
    market_value_acquired_area: 936700,
    
    // SECTION 26 CALCULATION FIELDS
    section_26_2_factor: 1,
    section_26_compensation: 936700,
    
    // STRUCTURE COMPENSATION FIELDS
    structure_trees_wells_amount: 75000,
    buildings_count: 3,
    buildings_amount: 50000,
    forest_trees_count: 12,
    forest_trees_amount: 20000,
    fruit_trees_count: 0,
    fruit_trees_amount: 0,
    wells_borewells_count: 1,
    wells_borewells_amount: 5000,
    total_structures_amount: 75000,
    
    // COMPENSATION CALCULATION FIELDS
    total_compensation: 1011700,
    total_compensation_amount: 1011700,
    solatium: 101170,
    solatium_100_percent: 101170,
    determined_compensation: 1112870,
    additional_25_percent_compensation: 278218,
    total_final_compensation: 1391088,
    deduction_amount: 10000,
    final_amount: 1381088,
    final_payable_amount: 1381088,
    
    // LOCATION FIELDS
    village: "चंद्रपाडा",
    taluka: "वसई",
    district: "पालघर",
    
    // CONTACT FIELDS
    contact_phone: "+919876543214",
    contact_email: "ram.patil@example.com",
    contact_address: "चंद्रपाडा, वसई, पालघर",
    
    // TRIBAL FIELDS
    is_tribal: false,
    tribal_certificate_no: "",
    tribal_lag: "",
    
    // BANKING FIELDS
    bank_account_number: "123456789016",
    bank_ifsc_code: "AXIS001234",
    bank_name: "Axis Bank",
    bank_branch_name: "Vasai Branch",
    bank_account_holder_name: "राम कृष्ण पाटील",
    
    // STATUS FIELDS
    kyc_status: "in_progress",
    payment_status: "pending",
    notice_generated: true,
    assigned_agent: "Agent_003",
    
    // ADDITIONAL FIELDS
    notes: "Large landowner with significant structures",
    remarks: "मोठे भूमालक - महत्वपूर्ण संरचना",
    
    // METADATA FIELDS
    data_format: "parishisht_k",
    source_file_name: "Chandrapada_Parishisht_K_Sample.xlsx",
    import_batch_id: "BATCH_2024_001"
  }
];

/**
 * Seed function to populate comprehensive landowner records
 */
export async function seedComprehensiveLandownerRecords() {
  try {
    console.log('🌱 Seeding comprehensive landowner records...');
    
    // Find or create a project for seeding
    let project = await MongoProject.findOne({ name: 'Chandrapada Land Acquisition' });
    if (!project) {
      project = await MongoProject.create({
        name: 'Chandrapada Land Acquisition',
        description: 'Western Dedicated Freight Corridor - Chandrapada Section',
        location: 'चंद्रपाडा, वसई, पालघर',
        status: 'active',
        created_by: new mongoose.Types.ObjectId(), // Demo user
        start_date: new Date(),
        budget: 50000000
      });
    }
    
    // Clear existing records for this project
    await MongoLandownerRecord.deleteMany({ project_id: project._id });
    
    // Add project_id to all records
    const recordsWithProjectId = COMPREHENSIVE_LANDOWNER_RECORDS.map(record => ({
      ...record,
      project_id: project._id
    }));
    
    // Insert comprehensive records
    const insertedRecords = await MongoLandownerRecord.insertMany(recordsWithProjectId);
    
    console.log(`✅ Successfully seeded ${insertedRecords.length} comprehensive landowner records`);
    console.log(`📊 Records include ALL new format fields:`);
    console.log(`   - Identification: serial_number, old/new survey numbers, group, CTS`);
    console.log(`   - Areas: village record area, acquired area in different units`);
    console.log(`   - Land Classification: category, type, agricultural classification`);
    console.log(`   - Rates: approved rate per hectare, market value`);
    console.log(`   - Section 26: factor, compensation calculations`);
    console.log(`   - Structures: buildings, trees, wells with counts and amounts`);
    console.log(`   - Compensation: complete calculation chain with solatium, deductions`);
    console.log(`   - Metadata: data format, source file, import batch tracking`);
    
    return insertedRecords;
    
  } catch (error) {
    console.error('❌ Error seeding comprehensive landowner records:', error);
    throw error;
  }
}

export default seedComprehensiveLandownerRecords;
