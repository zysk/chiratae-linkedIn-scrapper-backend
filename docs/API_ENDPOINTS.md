# API Endpoints Reference

This document provides a comprehensive list of all API endpoints available in the Chiratae LinkedIn Scraper backend application.

## Base URL

```
http://localhost:{PORT}/api
```

Default PORT is 4000, but can be changed using environment variables or the provided port management scripts.

## Authentication Endpoints

| Method | Endpoint               | Description          | Authentication | Request Body                      | Response                 |
| ------ | ---------------------- | -------------------- | -------------- | --------------------------------- | ------------------------ |
| POST   | `/users/register`      | Register a new user  | None           | `{name, email, password, phone?}` | Success message          |
| POST   | `/users/login`         | Login as a user      | None           | `{email, password}`               | User details and tokens  |
| POST   | `/users/loginAdmin`    | Login as an admin    | None           | `{email, password}`               | Admin details and tokens |
| POST   | `/users/refreshToken`  | Refresh access token | None           | `{refreshToken}`                  | New access token         |
| POST   | `/users/registerAdmin` | Register a new admin | Admin          | `{name, email, password, phone?}` | Success message          |

## User Management Endpoints

| Method | Endpoint           | Description              | Authentication | Request Body          | Response        |
| ------ | ------------------ | ------------------------ | -------------- | --------------------- | --------------- |
| GET    | `/users/me`        | Get current user profile | User           | None                  | User details    |
| PATCH  | `/users/me/update` | Update current user      | User           | User fields to update | Updated user    |
| GET    | `/users`           | Get all users            | Admin          | None                  | List of users   |
| GET    | `/users/:id`       | Get user by ID           | Admin          | None                  | User details    |
| PATCH  | `/users/:id`       | Update a user            | Admin          | User fields to update | Updated user    |
| DELETE | `/users/:id`       | Delete a user            | Admin          | None                  | Success message |

## LinkedIn Account Endpoints

| Method | Endpoint                            | Description                | Authentication | Request Body                                | Response          |
| ------ | ----------------------------------- | -------------------------- | -------------- | ------------------------------------------- | ----------------- |
| POST   | `/linkedin-accounts`                | Create LinkedIn account    | Admin          | `{username, password, email, description?}` | Created account   |
| GET    | `/linkedin-accounts`                | Get all LinkedIn accounts  | Admin          | None                                        | List of accounts  |
| GET    | `/linkedin-accounts/:id`            | Get account by ID          | Admin          | None                                        | Account details   |
| PUT    | `/linkedin-accounts/:id`            | Update account             | Admin          | Account fields to update                    | Updated account   |
| DELETE | `/linkedin-accounts/:id`            | Delete account             | Admin          | None                                        | Success message   |
| GET    | `/linkedin-accounts/next/available` | Get next available account | Admin          | None                                        | Available account |

## Proxy Endpoints

| Method | Endpoint                  | Description              | Authentication | Request Body                                   | Response        |
| ------ | ------------------------- | ------------------------ | -------------- | ---------------------------------------------- | --------------- |
| POST   | `/proxies`                | Create proxy             | Admin          | `{host, port, protocol, username?, password?}` | Created proxy   |
| GET    | `/proxies`                | Get all proxies          | Admin          | None                                           | List of proxies |
| GET    | `/proxies/:id`            | Get proxy by ID          | Admin          | None                                           | Proxy details   |
| PUT    | `/proxies/:id`            | Update proxy             | Admin          | Proxy fields to update                         | Updated proxy   |
| DELETE | `/proxies/:id`            | Delete proxy             | Admin          | None                                           | Success message |
| GET    | `/proxies/next/available` | Get next available proxy | Admin          | None                                           | Available proxy |

## System Endpoints

| Method | Endpoint  | Description      | Authentication | Request Body | Response               |
| ------ | --------- | ---------------- | -------------- | ------------ | ---------------------- |
| GET    | `/health` | Check API health | None           | None         | Status and environment |

## Authentication

Most endpoints require authentication using a JWT token. Include the token in the Authorization header as follows:

```
Authorization: Bearer <your_access_token>
```

## Response Format

All API responses follow a standard format:

```json
{
	"success": true,
	"message": "Operation successful message",
	"data": {
		/* response data */
	}
}
```

Error responses:

```json
{
	"success": false,
	"message": "Error message",
	"error": {
		/* error details */
	}
}
```
