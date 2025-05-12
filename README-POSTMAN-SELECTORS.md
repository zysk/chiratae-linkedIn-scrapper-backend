# LinkedIn Selectors API - Postman Guide

This guide explains how to use the updated Postman collection to work with the LinkedIn Selectors API endpoints.

## Prerequisites

1. Import the updated Postman collection: `LinkedIn Scraper API.postman_collection.json`
2. Import the environment file: `LinkedIn Scraper API Environment.postman_environment.json`
3. Make sure you have admin credentials for authentication

## Environment Setup

Ensure the following environment variables are set:

| Variable              | Description                             | Example Value                           |
| --------------------- | --------------------------------------- | --------------------------------------- |
| `baseUrl`             | Base URL of your API                    | `http://localhost:4001`                 |
| `adminToken`          | Admin JWT token for authentication      | _will be set automatically after login_ |
| `linkedinAccountId`   | MongoDB ID of your LinkedIn account     | `6818bff2b770ad95a07b5e05`              |
| `linkedinAccountPass` | Password for your LinkedIn account      | `YourSecurePassword`                    |
| `proxyId`             | MongoDB ID of a proxy to use (optional) | `6818bff2b770ad95a07b5e06`              |
| `selectorsOutputPath` | Path to save selector metrics           | `./output/selectors-metrics.json`       |
| `selectorThreshold`   | Success rate threshold (0-1)            | `0.5`                                   |

## Authentication

1. Before using any of the LinkedIn Selectors endpoints, authenticate using the "Login Admin" request in the Auth folder
2. This will automatically set the `adminToken` environment variable

## Available Requests

### LinkedIn Selectors Folder

#### 1. Verify Selectors with ProfileURL

Tests selectors against a specific LinkedIn profile URL.

**Request:**

- Method: `POST`
- Endpoint: `{{baseUrl}}/api/linkedin/selectors/verify`
- Body:

```json
{
	"linkedinAccountId": "{{linkedinAccountId}}",
	"password": "{{linkedinAccountPass}}",
	"profileUrl": "https://www.linkedin.com/in/ganapati-moger-804b1b1a4/",
	"proxyId": "{{proxyId}}",
	"outputPath": "{{selectorsOutputPath}}"
}
```

#### 2. Verify Selectors with Latest Lead

Tests selectors against the latest lead in your database that has a LinkedIn profile URL.

**Request:**

- Method: `POST`
- Endpoint: `{{baseUrl}}/api/linkedin/selectors/verify`
- Body:

```json
{
	"linkedinAccountId": "{{linkedinAccountId}}",
	"password": "{{linkedinAccountPass}}",
	"useLatestLead": true,
	"proxyId": "{{proxyId}}",
	"outputPath": "{{selectorsOutputPath}}"
}
```

#### 3. Update Selectors

Analyzes selector metrics and updates selectors in your selectors.json file.

**Request:**

- Method: `POST`
- Endpoint: `{{baseUrl}}/api/linkedin/selectors/update`
- Body:

```json
{
	"metricsPath": "{{selectorsOutputPath}}",
	"threshold": "{{selectorThreshold}}",
	"updateSelectorFile": true,
	"selectorFile": "./data/selectors.json",
	"category": ["Profile Headline", "Experience Section"]
}
```

#### 4. Update Selectors with Generation

Analyzes selector metrics and automatically generates new selectors for categories where all selectors are failing.

**Request:**

- Method: `POST`
- Endpoint: `{{baseUrl}}/api/linkedin/selectors/update`
- Body:

```json
{
	"metricsPath": "{{selectorsOutputPath}}",
	"threshold": "{{selectorThreshold}}",
	"updateSelectorFile": true,
	"selectorFile": "./data/selectors.json",
	"category": ["Profile Headline", "Experience Section"],
	"generateNewSelectors": true,
	"profileUrl": "https://www.linkedin.com/in/ganapati-moger-804b1b1a4/",
	"linkedinAccountId": "{{linkedinAccountId}}",
	"password": "{{linkedinAccountPass}}",
	"proxyId": "{{proxyId}}"
}
```

## Workflow Example

1. **Log in as admin** to get your authentication token
2. **Verify selectors** against a specific profile or the latest lead
3. **Review the verification results** to identify poor-performing selectors
4. **Update selectors** to replace poor-performing ones with better ones
5. **Generate new selectors** for categories where all selectors are failing

## Tips for Successful Usage

- Always run the verification before updating to get fresh metrics
- The selector generation feature requires the profile URL and LinkedIn credentials
- Generation works best on public or 1st-degree connection profiles
- You can focus on specific categories by passing an array of category names
- All requests use Bearer token authentication with the admin token

## Troubleshooting

- If you receive a 401 error, your admin token may have expired. Use the "Login Admin" request from the "Auth" folder to obtain a new token.
- If the verification fails, check that the LinkedIn account credentials are correct and the account is not locked.
- Make sure the output paths in the requests are writable by the application.

## Notes

- The verification process can take some time as it needs to log in to LinkedIn and navigate to the profile.
- Selector updates are only applied to the selector file if `updateSelectorFile` is set to `true`.
- Always check the response for any errors or warnings about specific selectors.
- When using multiple categories in the array, ensure they're correctly formatted (with quotes and commas).
