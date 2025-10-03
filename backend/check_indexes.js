import mongoose from 'mongoose';

mongoose.connect('mongodb+srv://saral-bhoomi:saral-bhoomi@cluster0.ixqhb.mongodb.net/saral_bhoomi?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    const indexes = await db.collection('landownerrecords').indexes();
    console.log('Current indexes:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index, null, 2)}`);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });