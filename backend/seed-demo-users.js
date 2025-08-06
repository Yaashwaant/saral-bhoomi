import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config({ path: './config.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

async function seedDemoUsers() {
  try {
    // Connect to database first
    await connectDB();

    // Check if demo users already exist
    const existingUsers = await User.find({
      email: { $in: [
        'admin@saral.gov.in', 
        'officer@saral.gov.in', 
        'agent@saral.gov.in',
        'rajesh.patil@saral.gov.in',
        'sunil.kambale@saral.gov.in',
        'mahesh.deshmukh@saral.gov.in',
        'vithal.jadhav@saral.gov.in',
        'ramrao.pawar@saral.gov.in'
      ]}
    });

    if (existingUsers.length > 0) {
      console.log('Demo users already exist. Skipping seed.');
      console.log('Existing users:');
      existingUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role}`);
      });
      process.exit(0);
    }

    // Create demo users (passwords will be hashed by User model pre-save hook)
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@saral.gov.in',
        password: 'admin123',
        role: 'admin',
        department: 'Administration',
        phone: '9876543210',
        language: 'marathi'
      },
      {
        name: 'Land Officer',
        email: 'officer@saral.gov.in',
        password: 'officer123',
        role: 'officer',
        department: 'Land Acquisition',
        phone: '9876543211',
        language: 'marathi'
      },
      {
        name: 'Field Agent',
        email: 'agent@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543212',
        language: 'marathi'
      },
      // Additional field agents for testing
      {
        name: 'राजेश पाटील',
        email: 'rajesh.patil@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543213',
        language: 'marathi'
      },
      {
        name: 'सुनील कांबळे',
        email: 'sunil.kambale@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543214',
        language: 'marathi'
      },
      {
        name: 'महेश देशमुख',
        email: 'mahesh.deshmukh@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543215',
        language: 'marathi'
      },
      {
        name: 'विठ्ठल जाधव',
        email: 'vithal.jadhav@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543216',
        language: 'marathi'
      },
      {
        name: 'रामराव पवार',
        email: 'ramrao.pawar@saral.gov.in',
        password: 'agent123',
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543217',
        language: 'marathi'
      }
    ];

    // Create users one by one to trigger pre-save hooks for password hashing
    const createdUsers = [];
    for (const userData of demoUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }

    console.log('Demo users created successfully!');
    console.log(`Created ${createdUsers.length} users:`);
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n=== Login Credentials ===');
    console.log('Admin: admin@saral.gov.in / admin123');
    console.log('Officer: officer@saral.gov.in / officer123');
    console.log('Agent: agent@saral.gov.in / agent123');
    console.log('Additional agents use: agent123 as password');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo users:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDemoUsers(); 