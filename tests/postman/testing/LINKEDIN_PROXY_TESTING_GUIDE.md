# LinkedIn Account and Proxy Management Testing Guide

This guide provides instructions on how to test the LinkedIn Account and Proxy Management features of the Chiratae LinkedIn Scraper backend application.

## Setup

1. **Environment Setup**
   - Import the Postman Environment file (`ChirataeScraper_Environment.postman_environment.json`)
   - Set the `baseUrl` variable (default is `http://localhost:4000`)
   - Make sure the backend server is running

2. **Collection Import**
   - Import the Postman Collection file (`ChirataeScraper_LinkedIn_Proxy_Tests.postman_collection.json`)
   - The collection contains all necessary requests organized into folders

## Authentication

Before testing the LinkedIn Account and Proxy Management endpoints, you need to authenticate as an admin:

1. **Login as Admin**
   - Use the request in the "Authentication" folder: "Login Admin"
   - The request will automatically save the admin token to the environment variable `adminToken`
   - If you haven't created an admin user yet, first create one using the Authentication collection

## Testing LinkedIn Account Management

Test the LinkedIn Account endpoints in the following order:

1. **Create LinkedIn Account**
   - Creates a new LinkedIn account in the system
   - The account ID is automatically saved to the `linkedinAccountId` environment variable
   - Note: The password is automatically encrypted in the database

2. **Get All LinkedIn Accounts**
   - Fetches all LinkedIn accounts (admin only)
   - Verify that your created account appears in the list

3. **Get LinkedIn Account by ID**
   - Fetches a specific LinkedIn account by ID
   - Uses the `linkedinAccountId` variable set during account creation

4. **Update LinkedIn Account**
   - Updates an existing LinkedIn account
   - Verify that fields are correctly updated

5. **Get Next Available LinkedIn Account**
   - Tests the account rotation functionality
   - Should return an available account for use

6. **Delete LinkedIn Account**
   - Deletes the LinkedIn account created earlier
   - Use this for cleanup after testing

## Testing Proxy Management

Test the Proxy endpoints in the following order:

1. **Create Proxy**
   - Creates a new proxy configuration in the system
   - The proxy ID is automatically saved to the `proxyId` environment variable
   - Note: If proxy authentication is provided, credentials are encrypted

2. **Get All Proxies**
   - Fetches all proxy configurations (admin only)
   - Verify that your created proxy appears in the list

3. **Get Proxy by ID**
   - Fetches a specific proxy by ID
   - Uses the `proxyId` variable set during proxy creation

4. **Update Proxy**
   - Updates an existing proxy configuration
   - Verify that fields are correctly updated

5. **Get Next Available Proxy**
   - Tests the proxy rotation functionality
   - Should return an available proxy for use

6. **Delete Proxy**
   - Deletes the proxy created earlier
   - Use this for cleanup after testing

## Automated Testing

For automated testing, you can use the included Node.js script:

```bash
node test-linkedin-proxy.js
```

This script will:

1. Authenticate as an admin
2. Test all LinkedIn Account endpoints in sequence
3. Test all Proxy endpoints in sequence
4. Clean up created resources

## Status Codes

When testing, expect these HTTP status codes:

- **200 OK**: Successful GET, PUT, or DELETE
- **201 Created**: Successful POST
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid auth token
- **403 Forbidden**: Valid token but insufficient permissions (non-admin)
- **404 Not Found**: Resource not found
- **500 Server Error**: Server-side error

## Common Testing Issues

1. **Authentication Errors**
   - Make sure your admin token is valid and not expired
   - Check that you're using the correct token variable in the Authorization header

2. **Port Conflicts**
   - If you receive connection errors, ensure the server is running and there are no port conflicts
   - The default port is 4000, but it can be configured in the .env file

3. **Validation Errors**
   - Proxy URLs must be valid (correct protocol, host, port)
   - LinkedIn usernames and emails should be properly formatted

4. **Encryption Issues**
   - If you're seeing encryption errors, check that the ENCRYPTION_KEY is properly set in the .env file
