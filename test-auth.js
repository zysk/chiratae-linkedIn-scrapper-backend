const axios = require('axios');

const API_URL = 'http://localhost:4000/api';
let userAccessToken = '';
let userRefreshToken = '';
let userId = '';
let adminAccessToken = '';
let adminId = '';
let clientUserId = '';

// Test user data
const testUser = {
  name: 'Test User 1',
  email: 'testuser1@example.com',
  password: 'password123',
  phone: 1134567890
};

const testAdmin = {
  name: 'Admin User',
  email: 'admin2@example.com',
  password: 'adminpass123',
  phone: 8876543210
};

const clientUser = {
  name: 'Client User 1',
  email: 'client1@example.com',
  password: 'clientpass123',
  phone: 5556667777,
  link: 'https://linkedin.com/in/client1',
  currentPosition: 'CEO',
  location: 'Bangalore, India'
};

// Helper to print responses in a cleaner format
const printResponse = (title, response) => {
  console.log(`\n======== ${title} ========`);
  console.log('Status:', response.status);
  console.log('Data:', JSON.stringify(response.data, null, 2));
  console.log('=======================\n');
};

// Test all authentication endpoints
const runTests = async () => {
  try {
    // ======= Test User Registration =======
    console.log('\n🔶 Testing User Registration and Authentication 🔶');

    // 1. Register a user
    console.log('\n📝 Registering a new user...');
    try {
      const registerResponse = await axios.post(
        `${API_URL}/users/register`,
        testUser
      );
      printResponse('Register User Response', registerResponse);
    } catch (error) {
      if (error.response && error.response.status === 400 &&
          error.response.data.message.includes('already exists')) {
        console.log('User already exists, proceeding with login...');
      } else {
        throw error;
      }
    }

    // 2. Login as user
    console.log('\n🔑 Logging in as user...');
    const loginResponse = await axios.post(
      `${API_URL}/users/login`,
      {
        email: testUser.email,
        password: testUser.password
      }
    );
    printResponse('Login Response', loginResponse);

    userAccessToken = loginResponse.data.accessToken;
    userRefreshToken = loginResponse.data.refreshToken;
    userId = loginResponse.data.user.id;

    // 3. Get current user
    console.log('\n👤 Getting current user profile...');
    const currentUserResponse = await axios.get(
      `${API_URL}/users/me`,
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`
        }
      }
    );
    printResponse('Current User Response', currentUserResponse);

    // 4. Refresh token
    console.log('\n🔄 Testing token refresh...');
    const refreshResponse = await axios.post(
      `${API_URL}/users/refreshToken`,
      {
        refreshToken: userRefreshToken
      }
    );
    printResponse('Refresh Token Response', refreshResponse);

    // Update tokens
    userAccessToken = refreshResponse.data.accessToken;
    userRefreshToken = refreshResponse.data.refreshToken;

    // 5. Update user profile
    console.log('\n✏️ Updating user profile...');
    const updateResponse = await axios.patch(
      `${API_URL}/users/me/update`,
      {
        name: `${testUser.name} (Updated)`
      },
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`
        }
      }
    );
    printResponse('Update User Response', updateResponse);

    // ======= Test Admin Registration =======
    console.log('\n🔶 Testing Admin Registration and Authentication 🔶');

    // 6. Try to register admin without admin privileges (should fail)
    console.log('\n⚠️ Attempting to register admin without admin privileges (should fail)...');
    try {
      await axios.post(
        `${API_URL}/users/registerAdmin`,
        testAdmin,
        {
          headers: {
            'Authorization': `Bearer ${userAccessToken}`
          }
        }
      );
    } catch (error) {
      console.log('Expected error:', error.response.status, error.response.data.message);
    }

    // 7. Register admin directly (first admin can register without authentication)
    // Note: This might need to be adjusted based on your implementation
    console.log('\n📝 Registering admin directly...');
    try {
      const registerAdminResponse = await axios.post(
        `${API_URL}/users/register`,
        {
          ...testAdmin,
          role: 'ADMIN' // This might not work if your API validates roles
        }
      );
      printResponse('Register Admin Response', registerAdminResponse);
    } catch (error) {
      if (error.response && error.response.status === 400 &&
          error.response.data.message.includes('already exists')) {
        console.log('Admin already exists, proceeding with login...');
      } else {
        throw error;
      }
    }

    // 8. Login as admin
    console.log('\n🔑 Logging in as admin...');
    const adminLoginResponse = await axios.post(
      `${API_URL}/users/login`,
      {
        email: testAdmin.email,
        password: testAdmin.password
      }
    );
    printResponse('Admin Login Response', adminLoginResponse);

    adminAccessToken = adminLoginResponse.data.accessToken;
    adminId = adminLoginResponse.data.user.id;

    // 9. Get all users (admin only)
    console.log('\n👥 Getting all users (admin only)...');
    const allUsersResponse = await axios.get(
      `${API_URL}/users`,
      {
        headers: {
          'Authorization': `Bearer ${adminAccessToken}`
        }
      }
    );
    printResponse('All Users Response', allUsersResponse);

    // ======= Test Client User Creation =======
    console.log('\n🔶 Testing Client User Creation and Ratings 🔶');

    // 10. Create a client user first as a regular user
    console.log('\n📝 Creating a client user (initially as regular user)...');
    let clientUserId = '';
    try {
      const registerClientResponse = await axios.post(
        `${API_URL}/users/register`,
        clientUser
      );
      printResponse('Register Client Response', registerClientResponse);

      // Login as client to get the ID
      console.log('\n🔑 Logging in as client...');
      const clientLoginResponse = await axios.post(
        `${API_URL}/users/login`,
        {
          email: clientUser.email,
          password: clientUser.password
        }
      );
      printResponse('Client Login Response', clientLoginResponse);

      clientUserId = clientLoginResponse.data.user.id;

      // Update the user to be a CLIENT role using admin privileges
      if (clientUserId) {
        console.log('\n🔧 Updating user to CLIENT role using admin privileges...');
        try {
          const updateToClientResponse = await axios.patch(
            `${API_URL}/users/${clientUserId}`,
            {
              role: 'CLIENT',
              link: clientUser.link,
              currentPosition: clientUser.currentPosition,
              location: clientUser.location
            },
            {
              headers: {
                'Authorization': `Bearer ${adminAccessToken}`
              }
            }
          );
          printResponse('Update To Client Response', updateToClientResponse);
        } catch (error) {
          console.log('Error updating user to CLIENT role:', error.response?.data || error.message);
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 400 &&
          error.response.data.message.includes('already exists')) {
        console.log('Client already exists, trying to find through admin API...');

        // Try to find the client through the admin API
        const allUsers = allUsersResponse.data.data;
        const existingClient = allUsers.find(user =>
          user.email.toLowerCase() === clientUser.email.toLowerCase()
        );

        if (existingClient) {
          clientUserId = existingClient._id;
          console.log(`Found existing client user with ID: ${clientUserId}`);

          // Ensure it has CLIENT role
          if (existingClient.role !== 'CLIENT') {
            console.log('Updating to CLIENT role...');
            try {
              await axios.patch(
                `${API_URL}/users/${clientUserId}`,
                {
                  role: 'CLIENT',
                  link: clientUser.link,
                  currentPosition: clientUser.currentPosition,
                  location: clientUser.location
                },
                {
                  headers: {
                    'Authorization': `Bearer ${adminAccessToken}`
                  }
                }
              );
            } catch (updateError) {
              console.log('Error updating role:', updateError.response?.data || updateError.message);
            }
          }
        } else {
          console.log('Could not find client user, creating with admin API...');
          try {
            const createClientResponse = await axios.post(
              `${API_URL}/users`,
              {
                ...clientUser,
                role: 'CLIENT'
              },
              {
                headers: {
                  'Authorization': `Bearer ${adminAccessToken}`
                }
              }
            );
            clientUserId = createClientResponse.data.data._id;
            console.log(`Created client with ID: ${clientUserId}`);
          } catch (createError) {
            console.log('Error creating client:', createError.response?.data || createError.message);
          }
        }
      } else {
        console.log('Error registering client:', error.response?.data || error.message);
      }
    }

    // ======= Test User Rating =======
    if (clientUserId) {
      console.log('\n⭐ Testing user rating functionality...');

      // 12. Rate a client user
      console.log('\n📊 Rating a client user...');
      try {
        const rateUserResponse = await axios.post(
          `${API_URL}/ratings`,
          {
            userId: clientUserId,
            rating: 4,
            comment: 'Great service!'
          },
          {
            headers: {
              'Authorization': `Bearer ${userAccessToken}`
            }
          }
        );
        printResponse('Rate User Response', rateUserResponse);

        // 13. Get ratings for a user
        console.log('\n📊 Getting ratings for a client user...');
        const getUserRatingsResponse = await axios.get(
          `${API_URL}/ratings/${clientUserId}`,
          {
            headers: {
              'Authorization': `Bearer ${userAccessToken}`
            }
          }
        );
        printResponse('Get User Ratings Response', getUserRatingsResponse);
      } catch (error) {
        console.log('Error with ratings functionality:', error.response?.data || error.message);
      }
    }

    console.log('\n✅ Authentication tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
};

// Run tests
runTests();
