/**
 * Consolidated Test Runner for LinkedIn Scraper API
 * This script runs all tests in sequence and reports the results
 */

const testApi = require('./test-api');
const testLinkedInProxy = require('./test-linkedin-proxy');
const checkMongoDB = require('./check-mongo');

// Run tests in sequence with proper error handling
async function runAllTests() {
  console.log('🔍 Starting Comprehensive Test Suite for LinkedIn Scraper API');
  console.log('=============================================================');

  try {
    // 1. Run API tests
    console.log('\n⏱️ Running API Auth Tests...');
    await testApi();

    // 2. Run LinkedIn Account and Proxy tests
    console.log('\n⏱️ Running LinkedIn Account and Proxy Tests...');
    await testLinkedInProxy();

    // 3. Validate MongoDB data
    console.log('\n⏱️ Running MongoDB Validation...');
    await checkMongoDB();

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Direct execution
if (require.main === module) {
  runAllTests();
} else {
  module.exports = runAllTests;
}
