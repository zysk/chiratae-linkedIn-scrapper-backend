const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
let adminToken = '';
let linkedinAccountId = '';
let proxyId = '';

// Get admin token first (assuming admin user exists)
const getAdminToken = async () => {
  try {
    const response = await axios.post(`${API_URL}/users/login`, {
      email: 'admin2@example.com',
      password: 'adminpass123'
    });

    return response.data.token;
  } catch (error) {
    console.error('Error getting admin token:', error.response?.data || error.message);
    throw error;
  }
};

// Helper to print responses in a cleaner format
const printResponse = (title, response) => {
  console.log(`\n===== ${title} =====`);
  if (response.data) {
    console.log(JSON.stringify(response.data, null, 2));
  } else {
    console.log(response);
  }
};

// Test LinkedIn Account Endpoints
const testLinkedInAccounts = async () => {
  console.log('\n🔶 Testing LinkedIn Account Endpoints 🔶');

  try {
    // 1. Create a LinkedIn account
    console.log('\n📝 Creating a LinkedIn account...');
    const createAccountResponse = await axios.post(
      `${API_URL}/linkedin-accounts`,
      {
        username: 'linkedin_test',
        password: 'securePassword123',
        email: 'linkedin_test@example.com',
        description: 'Test LinkedIn account'
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    printResponse('Create LinkedIn Account Response', createAccountResponse);

    // Save the account ID for later use
    linkedinAccountId = createAccountResponse.data.data.id;

    // 2. Get all LinkedIn accounts
    console.log('\n📋 Getting all LinkedIn accounts...');
    const getAllAccountsResponse = await axios.get(
      `${API_URL}/linkedin-accounts`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    printResponse('Get All LinkedIn Accounts Response', getAllAccountsResponse);

    // 3. Get LinkedIn account by ID
    console.log('\n🔍 Getting LinkedIn account by ID...');
    const getAccountResponse = await axios.get(
      `${API_URL}/linkedin-accounts/${linkedinAccountId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    printResponse('Get LinkedIn Account By ID Response', getAccountResponse);

    // 4. Update LinkedIn account
    console.log('\n✏️ Updating LinkedIn account...');
    const updateAccountResponse = await axios.put(
      `${API_URL}/linkedin-accounts/${linkedinAccountId}`,
      {
        username: 'linkedin_test_updated',
        password: 'newSecurePassword456',
        email: 'linkedin_updated@example.com',
        description: 'Updated test LinkedIn account',
        isActive: true
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    printResponse('Update LinkedIn Account Response', updateAccountResponse);

    // 5. Get next available LinkedIn account
    console.log('\n🔄 Getting next available LinkedIn account...');
    try {
      const nextAccountResponse = await axios.get(
        `${API_URL}/linkedin-accounts/next/available`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      printResponse('Get Next Available LinkedIn Account Response', nextAccountResponse);
    } catch (error) {
      console.log('Note: No available account or other error:', error.response?.data || error.message);
    }

    return linkedinAccountId;
  } catch (error) {
    console.error('Error in LinkedIn Account tests:', error.response?.data || error.message);
    throw error;
  }
};

// Test Proxy Endpoints
const testProxies = async () => {
  console.log('\n🔶 Testing Proxy Endpoints 🔶');

  try {
    // 1. Create a proxy
    console.log('\n📝 Creating a proxy...');
    const createProxyResponse = await axios.post(
      `${API_URL}/proxies`,
      {
        host: '192.168.1.100',
        port: 8080,
        username: 'proxyuser',
        password: 'proxypass',
        protocol: 'http',
        description: 'Test proxy server'
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    printResponse('Create Proxy Response', createProxyResponse);

    // Save the proxy ID for later use
    proxyId = createProxyResponse.data.data.id;

    // 2. Get all proxies
    console.log('\n📋 Getting all proxies...');
    const getAllProxiesResponse = await axios.get(
      `${API_URL}/proxies`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    printResponse('Get All Proxies Response', getAllProxiesResponse);

    // 3. Get proxy by ID
    console.log('\n🔍 Getting proxy by ID...');
    const getProxyResponse = await axios.get(
      `${API_URL}/proxies/${proxyId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    printResponse('Get Proxy By ID Response', getProxyResponse);

    // 4. Update proxy
    console.log('\n✏️ Updating proxy...');
    const updateProxyResponse = await axios.put(
      `${API_URL}/proxies/${proxyId}`,
      {
        host: '192.168.1.101',
        port: 8081,
        username: 'proxyuser_updated',
        password: 'proxypass_updated',
        protocol: 'https',
        description: 'Updated test proxy server',
        isActive: true
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` }
      }
    );
    printResponse('Update Proxy Response', updateProxyResponse);

    // 5. Get next available proxy
    console.log('\n🔄 Getting next available proxy...');
    try {
      const nextProxyResponse = await axios.get(
        `${API_URL}/proxies/next/available`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      printResponse('Get Next Available Proxy Response', nextProxyResponse);
    } catch (error) {
      console.log('Note: No available proxy or other error:', error.response?.data || error.message);
    }

    return proxyId;
  } catch (error) {
    console.error('Error in Proxy tests:', error.response?.data || error.message);
    throw error;
  }
};

// Optional: Clean up created resources
const cleanupResources = async () => {
  console.log('\n🔶 Cleaning Up Resources 🔶');

  try {
    if (linkedinAccountId) {
      // Delete LinkedIn account
      console.log('\n🗑️ Deleting LinkedIn account...');
      const deleteAccountResponse = await axios.delete(
        `${API_URL}/linkedin-accounts/${linkedinAccountId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      printResponse('Delete LinkedIn Account Response', deleteAccountResponse);
    }

    if (proxyId) {
      // Delete proxy
      console.log('\n🗑️ Deleting proxy...');
      const deleteProxyResponse = await axios.delete(
        `${API_URL}/proxies/${proxyId}`,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      printResponse('Delete Proxy Response', deleteProxyResponse);
    }
  } catch (error) {
    console.error('Error in cleanup:', error.response?.data || error.message);
  }
};

// Run the tests
const runTests = async () => {
  try {
    console.log('🚀 Starting LinkedIn Account and Proxy Management Tests');

    // Get admin token
    console.log('\n🔑 Getting admin token...');
    adminToken = await getAdminToken();
    console.log('Admin token obtained:', adminToken.substring(0, 15) + '...');

    // Test LinkedIn Account endpoints
    await testLinkedInAccounts();

    // Test Proxy endpoints
    await testProxies();

    // Clean up resources
    await cleanupResources();

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
  }
};

// Run the tests
runTests();
