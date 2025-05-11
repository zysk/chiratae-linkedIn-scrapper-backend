# LinkedIn Selectors API - Postman Guide

This guide explains how to use the updated Postman collection to work with the LinkedIn Selectors API endpoints.

## Prerequisites

1. Import the updated Postman collection: `LinkedIn Scraper API.postman_collection.json`
2. Import the environment file: `LinkedIn Scraper API Environment.postman_environment.json`
3. Make sure you have admin credentials for authentication

## Environment Setup

Ensure the following environment variables are set:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `baseUrl` | Base URL of your API | `http://localhost:4001` |
| `adminToken` | Admin JWT token for authentication | *will be set automatically after login* |
| `linkedinAccountId` | MongoDB ID of your LinkedIn account | `6818bff2b7e52b5311125963` |
| `linkedinAccountPass` | Password for your LinkedIn account | `YourPassword123` |
| `proxyId` | MongoDB ID of your proxy (optional) | `681bffb42016c9d82a043a47` |
| `selectorsOutputPath` | Path to save selector metrics | `./output/selector-metrics.json` |
| `selectorThreshold` | Threshold for selector health (0-1) | `0.5` |

## Authentication

1. Before using any of the LinkedIn Selectors endpoints, authenticate using the "Login Admin" request in the Auth folder
2. This will automatically set the `adminToken` environment variable

## Available Requests

### 1. Verify Selectors with ProfileURL

This request tests LinkedIn selectors against a specific profile URL.

**Request Details:**
- **Method:** POST
- **Endpoint:** `{{baseUrl}}/api/linkedin/selectors/verify`
- **Authentication:** Bearer Token (`{{adminToken}}`)
- **Body:**
```json
{
  "linkedinAccountId": "{{linkedinAccountId}}",
  "password": "{{linkedinAccountPass}}",
  "profileUrl": "https://www.linkedin.com/in/ganapati-moger-804b1b1a4/",
  "proxyId": "{{proxyId}}",
  "outputPath": "{{selectorsOutputPath}}"
}
```

### 2. Verify Selectors with Latest Lead

This request tests LinkedIn selectors against the most recent lead in your database.

**Request Details:**
- **Method:** POST
- **Endpoint:** `{{baseUrl}}/api/linkedin/selectors/verify`
- **Authentication:** Bearer Token (`{{adminToken}}`)
- **Body:**
```json
{
  "linkedinAccountId": "{{linkedinAccountId}}",
  "password": "{{linkedinAccountPass}}",
  "useLatestLead": true,
  "proxyId": "{{proxyId}}",
  "outputPath": "{{selectorsOutputPath}}"
}
```

### 3. Update Selectors

This request analyzes selector health metrics and provides recommendations for updates.

**Request Details:**
- **Method:** POST
- **Endpoint:** `{{baseUrl}}/api/linkedin/selectors/update`
- **Authentication:** Bearer Token (`{{adminToken}}`)
- **Body:**
```json
{
  "metricsPath": "{{selectorsOutputPath}}",
  "threshold": "{{selectorThreshold}}",
  "updateSelectorFile": true,
  "selectorFile": "./data/selectors.json",
  "category": ["Profile Headline", "Experience Section"]
}
```

#### Category Parameter Options

The `category` parameter can be provided in two ways:

1. As a single string to process one category:
```json
"category": "Profile Headline"
```

2. As an array of strings to process multiple categories:
```json
"category": ["Profile Headline", "Experience Section", "About Section"]
```

If you omit the `category` parameter, all categories will be processed.

## Usage Workflow

1. **First, verify selectors** using either "Verify Selectors with ProfileURL" or "Verify Selectors with Latest Lead"
   - This generates metrics about which selectors are working and which need attention
   - Results are saved to the file specified in `{{selectorsOutputPath}}`

2. **Then, analyze and update selectors** using "Update Selectors"
   - This analyzes the metrics file and provides recommendations
   - If `updateSelectorFile` is true, it will automatically update your selectors file

## Troubleshooting

- If you receive a 401 error, your admin token may have expired. Use the "Login Admin" request from the "Auth" folder to obtain a new token.
- If the verification fails, check that the LinkedIn account credentials are correct and the account is not locked.
- Make sure the output paths in the requests are writable by the application.

## Notes

- The verification process can take some time as it needs to log in to LinkedIn and navigate to the profile.
- Selector updates are only applied to the selector file if `updateSelectorFile` is set to `true`.
- Always check the response for any errors or warnings about specific selectors.
- When using multiple categories in the array, ensure they're correctly formatted (with quotes and commas).
