# LinkedIn Account and Proxy Management System

This document provides an overview of the LinkedIn Account and Proxy Management System implemented for the Chiratae LinkedIn Scraper backend application.

## Overview

The LinkedIn Account and Proxy Management system allows administrators to:

1. Create, update, and manage LinkedIn accounts for scraping operations
2. Create, update, and manage proxy configurations to rotate during scraping
3. Rotate accounts and proxies to prevent rate limiting and IP blocking
4. Securely store sensitive credentials using encryption

## Components

### Models

1. **LinkedIn Account Model**
   - Stores LinkedIn account credentials securely
   - Tracks usage metrics and status
   - Manages account rotation

2. **Proxy Model**
   - Stores proxy server configuration details
   - Supports multiple proxy protocols
   - Tracks usage metrics and status
   - Manages proxy rotation

### Utilities

1. **Encryption Utilities**
   - Securely encrypts sensitive information
   - Provides methods for encrypting and decrypting data
   - Uses industry-standard encryption algorithms

2. **Manager Classes**
   - `LinkedInAccountManager`: Handles account selection and rotation
   - `ProxyManager`: Handles proxy selection and rotation

### Security

1. **Role-Based Access Control**
   - All LinkedIn account and proxy management endpoints restricted to ADMIN users
   - Implemented with `isAdmin` middleware

2. **Password Encryption**
   - LinkedIn account passwords and proxy credentials are encrypted in the database
   - Only encrypted data is stored, never plaintext credentials

## API Endpoints

### LinkedIn Accounts

1. **POST /api/linkedin-accounts**
   - Create a new LinkedIn account
   - Required fields: username, password, email

2. **GET /api/linkedin-accounts**
   - Get all LinkedIn accounts (admin only)
   - Supports filtering by status

3. **GET /api/linkedin-accounts/:id**
   - Get a specific LinkedIn account by ID

4. **PUT /api/linkedin-accounts/:id**
   - Update a LinkedIn account
   - Can update credentials, status, and metadata

5. **DELETE /api/linkedin-accounts/:id**
   - Delete a LinkedIn account

6. **GET /api/linkedin-accounts/next/available**
   - Get the next available LinkedIn account for rotation
   - Uses a fair rotation algorithm

### Proxies

1. **POST /api/proxies**
   - Create a new proxy configuration
   - Required fields: host, port, protocol
   - Optional fields: username, password, description

2. **GET /api/proxies**
   - Get all proxy configurations (admin only)
   - Supports filtering by status and protocol

3. **GET /api/proxies/:id**
   - Get a specific proxy by ID

4. **PUT /api/proxies/:id**
   - Update a proxy configuration
   - Can update credentials, status, and metadata

5. **DELETE /api/proxies/:id**
   - Delete a proxy configuration

6. **GET /api/proxies/next/available**
   - Get the next available proxy for rotation
   - Uses a fair rotation algorithm

## Testing

The included Postman collection (`ChirataeScraper_LinkedIn_Proxy_Tests.postman_collection.json`) contains requests to test all the LinkedIn account and proxy management endpoints.

A comprehensive test script (`test-linkedin-proxy.js`) is also provided to automatically test all endpoints in sequence.

## Usage Guidelines

1. Always use admin credentials when working with these endpoints
2. LinkedIn credentials and proxy details should be verified before adding to the system
3. Use the rotation endpoints to fairly distribute usage across accounts and proxies
4. Monitor usage metrics to identify accounts or proxies that may need replacement
