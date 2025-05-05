# LinkedIn Scraper API Testing Guide

This document provides instructions on how to test the LinkedIn Scraper API using the provided test scripts and Postman collections.

## Prerequisites

Before running the tests, ensure you have the following set up:

1. Node.js (v20.x or later) installed
2. MongoDB running (default: localhost:27017)
3. Redis running (if applicable)
4. The LinkedIn Scraper API running locally (default: http://localhost:4000)
5. Postman (if using the GUI interface) or Newman (if running from command line)

## Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/linkedin-scraper-api.git
   cd linkedin-scraper-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the MongoDB and Redis services (if not already running)

4. Configure the .env file (use .env.example as a template)

5. Start the API server:
   ```bash
   npm run dev
   ```

## Running the Tests

### Option 1: Running All Tests with JavaScript

For a comprehensive test of all functionality, use the consolidated test script:

```bash
cd tests/test-scripts
node consolidated-tests.js
```

This script will run the following tests in sequence:
- Authentication System Tests (`test-api.js`)
- LinkedIn Account and Proxy Management Tests (`test-linkedin-proxy.js`)
- MongoDB Validation (`check-mongo.js`)

### Option 2: Running Individual Test Scripts

You can also run the test scripts individually:

```bash
# Test authentication system
node test-api.js

# Test LinkedIn account and proxy management
node test-linkedin-proxy.js

# Check MongoDB collections and data
node check-mongo.js
```

### Option 3: Using Postman GUI

1. Open Postman
2. Import the collection from `tests/postman/collections/LinkedIn Scraper.postman_collection.json`
3. Import the environment from `tests/postman/artifacts/LinkedIn Scraper Environment.postman_environment.json`
4. Select the imported environment from the dropdown in the top-right corner
5. Run the collection or individual requests

### Option 4: Using Newman (Postman CLI)

If you have Newman installed, you can run the tests from the command line:

```bash
newman run tests/postman/collections/LinkedIn\ Scraper.postman_collection.json -e tests/postman/artifacts/LinkedIn\ Scraper\ Environment.postman_environment.json
```

## Test Reports

After running the tests, you can find the test report in:
- `tests/postman/artifacts/test-report.md`

## Adding New Tests

### Adding New JavaScript Tests

1. Create a new test file in the `tests/test-scripts` directory
2. Follow the pattern of existing test files, with proper exports
3. Update `consolidated-tests.js` to include your new test

### Adding New Postman Tests

1. Export your tests from Postman
2. Place the collection file in `tests/postman/collections/`
3. Place any environment files in `tests/postman/artifacts/`
4. Update the test documentation

## Troubleshooting

If the tests fail, check the following:

1. Make sure the API server is running
2. Verify that MongoDB and Redis are accessible
3. Check the .env configuration
4. Look for detailed error messages in the console output

For more specific issues, refer to the API documentation or contact the development team.
