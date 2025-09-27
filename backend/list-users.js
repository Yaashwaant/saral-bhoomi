import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/mongo/User.js';

// Load environment variables
dotenv.config({ path: './config.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

async function listUsers() {
  try {
    await connectDB();

    const users = await User.find({});
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

listUsers();