import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saral_bhoomi';

// Create a dummy user ID for projects
const dummyUserId = new ObjectId();

const sampleJMRData = [
  {
    serialNo: "1",
    surveyNo: "123/1A",
    ownerName: "श्री राम शर्मा",
    project: "पुणे-मुंबई महामार्ग विस्तार",
    district: "पुणे",
    taluka: "हवेली",
    village: "बावधन",
    landType: "शेतजमीन",
    landArea: 2.5,
    compensationRate: 150000,
    totalCompensation: 375000,
    remarks: "मुख्य रस्त्याच्या बाजूला",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serialNo: "2",
    surveyNo: "456/2B",
    ownerName: "श्रीमती सुनीता पाटील",
    project: "पुणे-मुंबई महामार्ग विस्तार",
    district: "पुणे",
    taluka: "हवेली",
    village: "बावधन",
    landType: "बागायत",
    landArea: 1.8,
    compensationRate: 200000,
    totalCompensation: 360000,
    remarks: "आंब्याचा बाग",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serialNo: "3",
    surveyNo: "789/3C",
    ownerName: "श्री विकास देशमुख",
    project: "पुणे-मुंबई महामार्ग विस्तार",
    district: "पुणे",
    taluka: "हवेली",
    village: "पिंपरी",
    landType: "शेतजमीन",
    landArea: 3.2,
    compensationRate: 140000,
    totalCompensation: 448000,
    remarks: "सिंचन सुविधा उपलब्ध",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serialNo: "4",
    surveyNo: "101/4D",
    ownerName: "श्री अनिल कुलकर्णी",
    project: "नागपूर रिंग रोड",
    district: "नागपूर",
    taluka: "नागपूर ग्रामीण",
    village: "कामठी",
    landType: "वसाहत",
    landArea: 0.5,
    compensationRate: 300000,
    totalCompensation: 150000,
    remarks: "निवासी भूखंड",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serialNo: "5",
    surveyNo: "202/5E",
    ownerName: "श्रीमती मीरा जोशी",
    project: "नागपूर रिंग रोड",
    district: "नागपूर",
    taluka: "नागपूर ग्रामीण",
    village: "कामठी",
    landType: "शेतजमीन",
    landArea: 4.1,
    compensationRate: 120000,
    totalCompensation: 492000,
    remarks: "कापूस पीक",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serialNo: "6",
    surveyNo: "303/6F",
    ownerName: "श्री संदीप महाजन",
    project: "औरंगाबाद बायपास",
    district: "औरंगाबाद",
    taluka: "औरंगाबाद",
    village: "वालुज",
    landType: "बागायत",
    landArea: 2.8,
    compensationRate: 180000,
    totalCompensation: 504000,
    remarks: "द्राक्ष बाग",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serialNo: "7",
    surveyNo: "404/7G",
    ownerName: "श्री राजेश गायकवाड",
    project: "औरंगाबाद बायपास",
    district: "औरंगाबाद",
    taluka: "औरंगाबाद",
    village: "वालुज",
    landType: "शेतजमीन",
    landArea: 5.5,
    compensationRate: 110000,
    totalCompensation: 605000,
    remarks: "ज्वारी बाजरी पीक",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serialNo: "8",
    surveyNo: "505/8H",
    ownerName: "श्रीमती प्रिया शिंदे",
    project: "कोल्हापूर-सांगली महामार्ग",
    district: "कोल्हापूर",
    taluka: "शिरोळ",
    village: "कुरुंदवाड",
    landType: "शेतजमीन",
    landArea: 3.7,
    compensationRate: 130000,
    totalCompensation: 481000,
    remarks: "ऊस पीक",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serialNo: "9",
    surveyNo: "606/9I",
    ownerName: "श्री अमोल भोसले",
    project: "कोल्हापूर-सांगली महामार्ग",
    district: "कोल्हापूर",
    taluka: "शिरोळ",
    village: "कुरुंदवाड",
    landType: "बागायत",
    landArea: 1.2,
    compensationRate: 220000,
    totalCompensation: 264000,
    remarks: "केळी बाग",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serialNo: "10",
    surveyNo: "707/10J",
    ownerName: "श्री दिलीप काळे",
    project: "नाशिक-अहमदनगर महामार्ग",
    district: "नाशिक",
    taluka: "निफाड",
    village: "देवळाली",
    landType: "शेतजमीन",
    landArea: 6.2,
    compensationRate: 100000,
    totalCompensation: 620000,
    remarks: "कांदा पीक",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const seedProjects = [
  { 
    projectName: "पुणे-मुंबई महामार्ग विस्तार", 
    projectNumber: "PMH001",
    schemeName: "महामार्ग विकास योजना",
    landRequired: 500,
    landAvailable: 300,
    landToBeAcquired: 200,
    type: "greenfield",
    district: "पुणे",
    taluka: "हवेली",
    villages: ["बावधन", "पिंपरी"],
    estimatedCost: 50000000,
    allocatedBudget: 45000000,
    startDate: new Date('2024-01-01'),
    expectedCompletion: new Date('2025-12-31'),
    description: "पुणे ते मुंबई महामार्गाचा विस्तार प्रकल्प", 
    isActive: true,
    createdAt: new Date(), 
    updatedAt: new Date() 
  },
  { 
    projectName: "नागपूर रिंग रोड", 
    projectNumber: "NRR002",
    schemeName: "शहरी विकास योजना",
    landRequired: 300,
    landAvailable: 200,
    landToBeAcquired: 100,
    type: "brownfield",
    district: "नागपूर",
    taluka: "नागपूर ग्रामीण",
    villages: ["कामठी"],
    estimatedCost: 30000000,
    allocatedBudget: 28000000,
    startDate: new Date('2024-02-01'),
    expectedCompletion: new Date('2025-06-30'),
    description: "नागपूर शहराभोवती रिंग रोड विकास", 
    isActive: true,
    createdAt: new Date(), 
    updatedAt: new Date() 
  },
  { 
    projectName: "औरंगाबाद बायपास", 
    projectNumber: "ABP003",
    schemeName: "बायपास विकास योजना",
    landRequired: 250,
    landAvailable: 150,
    landToBeAcquired: 100,
    type: "greenfield",
    district: "औरंगाबाद",
    taluka: "औरंगाबाद",
    villages: ["वालुज"],
    estimatedCost: 25000000,
    allocatedBudget: 23000000,
    startDate: new Date('2024-03-01'),
    expectedCompletion: new Date('2025-09-30'),
    description: "औरंगाबाद शहर बायपास रस्ता", 
    isActive: true,
    createdAt: new Date(), 
    updatedAt: new Date() 
  },
  { 
    projectName: "कोल्हापूर-सांगली महामार्ग", 
    projectNumber: "KSH004",
    schemeName: "महामार्ग विकास योजना",
    landRequired: 400,
    landAvailable: 250,
    landToBeAcquired: 150,
    type: "greenfield",
    district: "कोल्हापूर",
    taluka: "शिरोळ",
    villages: ["कुरुंदवाड"],
    estimatedCost: 40000000,
    allocatedBudget: 38000000,
    startDate: new Date('2024-04-01'),
    expectedCompletion: new Date('2025-11-30'),
    description: "कोल्हापूर ते सांगली महामार्ग", 
    isActive: true,
    createdAt: new Date(), 
    updatedAt: new Date() 
  },
  { 
    projectName: "नाशिक-अहमदनगर महामार्ग", 
    projectNumber: "NAH005",
    schemeName: "महामार्ग विकास योजना",
    landRequired: 350,
    landAvailable: 200,
    landToBeAcquired: 150,
    type: "brownfield",
    district: "नाशिक",
    taluka: "निफाड",
    villages: ["देवळाली"],
    estimatedCost: 35000000,
    allocatedBudget: 33000000,
    startDate: new Date('2024-05-01'),
    expectedCompletion: new Date('2025-10-31'),
    description: "नाशिक ते अहमदनगर महामार्ग", 
    isActive: true,
    createdAt: new Date(), 
    updatedAt: new Date() 
  }
];

const seedDistricts = [
  { name: "पुणे", state: "महाराष्ट्र", createdAt: new Date(), updatedAt: new Date() },
  { name: "नागपूर", state: "महाराष्ट्र", createdAt: new Date(), updatedAt: new Date() },
  { name: "औरंगाबाद", state: "महाराष्ट्र", createdAt: new Date(), updatedAt: new Date() },
  { name: "कोल्हापूर", state: "महाराष्ट्र", createdAt: new Date(), updatedAt: new Date() },
  { name: "नाशिक", state: "महाराष्ट्र", createdAt: new Date(), updatedAt: new Date() }
];

const seedTalukas = [
  { name: "हवेली", district: "पुणे", createdAt: new Date(), updatedAt: new Date() },
  { name: "नागपूर ग्रामीण", district: "नागपूर", createdAt: new Date(), updatedAt: new Date() },
  { name: "औरंगाबाद", district: "औरंगाबाद", createdAt: new Date(), updatedAt: new Date() },
  { name: "शिरोळ", district: "कोल्हापूर", createdAt: new Date(), updatedAt: new Date() },
  { name: "निफाड", district: "नाशिक", createdAt: new Date(), updatedAt: new Date() }
];

const seedVillages = [
  { name: "बावधन", district: "पुणे", taluka: "हवेली", createdAt: new Date(), updatedAt: new Date() },
  { name: "पिंपरी", district: "पुणे", taluka: "हवेली", createdAt: new Date(), updatedAt: new Date() },
  { name: "कामठी", district: "नागपूर", taluka: "नागपूर ग्रामीण", createdAt: new Date(), updatedAt: new Date() },
  { name: "वालुज", district: "औरंगाबाद", taluka: "औरंगाबाद", createdAt: new Date(), updatedAt: new Date() },
  { name: "कुरुंदवाड", district: "कोल्हापूर", taluka: "शिरोळ", createdAt: new Date(), updatedAt: new Date() },
  { name: "देवळाली", district: "नाशिक", taluka: "निफाड", createdAt: new Date(), updatedAt: new Date() }
];

async function seedJMRData() {
  let client;
  
  try {
    console.log('🌱 Starting JMR data seeding...');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data
    console.log('🧹 Clearing existing JMR data...');
    await db.collection('jmr_records').deleteMany({});
    await db.collection('projects').deleteMany({});
    await db.collection('districts').deleteMany({});
    await db.collection('talukas').deleteMany({});
    await db.collection('villages').deleteMany({});
    
    // Insert seed data
    console.log('📝 Inserting JMR records...');
    const jmrResult = await db.collection('jmr_records').insertMany(sampleJMRData);
    console.log(`✅ Inserted ${jmrResult.insertedCount} JMR records`);
    
    console.log('🏗️ Inserting projects...');
    const projectResult = await db.collection('projects').insertMany(seedProjects);
    console.log(`✅ Inserted ${projectResult.insertedCount} projects`);
    
    console.log('🏛️ Inserting districts...');
    const districtResult = await db.collection('districts').insertMany(seedDistricts);
    console.log(`✅ Inserted ${districtResult.insertedCount} districts`);
    
    console.log('🏘️ Inserting talukas...');
    const talukaResult = await db.collection('talukas').insertMany(seedTalukas);
    console.log(`✅ Inserted ${talukaResult.insertedCount} talukas`);
    
    console.log('🏡 Inserting villages...');
    const villageResult = await db.collection('villages').insertMany(seedVillages);
    console.log(`✅ Inserted ${villageResult.insertedCount} villages`);
    
    console.log('🎉 JMR data seeding completed successfully!');
    
    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log(`- JMR Records: ${jmrResult.insertedCount}`);
    console.log(`- Projects: ${projectResult.insertedCount}`);
    console.log(`- Districts: ${districtResult.insertedCount}`);
    console.log(`- Talukas: ${talukaResult.insertedCount}`);
    console.log(`- Villages: ${villageResult.insertedCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding JMR data:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run the seeding function
seedJMRData();

export { seedJMRData, sampleJMRData, seedProjects, seedDistricts, seedTalukas, seedVillages };