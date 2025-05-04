// Testing script for user rating functionality
const axios = require('axios');
const baseUrl = 'http://localhost:3000';

// Store tokens
let userToken = null;
let userId = null;
let clientUserId = null;

const testRating = async () => {
  try {
    console.log('🔍 Starting API tests for User Rating System');
    console.log('--------------------------------------------------');

    // 1. Login to get token
    console.log('Logging in to get auth token...');
    const loginResponse = await axios.post(`${baseUrl}/api/users/login`, {
      email: 'testuser@example.com',
      password: 'Test@123'
    });
    userToken = loginResponse.data.accessToken;
    userId = loginResponse.data.user.id;
    console.log('✅ Login successful, got token');
    console.log('--------------------------------------------------');

    // 2. Create a test client user to rate
    console.log('Creating a client user to rate...');
    try {
      const clientResponse = await axios.post(`${baseUrl}/api/users/register`, {
        name: 'Client User',
        email: 'client@example.com',
        password: 'Client@123',
        phone: 9876543210
      });
      console.log('✅ Client user created successfully');
    } catch (error) {
      if (error.response && error.response.data.message.includes('already exists')) {
        console.log('ℹ️ Client user already exists, continuing with tests');
      } else {
        throw error;
      }
    }

    // 3. Login with client user to get ID
    console.log('Logging in as client user to get ID...');
    const clientLoginResponse = await axios.post(`${baseUrl}/api/users/login`, {
      email: 'client@example.com',
      password: 'Client@123'
    });
    clientUserId = clientLoginResponse.data.user.id;
    console.log('✅ Client login successful, got user ID:', clientUserId);
    console.log('--------------------------------------------------');

    // 4. Update client user role to CLIENT
    // Note: This requires admin access which we don't have in this test script
    // In a real environment, you'd need to use an admin token to do this
    console.log('Note: In a real environment, an admin would need to update the user role to CLIENT');
    console.log('--------------------------------------------------');

    // 5. Try to rate the client (will fail without proper role)
    console.log('Trying to rate client (will likely fail if role is not CLIENT)...');
    try {
      const ratingResponse = await axios.post(`${baseUrl}/api/ratings`, {
        userId: clientUserId,
        rating: 4,
        comment: 'Great profile and experience'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('Rating response:', ratingResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 400 &&
          error.response.data.message.includes('Only CLIENT users can be rated')) {
        console.log('✅ Expected behavior: Rating failed because user role is not CLIENT');
      } else {
        console.log('❌ Unexpected error:', error.response ? error.response.data : error.message);
      }
    }
    console.log('--------------------------------------------------');

    // 6. Try to get ratings for the user
    console.log('Trying to get ratings for client user...');
    try {
      const getRatingsResponse = await axios.get(`${baseUrl}/api/ratings/${clientUserId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('Get ratings response:', getRatingsResponse.data);
    } catch (error) {
      console.log('❌ Error getting ratings:', error.response ? error.response.data : error.message);
    }
    console.log('--------------------------------------------------');

    console.log('User rating tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
  }
};

// Run the tests
testRating();
