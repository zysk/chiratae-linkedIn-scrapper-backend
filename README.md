# Chiratae LinkedIn Scraper Backend

A robust backend service for managing LinkedIn campaigns and lead scraping, built with Node.js, Express, and Selenium.

## Features

- 🤖 Automated LinkedIn profile scraping
- 📊 Campaign management system
- 🔄 Scheduled scraping campaigns
- 📝 Lead rating and management
- 🔒 Proxy support for IP rotation
- 🚦 Rate limiting and request throttling
- 📧 Email notifications

## Prerequisites

- Node.js >= 20.0.0
- MongoDB
- Redis
- Chrome/Chromium browser
- ChromeDriver

## Installation

1. Clone the repository:
```
git clone https://github.com/your-repo/chiratae-linkedin-scraper-backend.git
```

2. Install dependencies:
```
cd chiratae-linkedin-scraper-backend
npm install
```

3. Configure environment variables:
```
cp .env.example .env
```

## Configuration

Create a `.env` file with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/chiratae-linkedin

# Redis
REDIS_URL=redis://localhost:6379

# LinkedIn Credentials
LINKEDIN_EMAIL=your-email@example.com
LINKEDIN_PASSWORD=your-password

# Email Settings
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

## Usage

Development:
```
npm run dev
```

Production:
```
npm start
```

## API Endpoints

### Campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns/:id/process` - Process campaign manually

### LinkedIn Operations
- `POST /api/linkedin/login` - LinkedIn authentication
- `POST /api/linkedin/search` - Perform LinkedIn search
- `GET /api/linkedin/check-login` - Check login status

## Project Structure

```
├── controllers/    # Route controllers
├── models/        # Database models
├── services/      # Business logic
├── helpers/       # Utility functions
├── routes/        # API routes
└── config/        # Configuration files
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.

## References

For implementation details, see:
```
javascript:controllers/Campaign.controller.js
startLine: 1663
endLine: 1728
```

For campaign processing logic, see:
```
javascript:services/CampaignService.js
startLine: 27
endLine: 81
```

This README provides a comprehensive overview of the project while referencing the key code sections you provided. I've included all essential sections like installation, configuration, usage, and API endpoints based on the codebase.