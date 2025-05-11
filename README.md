# LinkedIn Profile Scraper Backend

This TypeScript-based backend service provides functionality to scrape LinkedIn profiles and extract structured data.

## Features

- 🤖 Automated LinkedIn profile data extraction
- 📊 Structured data format for all profile sections
- 🛡️ Robust error handling and recovery
- 🔄 Automatic selector verification and optimization
- 📝 Comprehensive logging

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables (copy `.env.example` to `.env` and update):
   ```
   cp .env.example .env
   ```

3. Run the development server:
   ```
   npm run dev
   ```

## Selector Verification

The LinkedIn scraper includes a built-in selector verification system that helps ensure reliable data extraction despite LinkedIn's frequent UI changes.

### How It Works

1. The `SelectorVerifier` class tracks the success/failure rate of each CSS selector
2. Multiple selectors are attempted for each data field, with statistics tracked on which ones work
3. The scraper self-optimizes by prioritizing selectors with higher success rates
4. Health metrics are generated to identify selectors that need maintenance

### Verifying Selectors

To test selectors against a real LinkedIn profile and generate health metrics:

```bash
# Run the verification tool
npm run verify-selectors -- --url <linkedin-profile-url> --output ./metrics.json

# For verbose output
npm run verify-selectors -- --url <linkedin-profile-url> --verbose
```

### Updating Selectors

When LinkedIn updates their UI, you can use the selector update tool to identify and fix selectors that no longer work:

```bash
# Analyze health metrics and update selectors interactively
npm run update-selectors -- --input ./metrics.json --threshold 0.3

# Focus on a specific category of selectors
npm run update-selectors -- --input ./metrics.json --category "Recommendations"
```

The tool will:
1. Identify poorly performing selectors based on the threshold
2. Show examples of working selectors for reference
3. Let you interactively decide which selectors to replace or remove
4. Provide guidance on where to update the code

### Interpreting Health Metrics

The health metrics file contains information about each selector:

- `successRate`: percentage of successful selector usages (higher is better)
- `successCount`: number of times the selector found valid data
- `failureCount`: number of times the selector failed
- `lastText`: sample of the last extracted text (helpful for debugging)

Selectors with low success rates may need updating to match LinkedIn's current UI.

## Supported Profile Data

The scraper extracts the following information:

- Basic Profile Information
  - First & Last Name
  - Headline
  - Location
  - About
  - Profile Picture
  - Background Image

- Professional Information
  - Experience
  - Education
  - Skills
  - Certifications
  - Volunteering
  - Awards
  - Recommendations

- Additional Information
  - Interests
  - Languages
  - Contact Information
  - Endorsements

## API Endpoints

Documentation for API endpoints available at `/api-docs` when running the server.

## License

MIT


# Using email/password:
npm run verify-selectors -- -u https://www.linkedin.com/in/some-profile -e your-linkedin@email.com -p yourpassword

# Using an account ID from the database:
npm run verify-selectors -- -u https://www.linkedin.com/in/some-profile -i 61234567890abcdef1234567

# Update selectors with authentication:
npm run update-selectors -- -i ./selector-health.json -e your-linkedin@email.com -p yourpassword