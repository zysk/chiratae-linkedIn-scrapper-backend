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
- Improved handling of LinkedIn authentication challenges (CAPTCHA, OTP, phone verification)

## ✅ Completed Components

### 1. Authentication System
- JWT-based authentication with refresh tokens
- Role-based access control (USER, ADMIN, CLIENT)
- Secure password hashing with bcrypt
- User management API for admins

### 2. LinkedIn Account and Proxy Management
- Secure credential storage with AES-256-GCM encryption
- LinkedIn account CRUD operations
- Proxy server CRUD operations
- Automatic rotation of accounts and proxies
- Usage tracking and availability management
- Detailed LinkedIn authentication challenge detection and handling

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Testing

```bash
# Run automated tests
npm test

# Test LinkedIn and Proxy management
npm run test:linkedin-proxy

# Check port availability
npm run port:check 4000

# Run on alternative port
npm run dev:4001
```

## API Documentation

See [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md) for a complete list of API endpoints.

For testing with Postman, see [docs/POSTMAN_GUIDE.md](docs/POSTMAN_GUIDE.md).

## Project Structure

```
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app
│   └── server.ts        # Server entry point
├── docs/                # Documentation
├── postman/             # Postman collections
├── scripts/             # Utility scripts
└── tests/               # Test files
```

## Port Management

If you encounter port conflicts, use the provided scripts:

```bash
# Check if port 4000 is available
npm run port:check 4000

# Find the next available port
npm run port:find

# Run on a specific port
npm run dev:port --port=4001
```

## LinkedIn Authentication Challenges

LinkedIn uses various security measures to detect and prevent automated access. The API now properly detects and handles these challenges:

### Authentication Challenge Types

1. **CAPTCHA Verification**: When LinkedIn presents a CAPTCHA challenge, the API will return a 403 response with `challengeType: 'captcha'` and details about the challenge.

2. **One-Time Password (OTP) Verification**: If LinkedIn requires OTP verification, the API will return a 403 response with `challengeType: 'otp'` and instructions.

3. **Phone Verification**: When phone verification is required, the API will return a 403 response with `challengeType: 'phone'` and instructions.

### Best Practices for Handling Challenges

- Use dedicated LinkedIn accounts with proper business subscriptions
- Implement manual challenge resolution for CAPTCHA, OTP, and phone verification
- Rotate LinkedIn accounts and proxies to reduce detection risk
- Add delays between actions to mimic human behavior
- Set up alert systems to notify administrators when verification is required

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
