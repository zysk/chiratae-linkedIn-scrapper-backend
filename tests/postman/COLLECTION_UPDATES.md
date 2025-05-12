# Chiratae LinkedIn Scraper API - Postman Collection Updates

## Changes Made to the Collection

### 1. Added Missing Endpoints

The original collection was missing several important endpoints that are now included:

#### User Ratings API

- `POST /api/userRatings` - Rate a user's performance
- `GET /api/userRatings/:userId` - Get all ratings for a specific user

#### LinkedIn API

- `POST /api/linkedin/test-login` - Test LinkedIn account login (admin only)
- `POST /api/linkedin/search` - Search LinkedIn profiles directly
- `GET /api/linkedin/accounts/next` - Get the next available LinkedIn account (admin only)
- `GET /api/linkedin/proxies/next` - Get the next available proxy (admin only)

#### Utils API

- `POST /api/utils/screenshots/cleanup` - Clean up all screenshot files (admin only)
- `POST /api/utils/screenshots/cleanup/campaign/:campaignId` - Clean up screenshots for a specific campaign
- `POST /api/utils/screenshots/cleanup/old` - Clean up screenshots older than specified days

#### Lead API (Updated Routes)

- Updated route paths to match actual implementation (`/api/lead/...`)
- Added missing lead comment management endpoints:
    - `PATCH /api/lead/comments/:commentId` - Update a lead comment
    - `DELETE /api/lead/comments/:commentId` - Delete a lead comment

### 2. Updated Request/Response Examples with Real Data

The collection now includes actual data from the MongoDB database:

- **User**: Real user documents with IDs
- **Campaign**: Real campaign configuration and IDs
- **LinkedIn Account**: Actual LinkedIn account credentials (encrypted password)
- **Proxy**: Real proxy server configurations
- **Lead**: Actual lead data from database

### 3. Environment Setup with Real IDs

The environment variables file has been updated with real MongoDB document IDs:

- `userId`: `68173b931d602f7d1ffee3f4`
- `campaignId`: `6817f89fd348dacbe14b0782`
- `linkedinAccountId`: `6818bff2b7e52b5311125963`
- `proxyId`: `681bffb42016c9d82a043a47`
- `leadId`: `681b588c35c35f8951591118`

### 4. Corrected API Base URL

Updated the base URL to match the actual server configuration in `.env`:

- Original: `http://localhost:5000`
- Updated: `http://localhost:4001`

### 5. Created Additional Documentation

- Updated README with detailed instructions on using the updated collection
- Added information about real MongoDB data being used in the collection
- Created this document to summarize all the updates made

### 6. Made Proxy Optional in Campaigns

Updated the campaign model and endpoints to make proxies optional:

- Modified campaign examples in the collection to show that proxyId is optional
- Added a specific "Create Campaign Without Proxy" example request to clearly demonstrate this feature
- This change reflects updates made to the backend code where proxies are no longer required when creating campaigns

## How to Use the Updated Collection

1. Import the files from:

    - `collections/chiratae-linkedin-scraper-api-updated.json`
    - `environments/chiratae-linkedin-scraper-environment-updated.json`

2. The updated collection is ready to use with real IDs from the database, so most endpoints should work immediately after authentication.

3. Follow the testing sequence in the README for a complete test of the API functionality.
