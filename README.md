# LinkedIn Scraper Backend

A Node.js backend service for scraping LinkedIn profiles and company data using Selenium WebDriver and ChromeDriver.

## Features

- LinkedIn profile and company data scraping
- Cross-platform support (Windows, Linux)
- Campaign management for batch scraping
- Proxy support for rotating IP addresses
- Authentication and authorization
- Scheduling capabilities
- Email notifications
- MongoDB integration for data storage
- Redis for job queue management

## Prerequisites

- Node.js (v16+)
- MongoDB
- Redis
- Google Chrome (or ChromeDriver compatible browser)

## Installation

### Traditional Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd linkedin-scraper-backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables by creating a `.env` file in the root directory:
   ```
   PORT=3000
   NODE_ENV=development
   TZ=UTC
   MONGOURI=mongodb://localhost:27017/linkedin-scraper
   ACCESS_TOKEN_SECRET=your_secret_key
   ACCESS_TOKEN_LIFE=7d
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ENABLE_HEADLESS=true
   ENABLE_CRON=true
   ENCRYPTION_KEY=your_encryption_key_32_characters
   LOG_LEVEL=info
   ```

4. Build the TypeScript code:
   ```
   npm run build
   ```

5. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

### Docker Setup

1. Make sure Docker and Docker Compose are installed on your system.

2. Build and start the containers:
   ```
   docker-compose up -d
   ```

   This will set up the entire stack including:
   - The LinkedIn scraper application
   - MongoDB database
   - Redis instance

## Project Structure

```
linkedin-scraper-backend/
├── chromedriver/           # ChromeDriver binaries for different platforms
├── src/
│   ├── bin/                # Server entry point and initialization
│   ├── config/             # Application configuration
│   ├── controllers/        # API endpoint controllers
│   ├── helpers/            # Helper utilities
│   ├── interfaces/         # TypeScript interfaces
│   ├── middlewares/        # Express middlewares
│   │   └── error.middleware.ts  # Centralized error handling
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic services
│   │   ├── chromedriver.service.ts # Cross-platform ChromeDriver
│   │   ├── logger.service.ts  # Centralized logging
│   │   └── redis.service.ts   # Redis client and operations
│   ├── utils/              # Utility functions
│   │   ├── api-response.util.ts   # Standardized API responses
│   │   ├── db.util.ts           # Database connection utilities
│   │   ├── ensure-dir.ts        # Directory utilities
│   │   ├── env-validator.util.ts # Environment validation
│   │   └── error-types.util.ts  # Custom error types
│   ├── app.ts              # Express application setup
│   └── index.ts            # Application entry point
├── scripts/                # Utility scripts
│   ├── fix-console-logs.js # Script to replace console logs with logger calls
│   └── type-check.js       # TypeScript type checking
├── logs/                   # Application logs
├── docs/                   # Documentation
├── public/                 # Static files
├── .env                    # Environment variables
├── .dockerignore           # Docker ignore file
├── .eslintrc.js            # ESLint configuration
├── .gitignore              # Git ignore file
├── Dockerfile              # Docker build instructions
├── docker-compose.yml      # Docker Compose configuration
├── package.json            # Project dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## API Endpoints

The API includes endpoints for:

- `/users` - User management
- `/campaign` - Campaign management
- `/lead` - LinkedIn leads
- `/linkedInAccount` - LinkedIn account credentials
- `/proxies` - Proxy configuration
- `/leadComments` - Comments on leads
- `/leadLogs` - Activity logs for leads
- `/leadStatus` - Status management for leads
- `/emailSettings` - Email notification configuration

## Working with ChromeDriver

The application automatically detects your operating system and uses the appropriate ChromeDriver:

- Windows: Uses `chromedriver/chromedriver-win64/chromedriver.exe`
- Linux: Uses `chromedriver/chromedriver-linux64/chromedriver`

You can override the path by setting the `CHROMEDRIVER_PATH` environment variable.

## Error Handling

The application uses a centralized error handling system with custom error types:

- `AppError`: Base error class for all application errors
- `ValidationError`: For validation failures
- `AuthenticationError`: For authentication issues
- `AuthorizationError`: For permission issues
- `NotFoundError`: For resource not found errors
- `ConflictError`: For duplicate resource errors
- `ServiceUnavailableError`: For external service failures
- `DatabaseError`: For database operation errors

All errors are processed through the centralized error middleware that:
- Normalizes different error types
- Provides appropriate HTTP status codes
- Structures error responses consistently
- Logs errors with contextual information
- Masks sensitive information

## Logging System

The application uses a structured logging system with different log levels:

- `error`: For errors and exceptions
- `warn`: For warnings
- `info`: For informational messages
- `debug`: For detailed debugging information

Logs are organized into files:
- `logs/combined.log`: All logs
- `logs/error.log`: Error logs only
- `logs/exceptions.log`: Uncaught exceptions

For development, you can set the log level in the .env file:
```
LOG_LEVEL=debug  # Possible values: error, warn, info, debug
```

## Scripts

The project includes several utility scripts:

- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Start the production server
- `npm run dev`: Start the development server with auto-restart
- `npm run lint`: Run ESLint to check for code issues
- `npm run lint:fix`: Run ESLint and fix issues automatically
- `npm run type-check`: Run TypeScript type checking
- `npm run fix:console-logs`: Replace console.log calls with proper logger calls
- `npm run clean-build`: Clean the project and rebuild

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security Notice

LinkedIn scraping might be against LinkedIn's Terms of Service. Use this tool responsibly and at your own risk. The creators and contributors to this project are not responsible for any misuse or legal consequences.