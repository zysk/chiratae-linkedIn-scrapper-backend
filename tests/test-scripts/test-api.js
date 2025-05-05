// Testing script for our API
const axios = require('axios');
const baseUrl = 'http://localhost:4000';

// Store tokens
let userToken = null;
let refreshToken = null;
let userId = null;
let adminToken = null;
let clientUserId = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const testApi = async () => {
  try {
    console.log('🔍 Starting API tests for Task #2: Authentication System');
    console.log('--------------------------------------------------');

    // 1. Test health endpoint
    console.log('Testing Health Endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('--------------------------------------------------');

    // 2. Register a regular user
    console.log('Registering a new user...');
    try {
      await axios.post(`${baseUrl}/api/users/register`, {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'Test@123',
        phone: 1234567890
      });
      console.log('✅ User registration successful');
    } catch (error) {
      if (error.response && error.response.data.message.includes('already exists')) {
        console.log('ℹ️ User already exists, continuing with tests');
      } else {
        throw error;
      }
    }

    // 3. Login with the user
    console.log('Logging in as user...');
    const loginResponse = await axios.post(`${baseUrl}/api/users/login`, {
      email: 'testuser@example.com',
      password: 'Test@123'
    });
    userToken = loginResponse.data.accessToken;
    refreshToken = loginResponse.data.refreshToken;
    userId = loginResponse.data.user.id;
    console.log('✅ User login successful');
    console.log('Got tokens:', userToken ? 'Yes' : 'No');
    console.log('--------------------------------------------------');

    // 4. Try protected endpoint with user token
    console.log('Testing protected endpoint with user token...');
    const userProfileResponse = await axios.get(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Access to protected endpoint successful');
    console.log('User details:', userProfileResponse.data.data);
    console.log('--------------------------------------------------');

    // 5. Try to register an admin (which should fail without admin token)
    console.log('Trying to register admin without proper authorization...');
    try {
      await axios.post(`${baseUrl}/api/users/registerAdmin`, {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Admin@123',
        phone: 9876543210
      });
      console.log('❌ Admin registration should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Admin registration correctly failed without authorization');
      } else {
        console.log('❌ Unexpected error:', error.response ? error.response.data : error.message);
      }
    }
    console.log('--------------------------------------------------');

    // 6. Update user profile
    console.log('Updating user profile...');
    const updateResponse = await axios.patch(`${baseUrl}/api/users/me/update`, {
      name: 'Updated Test User'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Profile update successful:', updateResponse.data.message);
    console.log('--------------------------------------------------');

    // 7. Refresh token
    console.log('Testing refresh token...');
    const refreshResponse = await axios.post(`${baseUrl}/api/users/refreshToken`, {
      refreshToken: refreshToken
    });
    const newAccessToken = refreshResponse.data.accessToken;
    console.log('✅ Token refresh successful:', newAccessToken ? 'Got new token' : 'Failed to get token');
    console.log('--------------------------------------------------');

    console.log('All tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// Execute the tests if this file is run directly
if (require.main === module) {
  testApi();
} else {
  // Otherwise export the test function
  module.exports = testApi;
}
