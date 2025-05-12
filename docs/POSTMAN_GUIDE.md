# Postman Testing Guide

This guide provides instructions for using the Postman collections to test the Chiratae LinkedIn Scraper backend API.

## Prerequisites

1. Install [Postman](https://www.postman.com/downloads/) on your machine
2. Ensure the backend server is running (default: http://localhost:4001)
3. Import the Postman collections and environment

## Importing the Collections and Environment

1. Open Postman
2. Click on **Import** button in the top left
3. Choose **Upload Files** and select the following files from the `postman` directory:
    - `ChirataeScraper_Auth_Tests.postman_collection.json`
    - `ChirataeScraper_LinkedIn_Proxy_Tests.postman_collection.json`
    - `ChirataeScraper_Environment.postman_environment.json`
4. Click **Import**

## Setting Up Environment

1. In Postman, click on the **Environments** tab in the left sidebar
2. Select the imported environment called **Chiratae LinkedIn Scraper Environment**
3. Make sure the `baseUrl` is set to your server URL (default: http://localhost:4001)
4. Click **Save**
5. Select this environment from the environment dropdown in the top right

## Running Authentication Tests

1. In the **Collections** tab, open the **Chiratae LinkedIn Scraper - Auth Tests** collection
2. Expand the **Authentication** folder
3. First run the **Register Admin** request (if an admin doesn't exist yet)
4. Then run the **Login Admin** request to authenticate
    - This will automatically set the `adminAccessToken` and `adminRefreshToken` variables
5. Test other endpoints in the collection that require authentication

## Running LinkedIn Account and Proxy Tests

1. In the **Collections** tab, open the **Chiratae LinkedIn Scraper - LinkedIn & Proxy Tests** collection
2. Expand the **Authentication** folder and run the **Login Admin** request first
    - This will set the necessary access token for subsequent requests
3. Expand the **LinkedIn Accounts** folder to test LinkedIn account endpoints
4. Expand the **Proxies** folder to test proxy endpoints

## Using Test Scripts

The requests in these collections have pre-configured test scripts that:

1. Automatically extract and store tokens from authentication responses
2. Validate response status codes and formats
3. Store IDs from created resources for subsequent requests
4. Clean up resources after testing

## Alternative: Running the Automated Test Script

Instead of manually testing with Postman, you can run the automated test script:

```bash
npm run test:linkedin-proxy
```

This script will:

1. Authenticate as admin
2. Test all LinkedIn account endpoints
3. Test all proxy endpoints
4. Clean up created resources

## Troubleshooting

If you encounter issues:

1. **Port conflicts**: Use the port management scripts

    ```bash
    npm run port:check 4000  # Check if port 4000 is available
    npm run port:find        # Find the next available port
    npm run dev:4001         # Run server on port 4001
    ```

2. **Authentication errors**: Verify admin user exists

    ```bash
    node scripts/check-users.js
    node scripts/create-admin-user.js
    ```

3. **Response format issues**: Check the API response format in the [API_ENDPOINTS.md](API_ENDPOINTS.md) document
