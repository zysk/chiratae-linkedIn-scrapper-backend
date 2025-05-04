# Authentication System Testing Guide

This guide provides step-by-step instructions for testing the Chiratae LinkedIn Scraper Authentication System (Task #2) using Postman.

## Prerequisites

1. MongoDB should be running (default port 27017)
2. Redis should be running (if your implementation uses it)
3. The backend server should be running on port 4000
4. Postman should be installed on your system

## Setup Instructions

1. **Import Postman Collection and Environment:**
   - Open Postman
   - Click "Import" button
   - Select and import the following files:
     - `ChirataeScraper_Auth_Tests.postman_collection.json`
     - `ChirataeScraper_Environment.postman_environment.json`

2. **Select the Environment:**
   - From the environment dropdown in the top-right of Postman, select "Chiratae LinkedIn Scraper Environment"

## Testing Workflow

Follow this sequence to thoroughly test the authentication system:

### 1. User Registration and Authentication

1. **Register User:**
   - Open "Register User" request in the Authentication folder
   - Review the request body (you can modify details if needed)
   - Send the request
   - Verify you get a 201 status code and success message

2. **Login User:**
   - Open "Login User" request
   - Ensure email and password match what you used in registration
   - Send the request
   - Verify you get a 200 status code, tokens, and user details
   - Note: This request automatically saves the tokens to environment variables

3. **Get Current User:**
   - Open "Get Current User" request in the User Management folder
   - Send the request
   - Verify your user details are returned
   - This confirms your authentication token is working

4. **Update Current User:**
   - Open "Update Current User" request
   - Modify the request body if desired
   - Send the request
   - Verify your changes were applied

5. **Refresh Token:**
   - Open "Refresh Token" request
   - Send the request
   - Verify you receive new tokens
   - Note: This request automatically updates your token variables

### 2. Admin User Tests

1. **First, try to create an admin without privileges:**
   - Open "Register Admin" request
   - Send the request
   - Verify you get a 403 error (forbidden)

2. **Create an admin user directly in MongoDB:**
   - You need to manually create an admin user in the database
   - Or modify an existing user's role to ADMIN

3. **Login as Admin:**
   - Open "Login Admin" request
   - Update credentials to match your admin user
   - Send the request
   - Verify you get tokens and admin details

4. **Test Admin Features:**
   - Use "Get All Users (Admin)" request
   - Try "Get User by ID (Admin)" (update the userId variable first)
   - Test "Update User (Admin)" and "Delete User (Admin)"

### 3. User Rating Tests

1. **Create a CLIENT user:**
   - Either modify a user's role to CLIENT in the database
   - Or create a new user with the CLIENT role

2. **Add the CLIENT user ID to environment:**
   - In Postman, click on the Environment quick look (eye icon)
   - Add the CLIENT user's ID to the clientUserId variable

3. **Rate User:**
   - Open "Rate User" request in the User Ratings folder
   - Send the request
   - Verify you get a 200 status code and success message

4. **Get User Ratings:**
   - Open "Get User Ratings" request
   - Send the request
   - Verify you get a list of ratings including your submitted rating

## Security Testing

1. **Test with invalid/missing tokens:**
   - Remove the Authorization header from a protected request
   - Verify you get a 401 status code

2. **Test with expired tokens:**
   - Wait for the access token to expire (1 day)
   - Try a protected request
   - Verify you get an appropriate error
   - Use the refresh token to get new tokens

3. **Role-based authorization:**
   - As a regular user, try accessing admin-only endpoints
   - Verify you get a 403 error (forbidden)

## Troubleshooting

- **Connection refused errors:** Ensure the server is running on port 4000
- **Authentication failures:** Check that tokens are being properly saved to environment variables
- **Database errors:** Make sure MongoDB is running and accessible

## Additional Notes

- JWT tokens expire after 1 day (access token) and 7 days (refresh token)
- Passwords are hashed using bcrypt before storage
- The system supports three main roles: USER, ADMIN, and CLIENT
- Only CLIENT users can be rated