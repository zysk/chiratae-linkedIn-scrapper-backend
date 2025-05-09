# Chiratae LinkedIn Scraper API - Project Analysis & Postman Collection

## Project Overview

The Chiratae LinkedIn Scraper is a TypeScript/Node.js application designed to automate LinkedIn profile searching and data scraping. The project is being revamped from an older version with improved architecture and features.

### Core Functionality

1. **LinkedIn Search Automation**: Creates and manages search campaigns targeting specific demographics
2. **Profile Scraping**: Extracts profile data from LinkedIn search results
3. **User Management**: Authentication, authorization, and user role management
4. **Proxy & LinkedIn Account Management**: Configuration for multiple LinkedIn accounts and proxies
5. **Campaign Scheduling**: Automated scheduling for regular data collection
6. **Lead Management**: Tracking and organizing scraped profiles as potential leads
7. **User Rating System**: Performance evaluation system for users

## Codebase Analysis

### Backend Architecture

- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication with refresh tokens
- **Scraping Technology**: Selenium WebDriver for browser automation
- **API Structure**: RESTful API with proper middleware for authentication/authorization
- **Job Queue**: Redis-based queuing system for campaign execution
- **Scheduler**: Automated scheduling for recurring campaigns

### Key Models

1. **User Model**:
   - Handles user authentication, multiple roles (User, Admin)
   - Manages user metadata and permissions
   - Includes fields for performance tracking

2. **Campaign Model**:
   - Represents a LinkedIn search campaign
   - Stores search parameters, status, results
   - Supports scheduling and priority settings
   - Tracks statistics like profiles found/scraped

3. **Lead Model**:
   - Bridges campaigns and scraped profiles
   - Tracks status and assignments
   - Includes client ID from LinkedIn
   - Supports comment and follow-up functionality

4. **LinkedIn Account Model**:
   - Manages LinkedIn credentials
   - Handles encryption for sensitive data
   - Tracks usage statistics and last used timestamp

5. **Proxy Model**:
   - Configures proxy servers for avoiding rate limits
   - Manages rotation and usage tracking
   - Supports different protocols

6. **User Rating Model**:
   - Performance evaluation system
   - Allows rating users on a scale
   - Includes comments and feedback

### API Routes

1. **User Routes**: Registration, login, profile management
2. **Campaign Routes**: CRUD for campaigns, search execution, scheduling
3. **LinkedIn Account Routes**: Management of LinkedIn credentials
4. **Proxy Routes**: Configuration of proxy servers
5. **Lead Routes**: Managing scraped profiles and follow-ups
6. **LinkedIn Routes**: Direct interaction with LinkedIn
7. **Utils Routes**: System maintenance operations
8. **User Rating Routes**: User performance evaluation

## Database Analysis

Analysis of the MongoDB database reveals:

1. **Active Users**: Currently has at least one active user with role "USER"
2. **Campaign Configuration**: Campaigns target specific companies (e.g., "Google") and roles (e.g., "Software Engineer")
3. **LinkedIn Accounts**: At least one LinkedIn account configured with usage tracking
4. **Proxy Setup**: Using HTTP proxy with specific host/port configuration
5. **Lead Structure**: Leads are associated with campaigns and have a clientId linking to LinkedIn

## Postman Collection Creation

A comprehensive Postman collection has been created to test and document all API endpoints. The collection includes:

1. **Authentication Endpoints**:
   - User registration and login
   - Admin registration and login
   - Token refresh
   - User profile management

2. **Campaign Management**:
   - Create, read, update, delete campaigns
   - Queue campaigns for execution
   - Schedule campaigns
   - LinkedIn search and scraping triggers
   - Results retrieval

3. **Account Management**:
   - LinkedIn account creation and management
   - Proxy configuration
   - User management (admin only)

4. **Lead Management**:
   - Lead listing and filtering
   - Status updates
   - Comments and follow-ups

5. **LinkedIn API**:
   - Direct LinkedIn interactions
   - Account testing
   - Profile searching

6. **Utils API**:
   - System maintenance operations
   - Screenshot cleanup

7. **User Rating API**:
   - Performance rating system
   - Rating retrieval

### Collection Features

- **Environment Variables**: Configured for server URL, tokens, and IDs from real MongoDB data
- **Test Scripts**: Automatically sets variables like tokens and IDs
- **Example Payloads**: All requests include properly formatted example data with real values
- **Authorization**: Properly configured auth headers
- **Real Data**: Uses actual MongoDB document IDs for testing

## Usage Instructions

The Postman collection is organized to follow a typical workflow:

1. Start with user authentication
2. Configure LinkedIn accounts and proxies
3. Create and manage campaigns
4. Execute searches and scraping
5. Manage resulting leads

See the README.md file for detailed instructions on importing and using the collection.

## Files Created

1. `tests/postman/collections/chiratae-linkedin-scraper-api.json`: Original Postman collection
2. `tests/postman/collections/chiratae-linkedin-scraper-api-updated.json`: Updated collection with all routes
3. `tests/postman/environments/chiratae-linkedin-scraper-environment.json`: Original environment variables
4. `tests/postman/environments/chiratae-linkedin-scraper-environment-updated.json`: Updated environment with real IDs
5. `tests/postman/README.md`: Usage instructions
6. `tests/postman/SUMMARY.md`: This analysis document
7. `tests/postman/COLLECTION_UPDATES.md`: Summary of collection updates
