# Authentication System Summary

## Overview
The authentication system provides secure user management with role-based access control. It includes functionality for user registration, login, profile management, and token-based authentication.

## Key Components

### User Registration
- Endpoint: `POST /api/users/register`
- Validates email, password strength, and other user data
- Hashes passwords before storage
- Creates new user accounts with USER role by default

### User Login
- Endpoint: `POST /api/users/login`
- Authenticates users with email and password
- Returns JWT access token and refresh token
- Includes user details in response

### Token Management
- Access tokens expire after 24 hours (configurable)
- Refresh tokens expire after 7 days (configurable)
- Endpoint: `POST /api/users/refreshToken` to obtain new tokens

### User Profile Management
- Get current user: `GET /api/users/me`
- Update profile: `PATCH /api/users/me/update`
- Change password: `PATCH /api/users/me/password`

### Admin Functions
- Register admin: `POST /api/users/registerAdmin` (admin only)
- Get all users: `GET /api/users` (admin only)
- Get user by ID: `GET /api/users/:id` (admin only)
- Update any user: `PATCH /api/users/:id` (admin only)
- Delete user: `DELETE /api/users/:id` (admin only)

### User Ratings
- Rate user: `POST /api/ratings`
- Get user ratings: `GET /api/ratings/:userId`

## Security Features
- Password hashing using bcrypt
- JWT-based authentication
- Role-based access control
- Token refresh mechanism
- Request validation using Joi

## Test Coverage
All authentication endpoints have been tested for:
- Successful operation with valid inputs
- Proper error handling with invalid inputs
- Appropriate authorization checks
- Token validation and refresh
