# LinkedIn Selenium Integration Setup & Usage Guide

This guide details how to set up and use the LinkedIn Selenium integration components of the LinkedIn Scraper backend.

## Prerequisites

1. **Chrome Browser**: A recent version of Google Chrome must be installed on your system.
2. **ChromeDriver**: The appropriate ChromeDriver version for your Chrome browser must be available.
3. **Node.js**: Node.js 14+ is required to run the application.
4. **MongoDB**: A MongoDB instance for storing accounts, proxies, and session data.
5. **LinkedIn Account**: Valid LinkedIn account(s) for testing and scraping.

## Setup Instructions

### 1. ChromeDriver Setup

The application automatically selects the appropriate ChromeDriver based on your platform:

- **Windows**: `drivers/chromedriver.exe`
- **macOS**: `drivers/chromedriver-mac`
- **Linux**: `drivers/chromedriver-linux`

Ensure you have the correct ChromeDriver for your platform and Chrome version in the `drivers` directory.

You can download ChromeDriver from: https://chromedriver.chromium.org/downloads

### 2. LinkedIn Account Setup

LinkedIn accounts need to be added to the database before they can be used for scraping. You can add accounts through the API:

```
POST /api/linkedin-accounts
{
  "username": "your.email@example.com",
  "password": "your-password",
  "name": "Account Name",
  "status": "active"
}
```

### 3. Proxy Setup (Optional)

For improved anonymity and to reduce the chance of being blocked, you can use proxies. Add proxies through the API:

```
POST /api/proxies
{
  "host": "proxy.example.com",
  "port": 8080,
  "protocol": "http",
  "username": "proxyuser",
  "password": "proxypass",
  "status": "active"
}
```

## Component Overview

### 1. SeleniumService

The `SeleniumService` is responsible for creating and managing WebDriver instances:

- Platform detection for appropriate ChromeDriver selection
- Proxy integration
- Headless browser configuration
- Resource management (closing browsers when done)

Usage example:

```typescript
import seleniumService from '../services/selenium/SeleniumService';

// Create a WebDriver instance with a proxy
const driver = await seleniumService.createDriver({
  headless: false,
  proxy: {
    host: 'proxy.example.com',
    port: 8080
  }
});

// After operations are complete, quit the driver
await seleniumService.quitDriver(driver);
```

### 2. LinkedInAuthService

The `LinkedInAuthService` handles LinkedIn authentication:

- Login with username/password
- CAPTCHA detection and handling
- OTP verification flow
- Phone verification handling
- Login status checking

Usage example:

```typescript
import linkedInAuthService from '../services/linkedin/LinkedInAuthService';

// Login to LinkedIn
const loginResult = await linkedInAuthService.login(driver, {
  username: 'your.email@example.com',
  password: 'your-password'
});

// Handle different login outcomes
if (loginResult.status === 'captcha_required') {
  console.log('CAPTCHA needs to be solved:', loginResult.captchaUrl);
} else if (loginResult.status === 'otp_required') {
  console.log('OTP verification needed');
} else if (loginResult.status === 'success') {
  console.log('Login successful');
}
```

### 3. LinkedInSearchService

The `LinkedInSearchService` provides functionality for searching LinkedIn profiles:

- Building search URLs with parameters
- Applying various filters (location, company, job title, etc.)
- Extracting profile data from search results
- Pagination through search results

Usage example:

```typescript
import linkedInSearchService from '../services/linkedin/LinkedInSearchService';

// Search for profiles
const searchResults = await linkedInSearchService.search(driver, {
  keywords: 'Software Engineer',
  filters: {
    locations: ['United States'],
    companies: ['Google'],
    jobTitles: ['Software Engineer'],
    connectionDegree: ['2nd']
  },
  maxResults: 50
});

console.log(`Found ${searchResults.length} profiles`);
```

## API Endpoints

### 1. Test LinkedIn Login

Tests a LinkedIn account login using Selenium.

**Endpoint:** `POST /api/linkedin/test-login`

**Request Body:**
```json
{
  "accountId": "60f1b2c3d4e5f6a7b8c9d0e1",
  "password": "your-password",
  "proxyId": "60f1b2c3d4e5f6a7b8c9d0e2"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully logged in to LinkedIn",
  "data": {
    "account": {
      "id": "60f1b2c3d4e5f6a7b8c9d0e1",
      "username": "your.email@example.com"
    },
    "loginStatus": "success"
  }
}
```

### 2. Search LinkedIn Profiles

Searches for LinkedIn profiles based on the provided parameters.

**Endpoint:** `POST /api/linkedin/search`

**Request Body:**
```json
{
  "accountId": "60f1b2c3d4e5f6a7b8c9d0e1",
  "password": "your-password",
  "proxyId": "60f1b2c3d4e5f6a7b8c9d0e2",
  "keywords": "Software Engineer",
  "filters": {
    "locations": ["United States"],
    "companies": ["Google"],
    "jobTitles": ["Software Engineer"],
    "connectionDegree": ["2nd"],
    "pastCompanies": ["Microsoft"]
  },
  "maxResults": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully searched LinkedIn profiles",
  "data": {
    "results": [
      {
        "profileId": "john-doe-123456",
        "profileUrl": "https://www.linkedin.com/in/john-doe-123456/",
        "name": "John Doe",
        "headline": "Software Engineer at Google",
        "location": "San Francisco, CA",
        "currentCompany": "Google",
        "connectionDegree": "2nd",
        "imageUrl": "https://media.linkedin.com/...",
        "isOpenToWork": false
      },
      // ... more profiles
    ],
    "count": 10
  }
}
```

### 3. Get Next Available LinkedIn Account

Returns the next available LinkedIn account based on usage.

**Endpoint:** `GET /api/linkedin/accounts/next`

**Response:**
```json
{
  "success": true,
  "message": "Successfully retrieved next available account",
  "data": {
    "id": "60f1b2c3d4e5f6a7b8c9d0e1",
    "username": "your.email@example.com",
    "name": "Account Name",
    "status": "active",
    "lastUsed": "2023-07-01T12:00:00.000Z",
    "usageCount": 5
  }
}
```

### 4. Get Next Available Proxy

Returns the next available proxy based on usage.

**Endpoint:** `GET /api/linkedin/proxies/next`

**Response:**
```json
{
  "success": true,
  "message": "Successfully retrieved next available proxy",
  "data": {
    "id": "60f1b2c3d4e5f6a7b8c9d0e2",
    "host": "proxy.example.com",
    "port": 8080,
    "protocol": "http",
    "status": "active",
    "lastUsed": "2023-07-01T12:00:00.000Z",
    "usageCount": 3
  }
}
```

## Troubleshooting

### Common Issues

1. **ChromeDriver Version Mismatch**:
   - Error: "ChromeDriver version mismatch"
   - Solution: Update ChromeDriver to match your Chrome browser version

2. **LinkedIn Login Failures**:
   - Problem: Frequent login failures or CAPTCHA challenges
   - Solution: Use proxies, rotate accounts, and implement delays between requests

3. **Proxy Connection Issues**:
   - Problem: Cannot connect to proxy
   - Solution: Verify proxy details, ensure proxy is operational, check authentication

4. **Session Management**:
   - Problem: Sessions not being properly maintained
   - Solution: Ensure WebDriver instances are properly closed after use

## Best Practices

1. **Mimic Human Behavior**:
   - Use random delays between actions
   - Don't scrape too many profiles at once
   - Vary your search patterns

2. **Resource Management**:
   - Always close WebDriver instances when done
   - Monitor memory usage if running many parallel instances

3. **Account Rotation**:
   - Use multiple LinkedIn accounts
   - Limit usage per account per day
   - Monitor for account restrictions

4. **Proxy Usage**:
   - Use high-quality proxies
   - Rotate proxies regularly
   - Associate specific proxies with specific accounts

5. **Error Handling**:
   - Implement robust error handling for Selenium operations
   - Have fallback mechanisms for failed operations
   - Log and monitor errors to identify patterns

## Additional Resources

- [Selenium Documentation](https://www.selenium.dev/documentation/)
- [ChromeDriver Downloads](https://chromedriver.chromium.org/downloads)
- [LinkedIn Developer Guidelines](https://www.linkedin.com/legal/user-agreement)
