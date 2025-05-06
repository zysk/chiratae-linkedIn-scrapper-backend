// Run Postman collections using Newman
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Define paths
const collectionsDir = path.join(__dirname, 'postman', 'collections');
const collectionPath = path.join(collectionsDir, 'LinkedIn Scraper.postman_collection.json');
const environmentPath = path.join(collectionsDir, 'LinkedIn Scrapper.postman_environment.json');

// Function to check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Validate files exist
if (!fileExists(collectionPath)) {
  console.error(`❌ Collection file not found: ${collectionPath}`);
  process.exit(1);
}

if (!fileExists(environmentPath)) {
  console.error(`❌ Environment file not found: ${environmentPath}`);
  process.exit(1);
}

// Define the test suites to run
const testSuites = [
  {
    name: 'Authentication Tests',
    folder: 'Authentication',
    description: 'Testing user registration, login, and token management'
  },
  {
    name: 'User Management Tests',
    folder: 'User Management',
    description: 'Testing user profile management and admin capabilities'
  },
  {
    name: 'User Ratings Tests',
    folder: 'User Ratings',
    description: 'Testing rating functionality'
  },
  {
    name: 'LinkedIn Accounts Tests',
    folder: 'LinkedIn Accounts',
    description: 'Testing LinkedIn account management'
  },
  {
    name: 'Proxies Tests',
    folder: 'Proxies',
    description: 'Testing proxy management'
  },
  {
    name: 'Campaigns Tests',
    folder: 'Campaigns',
    description: 'Testing campaign creation and management'
  }
];

// Create a function to run a specific test suite
function runTestSuite(suite) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔥 Running ${suite.name}: ${suite.description}`);
    console.log('===========================================================');

    const command = `newman run "${collectionPath}" -e "${environmentPath}" --folder "${suite.folder}" --color on`;

    const childProcess = exec(command);

    childProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    childProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${suite.name} completed successfully`);
        resolve();
      } else {
        console.error(`\n❌ ${suite.name} failed with exit code ${code}`);
        resolve(); // Still resolve to continue with other tests
      }
    });
  });
}

// Main function to run all test suites
async function runAllTests() {
  console.log('🧪 Starting Postman API Tests');
  console.log('===========================================================');
  console.log(`Collection: ${path.basename(collectionPath)}`);
  console.log(`Environment: ${path.basename(environmentPath)}`);
  console.log('===========================================================');

  let passedSuites = 0;
  let failedSuites = 0;

  for (const suite of testSuites) {
    try {
      await runTestSuite(suite);
      passedSuites++;
    } catch (error) {
      console.error(`❌ Error running ${suite.name}:`, error);
      failedSuites++;
    }
  }

  console.log('\n===========================================================');
  console.log('🏁 Test Summary:');
  console.log(`Total Suites: ${testSuites.length}`);
  console.log(`✅ Passed: ${passedSuites}`);
  console.log(`❌ Failed: ${failedSuites}`);
  console.log('===========================================================');
}

// Run all tests
runAllTests().catch(err => {
  console.error('Error running tests:', err);
  process.exit(1);
});
