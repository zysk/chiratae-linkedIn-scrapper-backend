# Testing Guide for Chiratae LinkedIn Scraper Backend

This document provides instructions for testing the LinkedIn Account and Proxy Management system implemented in the Chiratae LinkedIn Scraper backend.

## Prerequisites

1. Make sure the backend server is running on the correct port (default is 4000)
2. Make sure you have Postman installed

## Managing Port Conflicts

If you encounter port conflicts, you can use the provided scripts to change the port:

```bash
# Check if port 4000 is available
npm run port:check 4000

# Find the next available port
npm run port:find

# List status of common ports
npm run port:list

# Change the port in .env file
npm run change-port 4001

# Run the server on a specific port
npm run dev:port --port=4001

# Run the server on preset ports
npm run dev:4001  # Runs on port 4001
npm run dev:4002  # Runs on port 4002
```

## Postman Collections

We've created Postman collections to simplify testing. Two collections are available:

1. **Authentication Collection**: `postman/ChirataeScraper_Auth_Tests.postman_collection.json`
2. **LinkedIn & Proxy Tests Collection**: `postman/ChirataeScraper_LinkedIn_Proxy_Tests.postman_collection.json`

### Setting Up Postman

1. Import the environment file

    - File: `postman/ChirataeScraper_Environment.postman_environment.json`
    - This sets up variables needed for testing

2. Import the collections

    - Authentication: `postman/ChirataeScraper_Auth_Tests.postman_collection.json`
    - LinkedIn & Proxy: `postman/ChirataeScraper_LinkedIn_Proxy_Tests.postman_collection.json`

3. Verify the `baseUrl` environment variable is set correctly
    - Default: `http://localhost:4001`
    - Update this if your server is running on a different port

## Testing Flow

### Step 1: Test Authentication

Before testing the LinkedIn Account and Proxy endpoints, you need to authenticate.

1. In the Authentication collection, run the "Login Admin" request
    - This will save the admin token to the environment variable `adminToken`
    - Without this token, you won't be able to access the protected endpoints

### Step 2: Test LinkedIn Account Endpoints

Run these requests in order from the LinkedIn Accounts folder:

1. **Create LinkedIn Account**

    - Creates a new LinkedIn account with encrypted password
    - Saves the account ID to `linkedinAccountId` environment variable

2. **Get All LinkedIn Accounts**

    - Retrieves all LinkedIn accounts
    - Verifies that the created account appears in the list

3. **Get LinkedIn Account by ID**

    - Retrieves a specific account using the ID from previous request

4. **Update LinkedIn Account**

    - Updates the account details
    - Verifies that fields are correctly updated

5. **Get Next Available LinkedIn Account**

    - Tests the account rotation functionality

6. **Delete LinkedIn Account**
    - Deletes the test account

### Step 3: Test Proxy Endpoints

Run these requests in order from the Proxies folder:

1. **Create Proxy**

    - Creates a new proxy with encrypted credentials
    - Saves the proxy ID to `proxyId` environment variable

2. **Get All Proxies**

    - Retrieves all proxies
    - Verifies that the created proxy appears in the list

3. **Get Proxy by ID**

    - Retrieves a specific proxy using the ID from previous request

4. **Update Proxy**

    - Updates the proxy details
    - Verifies that fields are correctly updated

5. **Get Next Available Proxy**

    - Tests the proxy rotation functionality

6. **Delete Proxy**
    - Deletes the test proxy

## Automated Testing with Node.js

For automated testing, you can use the included test script:

```bash
node test-linkedin-proxy.js
```

This script runs through the same testing flow described above but in an automated manner.

## Potential Issues and Solutions

### Port Conflicts

If the server fails to start due to port conflicts, use the port management scripts:

```bash
npm run port:find
```

### Authentication Errors

If you receive 401 Unauthorized errors:

- Make sure you've run the "Login Admin" request first
- Check that the admin token is correctly set in the environment
- Verify that the token hasn't expired (tokens expire after 1 hour by default)

### Test Data Cleanup

The tests create and delete test data. If a test fails midway, you might need to manually clean up:

- Re-run the Delete requests for any created resources
- Or restart the server (this clears in-memory test data)

## API Status Codes

- **200 OK**: Successful GET, PUT, or DELETE
- **201 Created**: Successful POST (resource created)
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid auth token
- **403 Forbidden**: Valid token but insufficient permissions (non-admin)
- **404 Not Found**: Resource not found
- **500 Server Error**: Server-side error
