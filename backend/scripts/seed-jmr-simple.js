import mongoose from 'mongoose';
import { connectMongoDBAtlas } from '../config/database.js';
import JMRRecord from '../models/mongo/JMRRecord.js';

async function seedSimple() {
  try {
    console.log('🌱 Starting simple JMR seed...');
    
    // Connect to MongoDB
    const connected = await connectMongoDBAtlas();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }
    console.log('✅ MongoDB connected');
    
    // Simple test data
    const testData = {
      survey_number: 'TEST-001',
      owner_id: 'OWNER-TEST',
      landowner_name: 'टेस्ट मालक',
      plot_area: 2.0,
      land_classification: 'शेती',
      revenue_village: 'टेस्ट गाव',
      irrigation_type: 'कोरडवाहू',
      crop_type: 'ज्वारी',
      
      // Required fields
      project_id: new mongoose.Types.ObjectId(),
      officer_id: new mongoose.Types.ObjectId(),
      
      // Basic compensation
      compensation_amount: 2000000,
      final_amount: 2400000,
      status: 'approved',
      
      // Location
      village: 'टेस्ट गाव',
      taluka: 'हवेली',
      district: 'पुणे'
    };
    
    // Clear existing test data
    await JMRRecord.deleteMany({ survey_number: 'TEST-001' });
    console.log('🗑️  Cleared existing test data');
    
    // Create test record
    const record = await JMRRecord.create(testData);
    console.log('✅ Created test record:', record._id);
    
    // Verify by counting
    const count = await JMRRecord.countDocuments();
    console.log('📊 Total JMR records:', count);
    
    console.log('🎉 Simple seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Simple seed failed:', error);
    throw error;
  }
}

// Run the seeding
seedSimple()
  .then(() => {
    console.log('✅ Process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });