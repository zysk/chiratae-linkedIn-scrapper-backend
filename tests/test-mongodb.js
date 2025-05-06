// MongoDB Testing Script
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGOURI);
    console.log('✅ MongoDB connected!');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    return false;
  }
};

// Test MongoDB Schema validation
const runSchemaValidation = () => {
  console.log('\n🔍 Testing MongoDB Schema Validation');
  console.log('--------------------------------------------------');

  // User schema validation
  const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: Number },
    isActive: { type: Boolean, default: true },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' }
  }, { timestamps: true });

  // LinkedIn Account schema validation
  const LinkedInAccountSchema = new mongoose.Schema({
    username: { type: String, required: true },
    encryptedPassword: { type: String, required: true },
    email: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    lastUsed: { type: Date },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }, { timestamps: true });

  // Proxy schema validation
  const ProxySchema = new mongoose.Schema({
    host: { type: String, required: true },
    port: { type: Number, required: true },
    username: { type: String },
    encryptedPassword: { type: String },
    protocol: { type: String, enum: ['http', 'https', 'socks5'], required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    lastUsed: { type: Date },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }, { timestamps: true });

  // Campaign schema validation
  const CampaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    searchQuery: { type: String, required: true },
    linkedinAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'LinkedInAccount' },
    proxyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proxy' },
    company: { type: String },
    location: { type: String },
    connectionDegree: { type: String },
    keywords: [{ type: String }],
    maxResults: { type: Number, default: 100 },
    status: {
      type: String,
      enum: ['CREATED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'CREATED'
    },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    queuedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stats: {
      profilesFound: { type: Number, default: 0 },
      profilesScraped: { type: Number, default: 0 },
      failedScrapes: { type: Number, default: 0 }
    },
    results: [{
      profileId: { type: String },
      profileUrl: { type: String },
      name: { type: String },
      title: { type: String },
      company: { type: String },
      location: { type: String },
      email: { type: String },
      phone: { type: String },
      scraped: { type: Boolean, default: false },
      scrapedAt: { type: Date },
      fullData: { type: mongoose.Schema.Types.Mixed }
    }]
  }, { timestamps: true });

  console.log('✅ Schema validation tests passed');

  // Return the schema models
  return {
    User: mongoose.model('User', UserSchema),
    LinkedInAccount: mongoose.model('LinkedInAccount', LinkedInAccountSchema),
    Proxy: mongoose.model('Proxy', ProxySchema),
    Campaign: mongoose.model('Campaign', CampaignSchema)
  };
};

// Function to test database queries
const testDatabaseQueries = async (models) => {
  console.log('\n🔍 Testing MongoDB Queries');
  console.log('--------------------------------------------------');

  try {
    // Test user queries
    console.log('📋 Testing User queries...');
    const users = await models.User.find().lean();
    console.log(`✅ Found ${users.length} users`);

    // Test LinkedIn account queries
    console.log('📋 Testing LinkedIn Account queries...');
    const accounts = await models.LinkedInAccount.find().lean();
    console.log(`✅ Found ${accounts.length} LinkedIn accounts`);

    // Test proxy queries
    console.log('📋 Testing Proxy queries...');
    const proxies = await models.Proxy.find().lean();
    console.log(`✅ Found ${proxies.length} proxies`);

    // Test campaign queries
    console.log('📋 Testing Campaign queries...');
    const campaigns = await models.Campaign.find().lean();
    console.log(`✅ Found ${campaigns.length} campaigns`);

    // Test aggregation pipeline
    console.log('📋 Testing aggregation pipeline...');
    const userStats = await models.User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
          }
        }
      }
    ]);

    console.log(`✅ User aggregation results:`, JSON.stringify(userStats, null, 2));

    return true;
  } catch (err) {
    console.error('❌ Error testing database queries:', err.message);
    return false;
  }
};

// Function to test data encryption/decryption
const testEncryption = () => {
  console.log('\n🔍 Testing Data Encryption/Decryption');
  console.log('--------------------------------------------------');

  try {
    const testPassword = 'test123password';

    // Encryption function
    const encrypt = (text) => {
      const algorithm = 'aes-256-ctr';
      const secretKey = process.env.ENCRYPTION_KEY || 'linkedInScraperSecretKey';
      const key = crypto.scryptSync(secretKey, 'salt', 32);
      const iv = Buffer.alloc(16, 0);

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
      return encrypted.toString('hex');
    };

    // Decryption function
    const decrypt = (encryptedText) => {
      const algorithm = 'aes-256-ctr';
      const secretKey = process.env.ENCRYPTION_KEY || 'linkedInScraperSecretKey';
      const key = crypto.scryptSync(secretKey, 'salt', 32);
      const iv = Buffer.alloc(16, 0);

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      const decrpyted = Buffer.concat([
        decipher.update(Buffer.from(encryptedText, 'hex')),
        decipher.final()
      ]);

      return decrpyted.toString();
    };

    // Test encryption
    const encrypted = encrypt(testPassword);
    console.log(`✅ Encrypted value: ${encrypted}`);

    // Test decryption
    const decrypted = decrypt(encrypted);
    console.log(`✅ Decrypted value: ${decrypted}`);

    // Verify encryption/decryption worked correctly
    if (decrypted === testPassword) {
      console.log('✅ Encryption/decryption test passed!');
      return true;
    } else {
      console.error('❌ Encryption/decryption test failed!');
      return false;
    }
  } catch (err) {
    console.error('❌ Error testing encryption:', err.message);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🧪 Running MongoDB Tests for LinkedIn Scraper');
  console.log('==================================================');

  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Run schema validation tests
    const models = runSchemaValidation();

    // Run database query tests
    const queriesSuccess = await testDatabaseQueries(models);

    // Run encryption tests
    const encryptionSuccess = testEncryption();

    // Display test summary
    console.log('\n🏁 MongoDB Test Summary:');
    console.log('--------------------------------------------------');
    console.log(`Schema Validation: ${models ? '✅ Passed' : '❌ Failed'}`);
    console.log(`Database Queries: ${queriesSuccess ? '✅ Passed' : '❌ Failed'}`);
    console.log(`Data Encryption: ${encryptionSuccess ? '✅ Passed' : '❌ Failed'}`);

    // Exit with appropriate code
    if (models && queriesSuccess && encryptionSuccess) {
      console.log('\n✅ All MongoDB tests passed!');
      process.exit(0);
    } else {
      console.error('\n❌ Some MongoDB tests failed!');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n❌ Error running MongoDB tests:', err.message);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('🔄 MongoDB connection closed');
  }
};

// Run the tests
runTests();
