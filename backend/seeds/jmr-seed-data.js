import mongoose from 'mongoose';
import { connectMongoDBAtlas } from '../config/database.js';
import EnhancedJMRRecord from '../models/mongo/EnhancedJMRRecord.js';

// Sample project and officer IDs - replace with actual IDs from your database
const PROJECT_ID = new mongoose.Types.ObjectId('68b833f8c2e6f8a446510454');
const OFFICER_ID = new mongoose.Types.ObjectId('68b833f7c2e6f8a44651044c');

const jmrSeedData = [
  // Record 1 (from image 1)
  {
    serial_number: "1",
    landowner_name: "रिझर्व फॉरेस्ट",
    old_survey_number: "122",
    new_survey_number: "122",
    group_number: "2",
    total_area_village_record: 60,
    acquired_area: 0,
    village: "रिझर्व फॉरेस्ट",
    taluka: "",
    district: "",
    project_id: PROJECT_ID,
    officer_id: OFFICER_ID,
    land_type_classification: "agricultural",
    approved_rate_per_hectare: 0,
    market_value_acquired_area: 0,
    section_26_compensation: 0,
    crops: [
      { name: "किसान तथा भोगटा क्षेत्र ०.४५.०० हेक्टर", area: 0.45, compensation: 0 },
      { name: "हमला तथा भोगटा क्षेत्र ०.०४.०० हेक्टर", area: 0.04, compensation: 0 },
      { name: "पिंपळा सरपातळ भोगटा क्षेत्र ०.०२.२० हेक्टर", area: 0.022, compensation: 0 },
      { name: "मोठे बाभू भोगटा क्षेत्र ०.३३.५० हेक्टर", area: 0.335, compensation: 0 },
      { name: "मधुरा टिकली भोगटा क्षेत्र ०.०४.०० हेक्टर", area: 0.04, compensation: 0 },
      { name: "किष्णा ताडकशा भाटे क्षेत्र ०.७०.६० हेक्टर", area: 0.706, compensation: 0 },
      { name: "गणू किसन भाटे क्षेत्र ०.३३.३० हेक्टर", area: 0.333, compensation: 0 },
      { name: "माधवराव बाबा चुटके क्षेत्र ०.५४० हेक्टर", area: 0.54, compensation: 0 },
      { name: "केशव मोहन कर क्षेत्र ०.२४.०० हेक्टर", area: 0.24, compensation: 0 },
      { name: "दिलीप दिनानाथ कर क्षेत्र ०.१०.२० हेक्टर", area: 0.102, compensation: 0 },
      { name: "दारा रामजी चव्हाण क्षेत्र ०.०४.२० हेक्टर", area: 0.042, compensation: 0 }
    ]
  },
  
  // Record 2 (from image 2)
  {
    serial_number: "2",
    landowner_name: "कन्हैया तथा भोगटा",
    old_survey_number: "26",
    new_survey_number: "26",
    group_number: "0",
    total_area_village_record: 72,
    acquired_area: 20,
    village: "कन्हैया तथा भोगटा",
    taluka: "",
    district: "",
    project_id: PROJECT_ID,
    officer_id: OFFICER_ID,
    land_type_classification: "agricultural",
    approved_rate_per_hectare: 0,
    market_value_acquired_area: 0,
    section_26_compensation: 0,
    crops: [
      { name: "धर्म गोपाळ भोगटा", area: 0, compensation: 0 },
      { name: "जया गोविंद भोगटा", area: 0, compensation: 0 },
      { name: "नेमजी काळूराम भोगटा", area: 0, compensation: 0 },
      { name: "गोपा बाळाजी भोगटा", area: 0, compensation: 0 },
      { name: "बाळी रमेश भोगटा", area: 0, compensation: 0 },
      { name: "नथा किसन भोगटा", area: 0, compensation: 0 },
      { name: "रमेश किसन भोगटा", area: 0, compensation: 0 },
      { name: "भाऊराव रामा भोगटा", area: 0, compensation: 0 },
      { name: "जानकी दौलतराम मेहता", area: 0, compensation: 0 },
      { name: "दिपाली दौलतराम मेहता", area: 0, compensation: 0 },
      { name: "जनकी गोपाल्या मेहता", area: 0, compensation: 0 },
      { name: "बाबकी रामलाल जाधव", area: 0, compensation: 0 },
      { name: "लक्ष्मण भाऊ जाधव", area: 0, compensation: 0 },
      { name: "शिवराम किसन भोगटा", area: 0, compensation: 0 },
      { name: "भीमराव रमेश कर", area: 0, compensation: 0 },
      { name: "अजय किसन भोगटा", area: 0, compensation: 0 },
      { name: "कैलाश किसन भोगटा", area: 0, compensation: 0 }
    ],
    notes: "वहिवाट कमीशी जमावलेली नाही. क्षेत्र ०.५.००"
  },
  
  // Record 3 (from image 3)
  {
    serial_number: "3",
    landowner_name: "बाळाजी बाळकृष्ण भोगटा",
    old_survey_number: "182",
    new_survey_number: "182",
    group_number: "0",
    total_area_village_record: 73,
    acquired_area: 96,
    village: "बाळाजी बाळकृष्ण भोगटा",
    taluka: "",
    district: "",
    project_id: PROJECT_ID,
    officer_id: OFFICER_ID,
    land_type_classification: "agricultural",
    approved_rate_per_hectare: 0,
    market_value_acquired_area: 0,
    section_26_compensation: 0,
    crops: [
      { name: "खारकी बाळकृष्ण भोगटा", area: 0, compensation: 0 },
      { name: "जोहार बाळकृष्ण भोगटा", area: 0, compensation: 0 },
      { name: "पुष्पा शाहू भोगटा", area: 0, compensation: 0 }
    ],
    notes: "गणेश चतुर्भुज क्षेत्र ०.३०.२० हेक्टर वहिवाट कमीशी जमावलेली नाही. क्षेत्र ०.२.२०"
  },
  
  // Record 4 (from image 4 - additional names without survey numbers)
  {
    serial_number: "4",
    landowner_name: "जानकी तथा भोगटा",
    old_survey_number: "",
    new_survey_number: "",
    group_number: "",
    total_area_village_record: 0,
    acquired_area: 0,
    village: "जानकी तथा भोगटा",
    taluka: "",
    district: "",
    project_id: PROJECT_ID,
    officer_id: OFFICER_ID,
    land_type_classification: "agricultural",
    approved_rate_per_hectare: 0,
    market_value_acquired_area: 0,
    section_26_compensation: 0,
    crops: [
      { name: "नारेश तथा भोगटा", area: 0, compensation: 0 },
      { name: "सुनिता तथा भोगटा", area: 0, compensation: 0 },
      { name: "कल्पना तथा भोगटा", area: 0, compensation: 0 },
      { name: "नेताजी तथा भोगटा", area: 0, compensation: 0 },
      { name: "मधुकर भाई भोगटा", area: 0, compensation: 0 },
      { name: "दिलीपा तथा करम", area: 0, compensation: 0 },
      { name: "रतीराम भाई भोगटा", area: 0, compensation: 0 },
      { name: "सोमता अर्जुन मेहता", area: 0, compensation: 0 },
      { name: "सोमता नरेश गुर", area: 0, compensation: 0 },
      { name: "बाळू भाई भोगटा", area: 0, compensation: 0 },
      { name: "मोनी रामल्या भोगटा", area: 0, compensation: 0 },
      { name: "शंभू रामल्या भोगटा", area: 0, compensation: 0 },
      { name: "वैशाखू रमेश गोविंद", area: 0, compensation: 0 }
    ]
  },
  
  // Record 5 (from image 5)
  {
    serial_number: "5",
    landowner_name: "रिझर्व फॉरेस्ट",
    old_survey_number: "431",
    new_survey_number: "431",
    group_number: "3",
    total_area_village_record: 61,
    acquired_area: 70,
    village: "रिझर्व फॉरेस्ट",
    taluka: "",
    district: "",
    project_id: PROJECT_ID,
    officer_id: OFFICER_ID,
    land_type_classification: "agricultural",
    approved_rate_per_hectare: 0,
    market_value_acquired_area: 0,
    section_26_compensation: 0,
    crops: [
      { name: "दारा जकाराम मेहतकर क्षेत्र १.२०.०० हेक्टर", area: 1.2, compensation: 0 },
      { name: "रेणू माधव कर क्षेत्र ०.२३.२० हेक्टर", area: 0.232, compensation: 0 },
      { name: "विठ्ठल श्रावण लक्ष्मण क्षेत्र ०.५६.५० हेक्टर", area: 0.565, compensation: 0 }
    ]
  },
  
  // Record 6 (from image 6)
  {
    serial_number: "6",
    landowner_name: "रिझर्व फॉरेस्ट",
    old_survey_number: "37",
    new_survey_number: "37",
    group_number: "0",
    total_area_village_record: 16,
    acquired_area: 20,
    village: "रिझर्व फॉरेस्ट",
    taluka: "",
    district: "",
    project_id: PROJECT_ID,
    officer_id: OFFICER_ID,
    land_type_classification: "agricultural",
    approved_rate_per_hectare: 0,
    market_value_acquired_area: 0,
    section_26_compensation: 0,
    crops: [
      { name: "मधुरा टिकली भोगटा क्षेत्र ०.१२.२५ हेक्टर", area: 0.1225, compensation: 0 },
      { name: "गणेश चतुर्भुज क्षेत्र ०.०४.४० हेक्टर", area: 0.044, compensation: 0 },
      { name: "गोडू बापू भोगटा क्षेत्र ०.००.५० हेक्टर", area: 0.005, compensation: 0 }
    ]
  }
];

// Function to seed the data
const seedJMRData = async () => {
  try {
    // Connect to the database
    await connectMongoDBAtlas();
    
    // Clear existing data
    await EnhancedJMRRecord.deleteMany({});
    
    // Insert new data
    await EnhancedJMRRecord.insertMany(jmrSeedData);
    
    console.log('JMR seed data inserted successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding JMR data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedJMRData();