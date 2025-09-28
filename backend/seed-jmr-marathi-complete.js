import mongoose from 'mongoose';
import { connectMongoDBAtlas } from './config/database.js';
import JMRRecord from './models/mongo/JMRRecord.js';

// Sample project and officer IDs
const PROJECT_ID = new mongoose.Types.ObjectId();
const OFFICER_ID = new mongoose.Types.ObjectId();

// Complete Marathi JMR data with all fields
const marathiJMRData = [
  {
    // अ.क्र (Serial Number)
    survey_number: "१२३/अ",
    owner_name: "राजेंद्र पोपटराव पाटील",
    old_survey_number: "१२३",
    new_survey_number: "१२३/अ",
    group_number: "१",
    
    // Basic fields
    total_area_village_record: 2.5,
    acquired_area: 1.2,
    village: "शिवाजीनगर",
    taluka: "हवेली", 
    district: "पुणे",
    
    // Land classification
    land_type_classification: "agricultural",
    land_type: "agricultural",
    tribal_classification: "non-tribal",
    category: "general",
    
    // Compensation details
    approved_rate_per_hectare: 2500000,
    market_value_acquired_area: 3000000,
    section_26_compensation: 750000,
    
    // Structure details (बांधकाम)
    structure_details: [
      {
        type: "इमारत",
        description: "सिमेंट कॉन्क्रिट इमारत",
        area: 150,
        value: 500000
      },
      {
        type: "शेड",
        description: "लोखंड शेड",
        area: 80,
        value: 120000
      }
    ],
    
    // Tree details (झाडे)
    tree_details: [
      {
        type: "आंबा",
        count: 15,
        age: 10,
        value: 45000
      },
      {
        type: "चिकू",
        count: 8,
        age: 8,
        value: 24000
      },
      {
        type: "पेरू",
        count: 12,
        age: 6,
        value: 18000
      }
    ],
    
    // Well details (विहीर/कंपनीका)
    well_details: [
      {
        depth: 150,
        diameter: 6,
        construction_type: "सिमेंट रिंग",
        value: 180000
      }
    ],
    
    // Total values
    total_structure_value: 620000,
    total_tree_value: 87000,
    total_well_value: 180000,
    
    // Status and metadata
    status: "approved",
    remarks: "भुमापन पूर्ण झाले आहे. सर्व तपशील वैध आहेत.",
    
    // IDs
    project_id: PROJECT_ID,
    officer_id: OFFICER_ID,
    measurement_date: new Date("2024-01-15"),
    approved_by: OFFICER_ID,
    approved_at: new Date("2024-01-20"),
    
    // Documents
    documents: [
      {
        name: "७/१२ उतारा",
        url: "/documents/712-extract.pdf",
        type: "land_record",
        uploaded_at: new Date("2024-01-10")
      },
      {
        name: "मोजणी अहवाल",
        url: "/documents/survey-report.pdf", 
        type: "survey_report",
        uploaded_at: new Date("2024-01-15")
      }
    ],
    
    is_active: true
  },
  
  {
    // Second record with different details
    survey_number: "२३४/ब",
    owner_name: "सुनिता रामचंद्र शिंदे",
    old_survey_number: "२३४", 
    new_survey_number: "२३४/ब",
    group_number: "२",
    
    total_area_village_record: 3.8,
    acquired_area: 2.1,
    village: "किरकटवाडी",
    taluka: "मुळशी",
    district: "पुणे",
    
    land_type_classification: "agricultural",
    land_type: "agricultural", 
    tribal_classification: "non-tribal",
    category: "sc",
    
    approved_rate_per_hectare: 2800000,
    market_value_acquired_area: 5880000,
    section_26_compensation: 1470000,
    
    structure_details: [
      {
        type: "घर",
        description: "मातीचे घर",
        area: 120,
        value: 350000
      }
    ],
    
    tree_details: [
      {
        type: "नींब",
        count: 6,
        age: 12,
        value: 18000
      },
      {
        type: "पपई",
        count: 20,
        age: 4,
        value: 25000
      }
    ],
    
    well_details: [
      {
        depth: 120,
        diameter: 5,
        construction_type: "सिमेंट रिंग",
        value: 150000
      }
    ],
    
    total_structure_value: 350000,
    total_tree_value: 43000,
    total_well_value: 150000,
    
    status: "submitted",
    remarks: "मोजणी प्रलंबित आहे.",
    
    project_id: PROJECT_ID,
    officer_id: OFFICER_ID,
    measurement_date: new Date("2024-02-01"),
    
    documents: [
      {
        name: "७/१२ उतारा",
        url: "/documents/712-extract-2.pdf",
        type: "land_record",
        uploaded_at: new Date("2024-01-25")
      }
    ],
    
    is_active: true
  },
  
  {
    // Third record
    survey_number: "४५६/क",
    owner_name: "गणेश दगडू भोसले",
    old_survey_number: "४५६",
    new_survey_number: "४५६/क", 
    group_number: "३",
    
    total_area_village_record: 1.5,
    acquired_area: 0.8,
    village: "लोणीकंद",
    taluka: "हवेली",
    district: "पुणे",
    
    land_type_classification: "agricultural",
    land_type: "agricultural",
    tribal_classification: "non-tribal", 
    category: "obc",
    
    approved_rate_per_hectare: 2600000,
    market_value_acquired_area: 2080000,
    section_26_compensation: 520000,
    
    structure_details: [
      {
        type: "शेड",
        description: "सिमेंट शेड",
        area: 60,
        value: 95000
      }
    ],
    
    tree_details: [
      {
        type: "केळ",
        count: 25,
        age: 3,
        value: 30000
      }
    ],
    
    well_details: [],
    
    total_structure_value: 95000,
    total_tree_value: 30000,
    total_well_value: 0,
    
    status: "approved",
    remarks: "भुमापन पूर्ण",
    
    project_id: PROJECT_ID,
    officer_id: OFFICER_ID,
    measurement_date: new Date("2024-01-28"),
    approved_by: OFFICER_ID,
    approved_at: new Date("2024-02-05"),
    
    documents: [],
    is_active: true
  },
  
  {
    // Fourth record
    survey_number: "५६७/ड",
    owner_name: "संगीता बाळासाहे�ब देशमुख",
    old_survey_number: "५६७",
    new_survey_number: "५६७/ड",
    group_number: "४",
    
    total_area_village_record: 4.2,
    acquired_area: 3.0,
    village: "पिंपळे सौदागर",
    taluka: "चाकण", 
    district: "पुणे",
    
    land_type_classification: "agricultural",
    land_type: "agricultural",
    tribal_classification: "non-tribal",
    category: "general",
    
    approved_rate_per_hectare: 2700000,
    market_value_acquired_area: 8100000,
    section_26_compensation: 2025000,
    
    structure_details: [
      {
        type: "इमारत",
        description: "दुमजली इमारत",
        area: 200,
        value: 800000
      },
      {
        type: "गोडाउन",
        description: "सिमेंट गोडाउन",
        area: 150,
        value: 250000
      }
    ],
    
    tree_details: [
      {
        type: "सीताफळ",
        count: 10,
        age: 7,
        value: 35000
      }
    ],
    
    well_details: [
      {
        depth: 180,
        diameter: 7,
        construction_type: "सिमेंट रिंग",
        value: 220000
      }
    ],
    
    total_structure_value: 1050000,
    total_tree_value: 35000,
    total_well_value: 220000,
    
    status: "submitted",
    remarks: "तपासणी प्रलंबित",
    
    project_id: PROJECT_ID,
    officer_id: OFFICER_ID,
    measurement_date: new Date("2024-02-10"),
    
    documents: [
      {
        name: "७/१२ उतारा",
        url: "/documents/712-extract-4.pdf",
        type: "land_record", 
        uploaded_at: new Date("2024-02-08")
      },
      {
        name: "मोजणी अहवाल",
        url: "/documents/survey-report-4.pdf",
        type: "survey_report",
        uploaded_at: new Date("2024-02-10")
      }
    ],
    
    is_active: true
  }
];

const seedMarathiJMRData = async () => {
  try {
    console.log('🌱 Starting comprehensive Marathi JMR data seeding...');
    
    // Connect to MongoDB
    await connectMongoDBAtlas();
    console.log('✅ MongoDB connected successfully');
    
    // Clear existing records
    await JMRRecord.deleteMany({});
    console.log('🗑️  Cleared existing JMR records');
    
    // Insert new records
    const insertedRecords = await JMRRecord.insertMany(marathiJMRData);
    console.log(`✅ Successfully seeded ${insertedRecords.length} comprehensive JMR records`);
    
    // Display summary
    console.log('\n📊 JMR Data Summary:');
    console.log(`- Total Records: ${insertedRecords.length}`);
    console.log(`- Villages: ${[...new Set(insertedRecords.map(r => r.village))].join(', ')}`);
    console.log(`- Districts: ${[...new Set(insertedRecords.map(r => r.district))].join(', ')}`);
    console.log(`- Talukas: ${[...new Set(insertedRecords.map(r => r.taluka))].join(', ')}`);
    
    const statusBreakdown = insertedRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📋 Status Breakdown:');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} records`);
    });
    
    console.log('\n🎉 Marathi JMR data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding Marathi JMR data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

// Run the seeding
seedMarathiJMRData();