import { connectMongoDBAtlas } from './config/mongodb-atlas.js';
import mongoose from 'mongoose';

async function fixMongoIndexes() {
  try {
    console.log('🔧 Fixing MongoDB indexes...');
    
    // Connect to MongoDB Atlas
    const connected = await connectMongoDBAtlas();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB Atlas');
      return;
    }
    
    console.log('✅ Connected to MongoDB Atlas');
    
    // Drop existing indexes
    console.log('🗑️ Dropping existing indexes...');
    
    // Drop indexes from collections
    const collections = ['users', 'projects', 'landownerrecords', 'jmrrecords', 'awards', 'notices', 'payments', 'blockchainledgers'];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName);
        await collection.dropIndexes();
        console.log(`   ✅ Dropped indexes from ${collectionName}`);
      } catch (error) {
        console.log(`   ℹ️ No indexes to drop from ${collectionName}: ${error.message}`);
      }
    }
    
    console.log('✅ All indexes dropped');
    console.log('🚀 You can now run the migration script again');
    
  } catch (error) {
    console.error('❌ Failed to fix indexes:', error);
  } finally {
    process.exit(0);
  }
}

fixMongoIndexes();
