const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment
const MONGODB_URI = process.env.MONGOURI || 'mongodb://root:Root123@localhost:27017/linkedin-scrapper?authSource=admin';

async function main() {
  console.log('Connecting to MongoDB...');
  console.log(`MongoDB URI: ${MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB!');

    // Define a simple user schema based on our existing model
    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String
    }, { collection: 'users' });

    const User = mongoose.model('User', userSchema);

    // Find all users
    console.log('Finding all users:');
    const users = await User.find().select('-password');
    console.log(JSON.stringify(users, null, 2));

    // Find admin users
    console.log('\nFinding admin users:');
    const adminUsers = await User.find({ role: 'admin' }).select('-password');
    console.log(JSON.stringify(adminUsers, null, 2));

    // If no admin users, let's create a test admin
    if (adminUsers.length === 0) {
      console.log('\nNo admin users found. Creating a test admin user...');

      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('adminpass123', 10);

      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('Created admin user:');
      console.log(JSON.stringify(adminUser.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }), null, 2));
    }

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main().catch(console.error);