# Chiratae LinkedIn Scraper API - Postman Collection

This directory contains Postman collection and environment files for testing the Chiratae LinkedIn Scraper API.

## Contents

- `collections/chiratae-linkedin-scraper-api.json`: The original Postman collection file
- `collections/chiratae-linkedin-scraper-api-updated.json`: Updated collection with all routes and real data
- `environments/chiratae-linkedin-scraper-environment.json`: Original environment variables
- `environments/chiratae-linkedin-scraper-environment-updated.json`: Updated environment with real IDs
- `SUMMARY.md`: Detailed analysis of the project and API structure

## Setup Instructions

1. Install [Postman](https://www.postman.com/downloads/) if you haven't already.
2. Import the updated collection file:
    - Open Postman
    - Click on "Import" button
    - Upload or paste the contents of `collections/chiratae-linkedin-scraper-api-updated.json`
3. Import the updated environment file:
    - Click on "Import" button again
    - Upload or paste the contents of `environments/chiratae-linkedin-scraper-environment-updated.json`
4. Select the imported environment from the environment dropdown (top right corner)
5. Make sure the API server is running (defaults to `http://localhost:4001` as per .env file)
6. Update the `baseUrl` environment variable if your server is running on a different port

## API Server Setup

If you need to start the API server locally:

1. Make sure MongoDB and Redis are running on your system
2. Create a `.env` file in the project root with the following variables (or use the existing one):
    ```
    PORT=4001
    MONGOURI=mongodb://root:Root123@localhost:27017/linkedin-scrapper?authSource=admin
    JWT_ACCESS_TOKEN_SECRET=dev_jwt_secret_replace_in_production
    JWT_REFRESH_TOKEN_SECRET=dev_jwt_refresh_secret_replace_in_production
    REDIS_URL=redis://localhost:6379
    ```
3. Install dependencies with `npm install`
4. Start the server with `npm run dev`

## Using the Collection

### Authentication Flow

1. Start by registering a user with the "Register User" request
2. Log in with the "Login" request - this will automatically set the `authToken` variable
3. For admin operations, you'll need to either:
    - Register an admin (if you already have an admin token)
    - Log in as an admin using "Login Admin" if you already have admin credentials

### Testing with Real Data

The updated collection includes real MongoDB document IDs from the database:

- User ID: `68173b931d602f7d1ffee3f4`
- Campaign ID: `6817f89fd348dacbe14b0782`
- LinkedIn Account ID: `6818bff2b7e52b5311125963`
- Proxy ID: `681bffb42016c9d82a043a47`
- Lead ID: `681b588c35c35f8951591118`

These IDs are pre-populated in the environment variables and in the request URLs and bodies for easier testing.

### Additional Endpoints

The updated collection includes several endpoints that were missing from the original:

1. **User Ratings API**: Rate users and retrieve ratings
2. **LinkedIn API**: Direct LinkedIn interaction (test login, search, etc.)
3. **Utils API**: System maintenance operations like screenshot cleanup
4. **Updated Lead API**: More complete lead management endpoints including comment operations

## Testing Sequence

For a complete test, follow this recommended sequence:

1. Register and log in a user
2. Create a LinkedIn account (or use the existing one with ID: `6818bff2b7e52b5311125963`)
3. Create a proxy (or use the existing one with ID: `681bffb42016c9d82a043a47`)
4. Create a campaign (or use the existing one with ID: `6817f89fd348dacbe14b0782`)
5. Queue the campaign for execution
6. Test the LinkedIn search and scraping endpoints
7. Check campaign results
8. Test lead management endpoints

## Troubleshooting

- If you get 401 Unauthorized errors, your token may have expired - use the login endpoint to get a new token
- If campaign creation fails, check that you have properly set up LinkedIn account and proxy
- If MongoDB or Redis connection issues occur, verify they're running and properly configured
- The API server logs can provide additional details about any errors

## MongoDB Schema

The API uses the following main collections:

- `users`: User authentication and profile data
- `campaigns`: LinkedIn search campaigns
- `leads`: Scraped LinkedIn profiles linked to campaigns
- `linkedinaccounts`: LinkedIn credential management
- `proxies`: Proxy server configurations
- `userratings`: User performance ratings

## Notes

- The collection includes test scripts that automatically set environment variables
- Some endpoints require specific roles (admin)
- Most PUT/POST requests include example payloads based on real data from the MongoDB database
- If you're developing the API, you can use this collection to test your changes
