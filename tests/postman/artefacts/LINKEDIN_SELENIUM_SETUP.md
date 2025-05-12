# LinkedIn Selenium Integration Setup & Usage Guide

This guide details how to set up and use the LinkedIn Selenium integration components of the LinkedIn Scraper backend.

## Prerequisites

1. **Chrome Browser**: A recent version of Google Chrome must be installed on your system.
2. **ChromeDriver**: The appropriate ChromeDriver version for your Chrome browser must be available in the `chromedriver` directory, organized by platform:
    - Windows: `chromedriver/chromedriver-win64/chromedriver.exe`
    - macOS: `chromedriver/chromedriver-mac`
    - Linux: `chromedriver/chromedriver-linux64/chromedriver-linux`
3. **Node.js**: Node.js 14+ is required to run the application.
4. **MongoDB**: A MongoDB instance for storing accounts, proxies, and session data.
5. **LinkedIn Account**: Valid LinkedIn account(s) for testing and scraping.
6. **Proxies (Optional)**: HTTP/HTTPS proxies to rotate IP addresses during scraping.

## Setup Instructions

### 1. Configure MongoDB

Ensure MongoDB is running and accessible. Set the connection string in your `.env` file:

```
MONGOURI=mongodb://root:Root123@localhost:27017/linkedin-scrapper?authSource=admin
```

### 2. Setup LinkedIn Accounts

LinkedIn accounts can be added through the API or directly in the database. Each account requires:

- Username (email)
- Encrypted password (MD5 hashed for basic security)
- Active status

Example API request to create an account:

```json
POST /api/linkedin-accounts
{
  "username": "linkedin_email@example.com",
  "password": "yourlinkedinpassword",
  "isActive": true
}
```

### 3. Setup Proxies (Optional)

Proxies can be added through the API or directly in the database. Each proxy requires:

- Host
- Port
- Protocol (http/https)
- Username and password (if authenticated)

Example API request to create a proxy:

```json
POST /api/proxies
{
  "host": "192.168.1.1",
  "port": 8080,
  "protocol": "http",
  "username": "proxyuser",
  "password": "proxypass",
  "isActive": true
}
```

### 4. Configure the Application

Set additional configuration in your `.env` file:

```
PORT=4000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

## Usage Guide

### 1. Testing LinkedIn Account Login

The `test-login` endpoint allows you to verify that a LinkedIn account works properly:

```json
POST /api/linkedin/test-login
{
  "linkedinAccountId": "6817988752833f5312c2bfc4",
  "password": "your_linkedin_password",
  "proxyId": "681798b552833f5312c2bfd9"  // Optional
}
```

This will:

1. Initialize the WebDriver with optional proxy
2. Attempt to log in to LinkedIn
3. Verify that login was successful
4. Clean up by quitting the WebDriver

### 2. Searching LinkedIn Profiles

The `search` endpoint allows you to search for LinkedIn profiles with filters:

```json
POST /api/linkedin/search
{
  "linkedinAccountId": "6817988752833f5312c2bfc4",
  "password": "your_linkedin_password",
  "proxyId": "681798b552833f5312c2bfd9",  // Optional
  "keywords": "Software Engineer",
  "filters": {
    "location": "United States",
    "company": "Google",
    "connectionDegree": "2nd"
  },
  "maxResults": 20
}
```

This will:

1. Initialize the WebDriver with optional proxy
2. Log in to LinkedIn
3. Perform the search with specified filters
4. Extract profile data from the results
5. Clean up by quitting the WebDriver

### 3. Account and Proxy Management

The API provides endpoints to automatically get the next available LinkedIn account or proxy:

- `GET /api/linkedin/accounts/next` - Returns the least recently used LinkedIn account
- `GET /api/linkedin/proxies/next` - Returns the least recently used proxy

These endpoints automatically track usage and update the `lastUsed` timestamp and `usageCount` fields.

## Error Handling

The LinkedIn Selenium integration handles several common error scenarios:

1. **Login Failures**: Detects failed login attempts, invalid credentials, or account verification requirements
2. **CAPTCHA Detection**: Identifies when LinkedIn presents a CAPTCHA challenge
3. **Session Management**: Handles expired sessions and re-login requirements
4. **WebDriver Errors**: Manages browser crashes and selenium errors
5. **Proxy Failures**: Detects and reports proxy connection issues

All errors are properly logged with the Winston logger to facilitate debugging.

## Best Practices

1. **Rate Limiting**: Implement delays between requests to avoid rate limiting or detection
2. **Proxy Rotation**: Regularly rotate proxies to prevent IP blocking
3. **Account Rotation**: Use multiple LinkedIn accounts to distribute activity
4. **Headless Mode**: Use headless browser mode in production for better performance

## Security Considerations

1. **Password Security**: LinkedIn account passwords should be stored securely and not exposed in logs
2. **API Authentication**: All endpoints require proper authentication
3. **Usage Monitoring**: Track and monitor usage patterns to detect abuse or account issues

## Troubleshooting

### Common Issues:

1. **WebDriver Path Issues**:

    - Ensure chromedriver is in the correct path for your platform
    - Check that chromedriver version matches your Chrome browser version

2. **Proxy Authentication**:

    - Verify proxy credentials are correct
    - Check that proxy is reachable and operational

3. **LinkedIn Rate Limiting**:

    - If seeing frequent login challenges, implement longer delays
    - Rotate accounts and proxies more frequently

4. **CAPTCHA Challenges**:
    - Implement CAPTCHA handling or manual intervention
    - Consider using more aged LinkedIn accounts to reduce CAPTCHA frequency

## Additional Resources

- [Selenium Documentation](https://www.selenium.dev/documentation/)
- [ChromeDriver Downloads](https://chromedriver.chromium.org/downloads)
- [LinkedIn Developer Guidelines](https://www.linkedin.com/legal/user-agreement)
