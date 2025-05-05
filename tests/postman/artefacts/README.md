# LinkedIn Scraper API Testing

This directory contains tests and documentation for the LinkedIn Scraper API.

## Directory Structure

```
tests/
├── postman/
│   ├── artifacts/                 # Documentation and test reports
│   │   ├── AUTHENTICATION_SYSTEM_SUMMARY.md
│   │   ├── LINKEDIN_PROXY_SYSTEM_SUMMARY.md
│   │   ├── LINKEDIN_PROXY_TESTING_GUIDE.md
│   │   ├── README.md
│   │   ├── test-report.md
│   │   ├── TESTING_GUIDE.md
│   │   └── LinkedIn Scraper Environment.postman_environment.json
│   │
│   └── collections/               # Postman collections for testing
│       └── LinkedIn Scraper.postman_collection.json
│
└── test-scripts/                  # JavaScript test scripts
    ├── check-mongo.js             # MongoDB data validation
    ├── consolidated-tests.js      # Runs all tests in sequence
    ├── test-api.js                # Authentication API tests
    └── test-linkedin-proxy.js     # LinkedIn account and proxy API tests
```

## Test Documentation

- [General Testing Guide](./artifacts/TESTING_GUIDE.md) - Overall guide to testing the API
- [Authentication System Summary](./artifacts/AUTHENTICATION_SYSTEM_SUMMARY.md) - Summary of the authentication system
- [LinkedIn Proxy System Summary](./artifacts/LINKEDIN_PROXY_SYSTEM_SUMMARY.md) - Summary of LinkedIn account and proxy management
- [LinkedIn Proxy Testing Guide](./artifacts/LINKEDIN_PROXY_TESTING_GUIDE.md) - Specific guide for testing LinkedIn account and proxy endpoints
- [Test Report](./artifacts/test-report.md) - Comprehensive test results

## Quick Start

To run all tests in sequence:

```bash
cd test-scripts
node consolidated-tests.js
```

To run individual test files:

```bash
# Test authentication system
node test-api.js

# Test LinkedIn account and proxy management
node test-linkedin-proxy.js

# Check MongoDB collections and data
node check-mongo.js
```

## Postman Collection

Import the collection and environment files into Postman to perform manual testing:

1. Collection: `collections/LinkedIn Scraper.postman_collection.json`
2. Environment: `artifacts/LinkedIn Scraper Environment.postman_environment.json`

## Adding New Tests

When adding new test scripts:

1. Follow the pattern of existing test files
2. Make sure to export the test function for use in the consolidated test runner
3. Update the consolidated-tests.js file to include your new test
4. Add appropriate documentation
