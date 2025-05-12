# Campaign API Documentation

This document provides information about the LinkedIn Scraper Campaign API endpoints.

## Overview

The Campaign API allows you to manage LinkedIn search campaigns. Each campaign represents a LinkedIn search operation with specific criteria to find profiles matching certain parameters.

## Authentication

All Campaign API endpoints require authentication. You need to include a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Endpoints

### Create Campaign

Creates a new LinkedIn search campaign.

- **URL**: `/api/campaigns`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions Required**: Authenticated user

**Request Body**:

```json
{
	"name": "Software Engineers at Google",
	"searchQuery": "Software Engineer",
	"company": "Google",
	"location": "United States",
	"keywords": ["React", "Node.js", "JavaScript"],
	"maxResults": 100,
	"connectionDegree": "2nd"
}
```

**Optional Parameters**:

- `school`: Filter by school/university
- `pastCompany`: Filter by previous company
- `industry`: Filter by industry
- `linkedInAccountId`: Specific LinkedIn account to use for this campaign
- `proxyId`: Specific proxy to use for this campaign

**Response**: `201 Created`

```json
{
	"status": "success",
	"data": {
		"_id": "60d21b4667d0d8992e610c85",
		"name": "Software Engineers at Google",
		"searchQuery": "Software Engineer",
		"company": "Google",
		"location": "United States",
		"keywords": ["React", "Node.js", "JavaScript"],
		"maxResults": 100,
		"status": "CREATED",
		"createdAt": "2023-06-22T14:30:45.123Z",
		"updatedAt": "2023-06-22T14:30:45.123Z",
		"user": "60d21b4667d0d8992e610c80"
	}
}
```

### Get All Campaigns

Retrieves a list of campaigns with optional filtering and pagination.

- **URL**: `/api/campaigns`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions Required**: Authenticated user

**Query Parameters**:

- `status`: Filter by campaign status (CREATED, RUNNING, SEARCH_COMPLETED, FAILED, PAUSED)
- `page`: Page number for pagination (default: 1)
- `limit`: Results per page (default: 10)
- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: Sort direction, 'asc' or 'desc' (default: desc)

**Response**: `200 OK`

```json
{
	"status": "success",
	"data": [
		{
			"_id": "60d21b4667d0d8992e610c85",
			"name": "Software Engineers at Google",
			"searchQuery": "Software Engineer",
			"status": "CREATED",
			"createdAt": "2023-06-22T14:30:45.123Z",
			"updatedAt": "2023-06-22T14:30:45.123Z",
			"resultsCount": 0
		}
	],
	"pagination": {
		"total": 1,
		"page": 1,
		"pages": 1,
		"limit": 10
	}
}
```

### Get Campaign by ID

Retrieves detailed information about a specific campaign.

- **URL**: `/api/campaigns/:id`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions Required**: Authenticated user (must be campaign owner or admin)

**Response**: `200 OK`

```json
{
	"status": "success",
	"data": {
		"_id": "60d21b4667d0d8992e610c85",
		"name": "Software Engineers at Google",
		"searchQuery": "Software Engineer",
		"company": "Google",
		"location": "United States",
		"keywords": ["React", "Node.js", "JavaScript"],
		"maxResults": 100,
		"status": "CREATED",
		"createdAt": "2023-06-22T14:30:45.123Z",
		"updatedAt": "2023-06-22T14:30:45.123Z",
		"resultsCount": 0,
		"user": {
			"_id": "60d21b4667d0d8992e610c80",
			"name": "John Doe"
		}
	}
}
```

### Update Campaign

Updates an existing campaign.

- **URL**: `/api/campaigns/:id`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Permissions Required**: Authenticated user (must be campaign owner or admin)

**Request Body**:

```json
{
	"name": "Updated Campaign Name",
	"searchQuery": "Software Engineer Senior",
	"maxResults": 150,
	"keywords": ["React", "Node.js", "TypeScript", "AWS"]
}
```

**Response**: `200 OK`

```json
{
	"status": "success",
	"data": {
		"_id": "60d21b4667d0d8992e610c85",
		"name": "Updated Campaign Name",
		"searchQuery": "Software Engineer Senior",
		"company": "Google",
		"location": "United States",
		"keywords": ["React", "Node.js", "TypeScript", "AWS"],
		"maxResults": 150,
		"status": "CREATED",
		"createdAt": "2023-06-22T14:30:45.123Z",
		"updatedAt": "2023-06-22T15:45:22.987Z"
	}
}
```

### Delete Campaign

Deletes a campaign.

- **URL**: `/api/campaigns/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permissions Required**: Authenticated user (must be campaign owner or admin)

**Response**: `200 OK`

```json
{
	"status": "success",
	"message": "Campaign deleted successfully"
}
```

### Add Campaign to Queue

Adds a campaign to the processing queue for execution.

- **URL**: `/api/campaigns/queue`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions Required**: Authenticated user (must be campaign owner or admin)

**Request Body**:

```json
{
	"campaignId": "60d21b4667d0d8992e610c85",
	"priority": "high"
}
```

**Response**: `200 OK`

```json
{
	"status": "success",
	"data": {
		"_id": "60d21b4667d0d8992e610c85",
		"name": "Updated Campaign Name",
		"status": "QUEUED",
		"updatedAt": "2023-06-22T16:10:05.432Z"
	},
	"message": "Campaign added to queue successfully"
}
```

### Get Campaign Results

Retrieves the LinkedIn profiles found for a specific campaign.

- **URL**: `/api/campaigns/:id/results`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions Required**: Authenticated user (must be campaign owner or admin)

**Query Parameters**:

- `page`: Page number for pagination (default: 1)
- `limit`: Results per page (default: 25)
- `scraped`: Filter by scraped status (true/false)

**Response**: `200 OK`

```json
{
	"status": "success",
	"data": {
		"results": [
			{
				"_id": "60d21b4667d0d8992e610d01",
				"profileId": "john-doe-123456",
				"profileUrl": "https://www.linkedin.com/in/john-doe-123456/",
				"name": "John Doe",
				"scrapeStatus": "COMPLETED",
				"scraped": true,
				"createdAt": "2023-06-22T17:30:45.123Z"
			}
		],
		"pagination": {
			"total": 1,
			"page": 1,
			"pages": 1,
			"limit": 25
		}
	}
}
```

## Campaign Status

Campaigns can have the following status values:

- `CREATED`: Initial status when a campaign is created
- `QUEUED`: Campaign has been added to the processing queue
- `RUNNING`: Campaign is currently being processed
- `SEARCH_COMPLETED`: LinkedIn search has been completed
- `FAILED`: Campaign processing failed
- `PAUSED`: Campaign processing was paused

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

- `200`: Success
- `201`: Created
- `400`: Bad Request - Invalid input or validation error
- `401`: Unauthorized - Authentication failed
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Server Error

Error responses have the following format:

```json
{
	"status": "error",
	"message": "Error message describing what went wrong"
}
```
