import mongoose from 'mongoose';

async function debugDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/saral-bhoomi');
    console.log('Connected to MongoDB');

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

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugDatabase();