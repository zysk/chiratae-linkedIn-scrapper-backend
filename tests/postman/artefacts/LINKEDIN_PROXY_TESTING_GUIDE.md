# LinkedIn Account and Proxy Testing Guide

This guide provides instructions for testing the LinkedIn Account and Proxy Management system.

## Prerequisites

- API server running (default: http://localhost:4000)
- MongoDB running (default: localhost:27017)
- Admin user credentials available

## Test Script Usage

The `test-linkedin-proxy.js` script provides a comprehensive test of all LinkedIn account and proxy management endpoints. To run it:

```bash
cd tests/test-scripts
node test-linkedin-proxy.js
```

The script will:
1. Authenticate as an admin user
2. Test all LinkedIn account endpoints
3. Test all proxy endpoints
4. Clean up created resources (optional)

## Manual Testing with Postman

### LinkedIn Account Tests

1. **Create LinkedIn Account**
   - Endpoint: `POST /api/linkedin-accounts`
   - Requires admin token in Authorization header
   - Required fields:
     ```json
     {
       "username": "linkedin_test",
       "password": "securePassword123",
       "email": "linkedin_test@example.com",
       "description": "Test LinkedIn account"
     }
     ```
   - Save the returned ID for subsequent requests

2. **Get All LinkedIn Accounts**
   - Endpoint: `GET /api/linkedin-accounts`
   - Requires admin token
   - Verify the account created in step 1 is in the list

3. **Get LinkedIn Account by ID**
   - Endpoint: `GET /api/linkedin-accounts/{accountId}`
   - Use the ID saved from step 1
   - Verify the account details match what was created

4. **Update LinkedIn Account**
   - Endpoint: `PUT /api/linkedin-accounts/{accountId}`
   - Update fields:
     ```json
     {
       "username": "linkedin_test_updated",
       "password": "newSecurePassword456",
       "email": "linkedin_updated@example.com",
       "description": "Updated test LinkedIn account",
       "isActive": true
     }
     ```
   - Verify the account was updated

5. **Get Next Available Account**
   - Endpoint: `GET /api/linkedin-accounts/next/available`
   - Verify an available account is returned
   - Note: Requires at least one active account in the database

6. **Delete LinkedIn Account**
   - Endpoint: `DELETE /api/linkedin-accounts/{accountId}`
   - Verify the account is deleted

### Proxy Tests

1. **Create Proxy**
   - Endpoint: `POST /api/proxies`
   - Requires admin token
   - Required fields:
     ```json
     {
       "host": "192.168.1.100",
       "port": 8080,
       "username": "proxyuser",
       "password": "proxypass",
       "protocol": "http",
       "description": "Test proxy server"
     }
     ```
   - Save the returned ID for subsequent requests

2. **Get All Proxies**
   - Endpoint: `GET /api/proxies`
   - Requires admin token
   - Verify the proxy created in step 1 is in the list

3. **Get Proxy by ID**
   - Endpoint: `GET /api/proxies/{proxyId}`
   - Use the ID saved from step 1
   - Verify the proxy details match what was created

4. **Update Proxy**
   - Endpoint: `PUT /api/proxies/{proxyId}`
   - Update fields:
     ```json
     {
       "host": "192.168.1.101",
       "port": 8081,
       "username": "proxyuser_updated",
       "password": "proxypass_updated",
       "protocol": "https",
       "description": "Updated test proxy server",
       "isActive": true
     }
     ```
   - Verify the proxy was updated

5. **Get Next Available Proxy**
   - Endpoint: `GET /api/proxies/next/available`
   - Verify an available proxy is returned
   - Note: Requires at least one active proxy in the database

6. **Delete Proxy**
   - Endpoint: `DELETE /api/proxies/{proxyId}`
   - Verify the proxy is deleted

## Error Handling Tests

1. **Create with Missing Fields**
   - Try creating a LinkedIn account or proxy without required fields
   - Verify appropriate 400 error is returned

2. **Create with Duplicate Data**
   - Try creating a LinkedIn account with an existing username
   - Try creating a proxy with an existing host/port combination
   - Verify appropriate 400 error is returned

3. **Access with Non-Admin User**
   - Try accessing endpoints with a regular user token
   - Verify appropriate 403 error is returned

## Validation Tests

Verify that input validation works correctly:

1. **Invalid Email Format**
   - Try creating a LinkedIn account with an invalid email
   - Verify appropriate validation error is returned

2. **Invalid Port Number**
   - Try creating a proxy with an invalid port number (e.g., -1 or 70000)
   - Verify appropriate validation error is returned

3. **Invalid Protocol**
   - Try creating a proxy with an invalid protocol
   - Verify appropriate validation error is returned
