# LinkedIn Scraper Backend API

A TypeScript-based backend API for LinkedIn scraping and lead management.

## Project Overview

This project is a backend API service that automates LinkedIn searches, profile scraping, and lead management. It's designed for sales and marketing teams to discover potential leads by automating LinkedIn searches and data collection.

## Features

- User management with role-based authentication
- LinkedIn account management with secure credential storage
- Proxy management for IP rotation
- Campaign creation and management
- Automated LinkedIn search using Selenium WebDriver
- Profile data scraping and de-duplication
- Lead management and annotation
- Email integration for notifications

## Tech Stack

- Node.js with TypeScript
- Express.js for API server
- MongoDB with Mongoose for database
- Redis for distributed locking
- Selenium WebDriver for browser automation
- JWT for authentication
- Node-schedule for cron jobs

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB
- Redis
- Chrome browser (for Selenium WebDriver)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd linkedin-scraper-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration.

5. Build the project:
   ```bash
   npm run build
   ```

6. Start the server:
   ```bash
   npm start
   ```

For development:
   ```bash
   npm run dev
   ```

## API Documentation

API documentation will be available at `/api/docs` when the server is running.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
