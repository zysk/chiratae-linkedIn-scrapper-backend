const mongoose = require('mongoose');
const { CONFIG } = require('../dist/utils/config');
const LinkedInAccount = require('../dist/models/linkedinAccount.model').default;

async function updateLinkedInPassword(username, newPassword) {
  try {
    // Connect to MongoDB
    await mongoose.connect(CONFIG.MONGOURI);
    console.log('Connected to MongoDB');

    // Find the LinkedIn account
    const account = await LinkedInAccount.findOne({ username });

    if (!account) {
      console.error(`❌ No LinkedIn account found with username: ${username}`);
      return;
    }

    // Update the password
    account.setPassword(newPassword);
    await account.save();

    console.log(`✅ Successfully updated password for account: ${username}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Get username and password from command line arguments
const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.error('Usage: node scripts/update-linkedin-password.js <username> <new-password>');
  process.exit(1);
}

// Run the script
updateLinkedInPassword(username, newPassword);
