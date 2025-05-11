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
| `linkedinAccountId` | MongoDB ID of your LinkedIn account | `681f41c1df0162ee6d4ad424` |
| `linkedinAccountPass` | Password for your LinkedIn account | `yourpassword` |
| `proxyId` | MongoDB ID of the proxy to use (optional) | `681bffb42016c9d82a043a47` |
| `selectorsOutputPath` | Path to save selector metrics | `./data/selector-metrics.json` |
| `selectorThreshold` | Threshold for poor selector identification | `0.5` |

## Authentication

1. Before using any of the LinkedIn Selectors endpoints, authenticate using the "Login Admin" request in the Auth folder
2. This will automatically set the `adminToken` environment variable

## Available Requests

### 1. Verify Selectors with ProfileURL

Tests LinkedIn selectors against a specific profile URL.

**Request Details:**
- **Method:** POST
- **URL:** `{{baseUrl}}/api/linkedin/selectors/verify`
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

**Notes:**
- You need to provide a valid LinkedIn profile URL
- The `proxyId` is optional and can be removed if not needed
- The API will test all LinkedIn selectors against this profile and return metrics

### 2. Verify Selectors with Latest Lead

Tests LinkedIn selectors against the most recent lead in your database.

**Request Details:**
- **Method:** POST
- **URL:** `{{baseUrl}}/api/linkedin/selectors/verify`
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

**Notes:**
- This uses the most recent lead with a valid LinkedIn profile URL from your database
- Useful for testing selectors against leads that were recently added

### 3. Update Selectors

Analyzes selector metrics and provides recommendations for updating poor-performing selectors.

**Request Details:**
- **Method:** POST
- **URL:** `{{baseUrl}}/api/linkedin/selectors/update`
- **Body:**
```json
{
    "metricsPath": "{{selectorsOutputPath}}",
    "threshold": "{{selectorThreshold}}",
    "updateSelectorFile": true,
    "selectorFile": "./data/selectors.json",
    "category": "Profile Headline"
}
```

**Notes:**
- The `metricsPath` should point to the file created by the verify selectors endpoint
- The `threshold` determines which selectors are considered "poor" (e.g., 0.5 means 50% success rate)
- Set `updateSelectorFile` to `true` to automatically update your selectors file
- The `selectorFile` parameter specifies which file to update
- The `category` parameter is optional and allows you to focus on a specific category of selectors

## Example Workflow

1. Login as admin using the "Login Admin" request
2. Run "Verify Selectors with ProfileURL" or "Verify Selectors with Latest Lead"
3. Examine the response to see selector health metrics
4. Run "Update Selectors" to analyze and potentially update selectors

## Troubleshooting

- If authentication fails, check that you're using valid admin credentials
- If LinkedIn login fails, verify your LinkedIn account credentials and ensure the account isn't blocked
- If no metrics are generated, check that the profile URL is valid and accessible
- If selector updates don't work, verify the paths to your metrics and selector files
