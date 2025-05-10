# LinkedIn Scraper Architecture

This document explains the architecture of the LinkedIn scraper system, focusing on the WebDriver management and profile scraping process.

## Overview

The LinkedIn scraper system has been designed to efficiently manage WebDriver instances and handle multiple scraping tasks while maintaining session integrity. The architecture follows these key principles:

1. One WebDriver instance per campaign
2. Login verification during LinkedIn account creation/update
3. Centralized WebDriver management to prevent resource waste
4. Campaign-level queueing to prevent concurrent processing

## Key Components

### 1. WebDriverManager

The `WebDriverManager` is a singleton class responsible for creating, tracking, and destroying WebDriver instances. It ensures that:

- Each campaign has at most one active WebDriver instance
- WebDriver instances are properly cleaned up after use
- Active drivers are reused across requests within the same campaign

**Key Methods:**
- `getDriver(campaignId, options)` - Get an existing driver or create a new one
- `quitDriver(campaignId)` - Quit a specific campaign's driver
- `quitAllDrivers()` - Quit all active drivers (used during shutdown)
- `setAccountForCampaign(campaignId, accountId)` - Associate a LinkedIn account with a campaign
- `hasActiveDriver(campaignId)` - Check if a campaign has an active driver

### 2. LinkedInProfileScraper

The `LinkedInProfileScraper` handles the actual scraping of LinkedIn profiles. It has been refactored to:

- Use the `WebDriverManager` for driver instances
- Support campaign-specific scraping
- Utilize existing WebDriver instances when appropriate
- Handle different LinkedIn profile page layouts through multiple selectors

**Key Methods:**
- `scrapeProfile(profileUrl, campaignId, useExistingDriver)` - Extract data from a LinkedIn profile
- Multiple extraction methods for different profile components (name, headline, etc.)

### 3. LeadProcessingService

The `LeadProcessingService` manages the queue of LinkedIn profiles to be scraped for a campaign. It now:

- Tracks which campaigns are currently being processed
- Requeues jobs if a campaign is already being processed
- Ensures proper cleanup of WebDriver instances after campaign completion
- Manages campaign-level concurrency

**Key Methods:**
- `queueCampaignLeads(campaignId, priority)` - Queue all leads in a campaign for scraping
- `processProfileScrapingJob(jobId, campaignId, leadId, profileUrl)` - Process a single lead
- `checkCampaignCompletion(campaignId)` - Check if all leads in a campaign have been processed

### 4. LinkedInAuthService

The `LinkedInAuthService` handles LinkedIn authentication. It now:

- Verifies credentials during account creation/update
- Handles various LinkedIn authentication challenges (CAPTCHA, OTP, etc.)
- Provides detailed error information for failed login attempts

## Process Flow

### Campaign Profile Scraping

1. When a campaign is initiated, `LeadProcessingService.queueCampaignLeads()` queues all leads for processing
2. For each lead, a job is added to the queue
3. `LeadProcessingService.processProfileScrapingJob()` processes each job:
   - It checks if the campaign is already being processed
   - If so, it requeues the job with a delay
   - If not, it marks the campaign as being processed
   - It gets or creates a WebDriver instance via the `WebDriverManager`
   - It uses `LinkedInProfileScraper` to extract profile data
   - It updates the lead with the extracted data
   - It updates campaign statistics
   - It marks the job as completed
   - It marks the campaign as not being processed
4. When all jobs are completed, `LeadProcessingService.checkCampaignCompletion()` cleans up resources

### LinkedIn Account Verification

1. When a LinkedIn account is created or updated, credentials are verified
2. `LinkedInAuthService.login()` attempts to log in to LinkedIn
3. If successful, the account is saved
4. If challenges (CAPTCHA, OTP) are encountered, they are reported to the user
5. If the credentials are invalid, an error is raised
6. The temporary WebDriver is always cleaned up properly

## Browser Instance Management Rules

1. **Only one login per campaign**: Each campaign uses a single WebDriver instance for all its operations
2. **Campaign isolation**: Different campaigns use separate WebDriver instances
3. **Cleanup on completion**: WebDriver instances are properly destroyed after campaign completion
4. **No concurrent processing**: A campaign can only have one active scraping job at any time
5. **Automatic recovery**: If a WebDriver instance becomes invalid, a new one is created automatically
6. **Resource efficiency**: WebDriver instances are shared between operations of the same campaign

## Error Handling

1. Screenshots are taken when profile scraping fails
2. Detailed logs are maintained throughout the process
3. Jobs are requeued with exponential back-off after failures
4. Campaign resources are properly cleaned up even after errors

## Recommendations for Developers

1. Always use the `WebDriverManager` to get and manage WebDriver instances
2. Never create WebDriver instances directly in controller endpoints
3. Use campaign IDs consistently to ensure proper resource sharing
4. Check if a campaign is already being processed before starting new operations
5. Always clean up WebDriver instances when they are no longer needed
6. Use the `scrapeProfile` method with the appropriate parameters when scraping profiles
