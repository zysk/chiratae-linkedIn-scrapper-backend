# LinkedIn Scraper Backend

This backend service provides APIs for LinkedIn profile scraping, authentication, and selector management.

## Features

- LinkedIn profile search and scraping
- LinkedIn account management
- Proxy management
- Campaign management
- Selector verification and management system
- Background job processing

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/linkedin-scraper
   JWT_SECRET=your_jwt_secret
   REDIS_URL=redis://localhost:6379
   ENCRYPTION_KEY=your_encryption_key_32_chars
   ```

3. Install Chrome and ChromeDriver (compatible versions)

4. Start the server:
   ```
   npm run dev
   ```

## Selector Management System

LinkedIn's DOM structure changes frequently, causing selectors to break. The Selector Management System helps maintain working selectors by:

1. **Verifying** current selectors against real profiles
2. **Identifying** which selectors are failing
3. **Updating** failing selectors with working alternatives
4. **Centralizing** selector management in one place

### How It Works

The system follows this process:

1. **Verification**: Tests all selectors against a LinkedIn profile, recording success/failure metrics
2. **Analysis**: Reviews which selectors are working and which need updates
3. **Update**: Replaces poor-performing selectors with better alternatives

### Using the Selector Management System

#### Via API Endpoints

Two main endpoints are available:

1. **Verify Selectors**: `/api/linkedin/selectors/verify`
   ```
   POST /api/linkedin/selectors/verify
   {
     "profileUrl": "https://www.linkedin.com/in/username",
     "linkedinAccountId": "account_id",
     "password": "password",
     "outputPath": "optional/path/to/output.json"
   }
   ```

2. **Update Selectors**: `/api/linkedin/selectors/update`
   ```
   POST /api/linkedin/selectors/update
   {
     "metricsPath": "path/to/metrics.json",
     "threshold": 0.5,
     "updateSelectorFile": true,
     "selectorFile": "optional/path/to/selectors.json"
   }
   ```

#### Using the Test Script

A convenience script is provided for testing and managing selectors:

1. **Verify Mode**: Tests selectors against a LinkedIn profile
   ```
   npm run test:selectors:verify -- --url https://www.linkedin.com/in/username --account accountId
   ```
   Or:
   ```
   node scripts/test-selectors.js --mode verify --url https://www.linkedin.com/in/username --account accountId
   ```

2. **Update Mode**: Updates selectors based on metrics
   ```
   npm run test:selectors:update -- --input path/to/metrics.json
   ```
   Or:
   ```
   node scripts/test-selectors.js --mode update --input path/to/metrics.json --threshold 0.5
   ```

### Selector File Structure

Selectors are organized by category in `config/linkedin-selectors.json`:

```json
{
  "Profile Name": [
    "h1.text-heading-xlarge",
    "div.pv-text-details__left-panel h1"
  ],
  "Profile Headline": [
    "div.pv-text-details__left-panel div.text-body-medium",
    "div.ph5 div.text-body-medium"
  ]
}
```

## API Documentation

### LinkedIn APIs

#### Profile Scraping
- `POST /api/linkedin/search`: Search LinkedIn profiles

#### Account Management
- `POST /api/linkedin/next-account`: Get the next available LinkedIn account
- `POST /api/linkedin/test-login`: Test LinkedIn account login

#### Proxy Management
- `POST /api/linkedin/next-proxy`: Get the next available proxy

#### Selector Management
- `POST /api/linkedin/selectors/verify`: Verify LinkedIn selectors
- `POST /api/linkedin/selectors/update`: Update LinkedIn selectors

## Troubleshooting

### Common Issues

1. **ChromeDriver Errors**: Make sure Chrome and ChromeDriver versions are compatible
   ```
   npm run setup-chromedriver
   ```

2. **LinkedIn Authentication Failures**: Check account status and update cookies if needed

3. **Selector Issues**: If profiles aren't being scraped correctly:
   ```
   npm run test:selectors:verify -- --url https://www.linkedin.com/in/username --account accountId
   ```

## License

Copyright © 2023 Chiratae Ventures

# Using email/password:
npm run verify-selectors -- -u https://www.linkedin.com/in/some-profile -e your-linkedin@email.com -p yourpassword

# Using an account ID from the database:
npm run verify-selectors -- -u https://www.linkedin.com/in/some-profile -i 61234567890abcdef1234567

# Update selectors with authentication:
npm run update-selectors -- -i ./selector-health.json -e your-linkedin@email.com -p yourpassword
