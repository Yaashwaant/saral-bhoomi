import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/saral-bhoomi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema (simplified for seeding)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'officer', 'agent'] },
  department: String,
  phone: String,
  language: { type: String, default: 'marathi' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function seedDemoUsers() {
  try {
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
      process.exit(0);
    }

    // Hash passwords
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin', saltRounds);
    const officerPassword = await bcrypt.hash('officer', saltRounds);
    const agentPassword = await bcrypt.hash('agent', saltRounds);
    const agent123Password = await bcrypt.hash('agent123', saltRounds);

    // Create demo users
    const demoUsers = [
      {
        name: 'Admin User',
        email: 'admin@saral.gov.in',
        password: adminPassword,
        role: 'admin',
        department: 'Administration',
        phone: '9876543210',
        language: 'marathi'
      },
      {
        name: 'Land Officer',
        email: 'officer@saral.gov.in',
        password: officerPassword,
        role: 'officer',
        department: 'Land Acquisition',
        phone: '9876543211',
        language: 'marathi'
      },
      {
        name: 'Field Agent',
        email: 'agent@saral.gov.in',
        password: agentPassword,
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543212',
        language: 'marathi'
      },
      // Additional field agents for testing
      {
        name: 'राजेश पाटील',
        email: 'rajesh.patil@saral.gov.in',
        password: agent123Password,
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543210',
        language: 'marathi'
      },
      {
        name: 'सुनील कांबळे',
        email: 'sunil.kambale@saral.gov.in',
        password: agent123Password,
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543211',
        language: 'marathi'
      },
      {
        name: 'महेश देशमुख',
        email: 'mahesh.deshmukh@saral.gov.in',
        password: agent123Password,
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543212',
        language: 'marathi'
      },
      {
        name: 'विठ्ठल जाधव',
        email: 'vithal.jadhav@saral.gov.in',
        password: agent123Password,
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543213',
        language: 'marathi'
      },
      {
        name: 'रामराव पवार',
        email: 'ramrao.pawar@saral.gov.in',
        password: agent123Password,
        role: 'agent',
        department: 'Field Operations',
        phone: '9876543214',
        language: 'marathi'
      }
    ];

    const createdUsers = await User.insertMany(demoUsers);

    console.log('Demo users created successfully!');
    console.log(`Created ${createdUsers.length} users:`);
    createdUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo users:', error);
    process.exit(1);
  }
}

seedDemoUsers(); 