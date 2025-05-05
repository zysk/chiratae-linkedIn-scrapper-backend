const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../../.env' });

const uri = process.env.MONGOURI || "mongodb://root:Root123@localhost:27017/linkedin-scrapper?authSource=admin";

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB collections and data');
  console.log('--------------------------------------------------');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('linkedin-scrapper');

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections in the database:`);
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Check Users collection
    console.log('\n📋 Users Collection:');
    const users = await db.collection('users').find({}).limit(5).toArray();
    console.log(`Total users: ${await db.collection('users').countDocuments()}`);
    console.log('Sample user data:', JSON.stringify(users[0], null, 2));

    // Check Ratings collection
    console.log('\n⭐ Ratings Collection:');
    const ratings = await db.collection('ratings').find({}).limit(5).toArray();
    console.log(`Total ratings: ${await db.collection('ratings').countDocuments()}`);
    if (ratings.length > 0) {
      console.log('Sample rating data:', JSON.stringify(ratings[0], null, 2));
    } else {
      console.log('No ratings found');
    }

    // Check LinkedIn Accounts collection
    console.log('\n👤 LinkedIn Accounts Collection:');
    const linkedinAccounts = await db.collection('linkedinaccounts').find({}).limit(5).toArray();
    console.log(`Total LinkedIn accounts: ${await db.collection('linkedinaccounts').countDocuments()}`);
    if (linkedinAccounts.length > 0) {
      console.log('Sample LinkedIn account data:', JSON.stringify(linkedinAccounts[0], null, 2));
    } else {
      console.log('No LinkedIn accounts found');
    }

    // Check Proxies collection
    console.log('\n🌐 Proxies Collection:');
    const proxies = await db.collection('proxies').find({}).limit(5).toArray();
    console.log(`Total proxies: ${await db.collection('proxies').countDocuments()}`);
    if (proxies.length > 0) {
      console.log('Sample proxy data:', JSON.stringify(proxies[0], null, 2));
    } else {
      console.log('No proxies found');
    }

    // Check Campaigns collection
    console.log('\n📊 Campaigns Collection:');
    const campaigns = await db.collection('campaigns').find({}).limit(5).toArray();
    console.log(`Total campaigns: ${await db.collection('campaigns').countDocuments()}`);
    if (campaigns.length > 0) {
      console.log('Sample campaign data:', JSON.stringify(campaigns[0], null, 2));
    } else {
      console.log('No campaigns found');
    }

    console.log('\n✅ MongoDB check completed successfully');

  } catch (error) {
    console.error('❌ MongoDB check failed:', error);
  } finally {
    await client.close();
  }
}

// Run the check
checkMongoDB();
