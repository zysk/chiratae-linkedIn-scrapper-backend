# Chiratae LinkedIn Scraper - Authentication Testing

This directory contains Postman files for testing the Authentication System (Task #2) implemented in the Chiratae LinkedIn Scraper backend.

## Files Included

1. `ChirataeScraper_Auth_Tests.postman_collection.json` - A Postman collection containing all authentication and user management API tests
2. `ChirataeScraper_Environment.postman_environment.json` - Environment variables for the test collection

## Setup Instructions

1. Make sure MongoDB is running (the application uses the default MongoDB port 27017)
2. Start the backend application in development mode: `npm run dev`
3. Import the collection and environment files into Postman:
   - Open Postman
   - Click "Import" button
   - Select the collection and environment JSON files from this directory
   - Import both files

## Testing Flow

The tests are designed to be run in a specific sequence to test the complete authentication flow:

### Authentication Flow
1. **Register User**: Create a normal user account
2. **Login User**: Log in with the created user and capture the access/refresh tokens
3. **Register Admin**: Create an admin account (only succeeds if run by an admin)
4. **Login Admin**: Log in with admin credentials
5. **Refresh Token**: Get new tokens using the refresh token

### User Management Flow
1. **Get Current User**: Retrieve the authenticated user's profile
2. **Update Current User**: Modify the user's profile information
3. **Get All Users (Admin)**: List all users (admin only)
4. **Get User by ID (Admin)**: Retrieve a specific user by ID
5. **Update User (Admin)**: Modify a user's profile as admin
6. **Delete User (Admin)**: Remove a user from the system

### User Ratings Flow
1. **Rate User**: Submit a rating for a CLIENT user
2. **Get User Ratings**: Retrieve all ratings for a specific user

## Environment Variables

The collection uses these environment variables:
- `baseUrl`: API base URL (default: http://localhost:3000)
- `accessToken`: User JWT access token (automatically set after login)
- `refreshToken`: User JWT refresh token
- `adminAccessToken`: Admin JWT access token
- `adminRefreshToken`: Admin JWT refresh token
- `userId`: ID of a regular user to test with
- `clientUserId`: ID of a CLIENT user to test ratings

## Testing Tips

1. Before running the collection, ensure the environment is active (select from the environment dropdown in Postman)
2. Run the Register User test first to create a test account
3. The Login endpoints have scripts that automatically save tokens to environment variables
4. After creating users, copy their IDs from the response and set them in the environment variables
5. For rating tests, you'll need to manually create a CLIENT user or update an existing user's role to CLIENT

## Security Testing

To test authentication security:
1. Try accessing protected endpoints without a token
2. Try accessing admin-only endpoints with a regular user token
3. Use an expired or invalid token to verify proper error handling
4. Test the refresh token flow when access tokens expire

## Expected Results

- All user operations should return appropriate HTTP status codes:
  - 200: Successful operations
  - 201: Successful creation
  - 400: Invalid request data
  - 401: Authentication failure
  - 403: Authorization failure
  - 404: Resource not found
- Tokens should be properly validated and refreshed
- User data should be persistently stored in MongoDB
- Password should never be returned in responses
- User ratings should update properly and affect the user's rating field
