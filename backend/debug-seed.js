import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/saral_bhoomi';

console.log('=== Debug Seed Process ===');
console.log('Using MongoDB URI:', MONGODB_URI);

try {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Dynamic import to avoid model registration issues
  const { default: EnhancedJMRRecord } = await import('./models/mongo/EnhancedJMRRecord.js');
  const { default: Project } = await import('./models/mongo/Project.js');
  const { default: User } = await import('./models/mongo/User.js');
  
  console.log('\n=== Before Seeding ===');
  const totalBefore = await EnhancedJMRRecord.countDocuments();
  console.log('Total EnhancedJMRRecord documents before:', totalBefore);
  
  const gholRecordsBefore = await EnhancedJMRRecord.find({ village: 'घोळ' });
  console.log('Ghol village records before:', gholRecordsBefore.length);
  
  console.log('\n=== Project Check ===');
  const projects = await Project.find({});
  console.log('Total projects:', projects.length);
  if (projects.length > 0) {
    projects.forEach(p => console.log(`- ${p.projectName} (${p._id})`));
  }
  
  console.log('\n=== Officer Check ===');
  const officers = await User.find({ role: 'officer' });
  console.log('Total officers:', officers.length);
  if (officers.length > 0) {
    officers.forEach(o => console.log(`- ${o.name} (${o._id})`));
  }
  
  console.log('\n=== Running Seed Function ===');
  
  // Import and run the seed function
  const { seedGholVillageData } = await import('./seeds/ghol_village_seed_data.js');
  
  try {
    await seedGholVillageData();
    console.log('Seed function completed');
  } catch (error) {
    console.error('Seed function failed:', error.message);
  }
  
  // Reconnect after seed function closes connection
  console.log('Reconnecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  
  console.log('\n=== After Seeding ===');
  const totalAfter = await EnhancedJMRRecord.countDocuments();
  console.log('Total EnhancedJMRRecord documents after:', totalAfter);
  
  const gholRecordsAfter = await EnhancedJMRRecord.find({ village: 'घोळ' });
  console.log('Ghol village records after:', gholRecordsAfter.length);
  
  if (gholRecordsAfter.length > 0) {
    console.log('\nSample record:');
    console.log('- ID:', gholRecordsAfter[0]._id);
    console.log('- Village:', gholRecordsAfter[0].village);
    console.log('- Landowner:', gholRecordsAfter[0].landowner_name);
    console.log('- Project ID:', gholRecordsAfter[0].project_id);
    console.log('- Officer ID:', gholRecordsAfter[0].officer_id);
  }
  
  await mongoose.disconnect();
  console.log('\nDebug completed!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}