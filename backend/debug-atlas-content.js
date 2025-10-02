import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function debugAtlasDatabase() {
  try {
    console.log('☁️ Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      ssl: true,
      authSource: 'admin',
      retryReads: true
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);

    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Check landownerrecords2 collection
    const landownerRecords2 = mongoose.connection.db.collection('landownerrecords2');
    const count = await landownerRecords2.countDocuments();
    console.log(`Total documents in landownerrecords2: ${count}`);

    // Check for the specific project
    const projectRecords = await landownerRecords2.find({ project_id: '68da6edf579af093415f639e' }).toArray();
    console.log(`Records for project 68da6edf579af093415f639e: ${projectRecords.length}`);

    if (projectRecords.length > 0) {
      console.log('First record sample:');
      console.log(JSON.stringify(projectRecords[0], null, 2));
      
      // Check data types
      console.log('project_id type in first record:', typeof projectRecords[0].project_id);
      console.log('project_id value in first record:', projectRecords[0].project_id);
    }

    // Check if there are other collections with similar data
    for (const collectionName of ['landownerrecords', 'landrecords', 'landrecords2']) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const collCount = await collection.countDocuments();
        const projCount = await collection.countDocuments({ project_id: '68da6edf579af093415f639e' });
        console.log(`${collectionName}: ${collCount} total, ${projCount} for project`);
      } catch (err) {
        console.log(`${collectionName}: Collection not found`);
      }
    }

    // Show all unique project_ids in landownerrecords2
    const uniqueProjects = await landownerRecords2.distinct('project_id');
    console.log('Unique project_ids in landownerrecords2:', uniqueProjects);

    // Count records by project_id
    const projectCounts = await landownerRecords2.aggregate([
      { $group: { _id: '$project_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    console.log('Records count by project:');
    projectCounts.forEach(item => {
      console.log(`  ${item._id}: ${item.count} records`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas');
  }
}

debugAtlasDatabase();