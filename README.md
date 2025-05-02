# LinkedIn Scraper Backend

This is a TypeScript rewrite of the LinkedIn Scraper backend application, a tool for automated LinkedIn lead generation and management.

## Features

- User authentication and authorization with JWT
- LinkedIn account management
- Proxy server management
- Campaign creation and management
- Automated LinkedIn search using Selenium WebDriver
- Profile data scraping and extraction
- Lead management and organization
- Lead annotations (comments and activity logs)
- Email notifications and reports
- Scheduled scraping with cron jobs

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Caching**: Redis for distributed locking
- **Automation**: Selenium WebDriver with Chrome
- **Authentication**: JWT, bcrypt
- **Scheduling**: node-schedule
- **Email**: Nodemailer

## Project Structure

```
src/
├── bin/                  # Application entry point
├── config/               # Configuration utilities
├── models/               # Mongoose models and interfaces
├── controllers/          # Request handlers
├── routes/               # API routes
├── middlewares/          # Express middlewares
├── helpers/              # Utility functions
├── Builders/             # Aggregation builders
├── services/             # Business logic services
├── interfaces/           # TypeScript interfaces
├── types/                # TypeScript types
└── app.ts                # Express application setup
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with necessary environment variables (see `.env.example`)

3. Build the TypeScript code:
   ```
   npm run build
   ```

4. Start the application:
   ```
   npm start
   ```

## Development

Start the development server with hot reloading:
```
npm run dev
```

## Testing

Run tests:
```
npm test
```

## Linting

Run linter:
```
npm run lint
```

## API Documentation

API endpoints and documentation will be available separately.

## License

This project is licensed under the ISC License.