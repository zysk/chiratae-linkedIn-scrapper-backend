#!/usr/bin/env node

/**
 * Test Runner Script for LinkedIn Account and Proxy Management
 * This script automates the testing of the LinkedIn Account and Proxy Management endpoints
 *
 * Usage:
 *   node test-runner.js [options]
 *
 * Options:
 *   --port=4000           Port number where the server is running (default: 4000)
 *   --skip-auth           Skip authentication test
 *   --skip-linkedin       Skip LinkedIn account tests
 *   --skip-proxy          Skip Proxy tests
 *   --cleanup             Only run cleanup (delete test data)
 */

const axios = require('axios');
const { program } = require('commander');

// Parse command line arguments
program
  .option('--port <port>', 'Port number where the server is running', '4000')
  .option('--skip-auth', 'Skip authentication test')
  .option('--skip-linkedin', 'Skip LinkedIn account tests')
  .option('--skip-proxy', 'Skip Proxy tests')
  .option('--cleanup', 'Only run cleanup (delete test data)')
  .parse(process.argv);

const options = program.opts();
const baseUrl = `http://localhost:${options.port}/api`;
let adminToken = '';
let linkedinAccountId = '';
let proxyId = '';

// Test data
const admin = {
  email: 'admin2@example.com',
  password: 'adminpass123'
};

// Generate unique identifiers for test data
const uniqueId = Date.now().toString().slice(-6);

const linkedinAccount = {
  username: `linkedin_test_${uniqueId}`,
  password: 'securePassword123',
  email: `linkedin_test_${uniqueId}@example.com`,
  description: `Test LinkedIn account ${uniqueId}`
};

const updatedLinkedinAccount = {
  username: `linkedin_updated_${uniqueId}`,
  password: 'newSecurePassword456',
  email: `linkedin_updated_${uniqueId}@example.com`,
  description: `Updated test LinkedIn account ${uniqueId}`,
  isActive: true
};

const proxy = {
  host: `192.168.${uniqueId.slice(0, 1)}.${uniqueId.slice(1, 3)}`,
  port: 8000 + parseInt(uniqueId.slice(-3)),
  username: `proxyuser_${uniqueId}`,
  password: 'proxypass',
  protocol: 'http',
  description: `Test proxy server ${uniqueId}`
};

const updatedProxy = {
  host: `192.168.${uniqueId.slice(0, 1)}.${parseInt(uniqueId.slice(1, 3)) + 1}`,
  port: 8000 + parseInt(uniqueId.slice(-3)) + 1,
  username: `proxyuser_updated_${uniqueId}`,
  password: 'proxypass_updated',
  protocol: 'https',
  description: `Updated test proxy server ${uniqueId}`,
  isActive: true
};

// Utility functions
const logSuccess = (message) => console.log(`✅ ${message}`);
const logError = (message) => console.error(`❌ ${message}`);
const logInfo = (message) => console.log(`ℹ️ ${message}`);
const logWarning = (message) => console.warn(`⚠️ ${message}`);

// Authenticate as admin
async function authenticateAdmin() {
  try {
    logInfo('Authenticating as admin...');
    const response = await axios.post(`${baseUrl}/users/login`, admin);

    if (response.data && response.data.accessToken) {
      adminToken = response.data.accessToken;
      logSuccess('Authentication successful');
      return true;
    } else {
      logError('Authentication failed: No accessToken in response');
      console.log('Response data:', response.data);
      return false;
    }
  } catch (error) {
    logError(`Authentication failed: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// LinkedIn Account Tests
async function runLinkedInAccountTests() {
  try {
    // Create LinkedIn Account
    logInfo('Creating LinkedIn account...');
    try {
      const createResponse = await axios.post(
        `${baseUrl}/linkedin-accounts`,
        linkedinAccount,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      console.log('Create response:', JSON.stringify(createResponse.data, null, 2));

      if (createResponse.data && createResponse.data.data && createResponse.data.data.id) {
        linkedinAccountId = createResponse.data.data.id;
        logSuccess(`LinkedIn account created with ID: ${linkedinAccountId}`);
      } else {
        logError('Failed to create LinkedIn account - unexpected response format');
        return false;
      }
    } catch (error) {
      logError(`Failed to create LinkedIn account: ${error.message}`);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return false;
    }

    // Get All LinkedIn Accounts
    logInfo('Getting all LinkedIn accounts...');
    const getAllResponse = await axios.get(
      `${baseUrl}/linkedin-accounts`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (getAllResponse.data && getAllResponse.data.data && Array.isArray(getAllResponse.data.data)) {
      logSuccess(`Retrieved ${getAllResponse.data.data.length} LinkedIn accounts`);
    } else {
      logError('Failed to get all LinkedIn accounts');
    }

    // Get LinkedIn Account by ID
    logInfo(`Getting LinkedIn account with ID: ${linkedinAccountId}...`);
    try {
      const getByIdResponse = await axios.get(
        `${baseUrl}/linkedin-accounts/${linkedinAccountId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (getByIdResponse.data && getByIdResponse.data.data && getByIdResponse.data.data._id === linkedinAccountId) {
        logSuccess('Retrieved LinkedIn account by ID');
      } else {
        logError('Failed to get LinkedIn account by ID');
        console.log('Response data:', getByIdResponse.data);
      }
    } catch (error) {
      logError(`Failed to get LinkedIn account by ID: ${error.message}`);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    }

    // Update LinkedIn Account
    logInfo(`Updating LinkedIn account with ID: ${linkedinAccountId}...`);
    const updateResponse = await axios.put(
      `${baseUrl}/linkedin-accounts/${linkedinAccountId}`,
      updatedLinkedinAccount,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (updateResponse.data && updateResponse.data.data && updateResponse.data.data.username === updatedLinkedinAccount.username) {
      logSuccess('LinkedIn account updated successfully');
    } else {
      logError('Failed to update LinkedIn account');
    }

    // Get Next Available LinkedIn Account
    logInfo('Getting next available LinkedIn account...');
    try {
      const nextResponse = await axios.get(
        `${baseUrl}/linkedin-accounts/next/available`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (nextResponse.data && nextResponse.data.data) {
        logSuccess('Retrieved next available LinkedIn account');
      } else {
        logWarning('No available LinkedIn accounts found');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logWarning('No available LinkedIn accounts found (expected)');
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    logError(`LinkedIn account tests failed: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Proxy Tests
async function runProxyTests() {
  try {
    // Create Proxy
    logInfo('Creating proxy...');
    try {
      const createResponse = await axios.post(
        `${baseUrl}/proxies`,
        proxy,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      console.log('Create proxy response:', JSON.stringify(createResponse.data, null, 2));

      if (createResponse.data && createResponse.data.data && createResponse.data.data.id) {
        proxyId = createResponse.data.data.id;
        logSuccess(`Proxy created with ID: ${proxyId}`);
      } else {
        logError('Failed to create proxy - unexpected response format');
        return false;
      }
    } catch (error) {
      logError(`Failed to create proxy: ${error.message}`);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      return false;
    }

    // Get All Proxies
    logInfo('Getting all proxies...');
    const getAllResponse = await axios.get(
      `${baseUrl}/proxies`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (getAllResponse.data && getAllResponse.data.data && Array.isArray(getAllResponse.data.data)) {
      logSuccess(`Retrieved ${getAllResponse.data.data.length} proxies`);
    } else {
      logError('Failed to get all proxies');
    }

    // Get Proxy by ID
    logInfo(`Getting proxy with ID: ${proxyId}...`);
    try {
      const getByIdResponse = await axios.get(
        `${baseUrl}/proxies/${proxyId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (getByIdResponse.data && getByIdResponse.data.data && getByIdResponse.data.data._id === proxyId) {
        logSuccess('Retrieved proxy by ID');
      } else {
        logError('Failed to get proxy by ID');
        console.log('Response data:', getByIdResponse.data);
      }
    } catch (error) {
      logError(`Failed to get proxy by ID: ${error.message}`);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
    }

    // Update Proxy
    logInfo(`Updating proxy with ID: ${proxyId}...`);
    const updateResponse = await axios.put(
      `${baseUrl}/proxies/${proxyId}`,
      updatedProxy,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (updateResponse.data && updateResponse.data.data && updateResponse.data.data.host === updatedProxy.host) {
      logSuccess('Proxy updated successfully');
    } else {
      logError('Failed to update proxy');
    }

    // Get Next Available Proxy
    logInfo('Getting next available proxy...');
    try {
      const nextResponse = await axios.get(
        `${baseUrl}/proxies/next/available`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (nextResponse.data && nextResponse.data.data) {
        logSuccess('Retrieved next available proxy');
      } else {
        logWarning('No available proxies found');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        logWarning('No available proxies found (expected)');
      } else {
        throw error;
      }
    }

    return true;
  } catch (error) {
    logError(`Proxy tests failed: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Cleanup
async function cleanup() {
  try {
    // Delete LinkedIn Account
    if (linkedinAccountId) {
      logInfo(`Deleting LinkedIn account with ID: ${linkedinAccountId}...`);
      const deleteAccountResponse = await axios.delete(
        `${baseUrl}/linkedin-accounts/${linkedinAccountId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (deleteAccountResponse.data && deleteAccountResponse.data.message) {
        logSuccess('LinkedIn account deleted successfully');
      } else {
        logError('Failed to delete LinkedIn account');
      }
    }

    // Delete Proxy
    if (proxyId) {
      logInfo(`Deleting proxy with ID: ${proxyId}...`);
      const deleteProxyResponse = await axios.delete(
        `${baseUrl}/proxies/${proxyId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (deleteProxyResponse.data && deleteProxyResponse.data.message) {
        logSuccess('Proxy deleted successfully');
      } else {
        logError('Failed to delete proxy');
      }
    }

    return true;
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    return false;
  }
}

// Main test runner
async function runTests() {
  logInfo(`Starting tests against server at ${baseUrl}`);

  try {
    // Check if server is running
    await axios.get(`${baseUrl}/health`);
  } catch (error) {
    logError(`Server not running at ${baseUrl}. Please start the server first.`);
    return;
  }

  let authenticated = false;

  if (!options.skipAuth) {
    authenticated = await authenticateAdmin();
    if (!authenticated) {
      logError('Authentication failed. Cannot proceed with tests.');
      return;
    }
  }

  if (options.cleanup) {
    // Only run cleanup
    await cleanup();
    return;
  }

  if (!options.skipLinkedin) {
    const linkedinTestsSuccess = await runLinkedInAccountTests();
    if (!linkedinTestsSuccess) {
      logWarning('LinkedIn account tests failed. Continuing with other tests...');
    }
  }

  if (!options.skipProxy) {
    const proxyTestsSuccess = await runProxyTests();
    if (!proxyTestsSuccess) {
      logWarning('Proxy tests failed. Continuing with cleanup...');
    }
  }

  // Cleanup
  await cleanup();

  logInfo('All tests completed.');
}

// Run the tests
runTests().catch(error => {
  logError(`Unhandled error: ${error.message}`);
  process.exit(1);
});
