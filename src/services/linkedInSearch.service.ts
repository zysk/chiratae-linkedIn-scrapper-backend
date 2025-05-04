import { WebDriver, By, WebElement } from "selenium-webdriver";
import Campaign, { ICampaignDocument } from "../models/Campaign.model";
import Lead from "../models/Lead.model";
import PreviousLead from "../models/PreviousLead.model";
import { campaignStatusObj, leadStatusObj } from "../helpers/Constants";
import {
  navigateTo,
  findElementWait,
  findElementSafe,
  sendKeysSafe,
  clickElementSafe,
  randomDelay,
  scrollDownGradually,
  getTextSafe,
} from "../helpers/SeleniumUtils";
import { processLeadScrapingQueue } from "./linkedInProfileScraper.service"; // Import the profile scraper
import { sendCampaignCompletionEmail } from "../services/email.service"; // Import email service
import Logger from "../helpers/Logger";
import { until } from 'selenium-webdriver';
import { webDriverFactory } from './webDriverFactory.service';
import { browserSessionManager } from './browserSession.service';
import linkedInAuthService from './linkedInAuth.service';
import AntiDetectionUtils from '../helpers/antiDetection';
import { linkedInProfileScraper, LinkedInProfile } from './linkedInProfileScraper.service';
import { config } from '../config/config';

// Create a dedicated logger for LinkedIn search
const logger = new Logger({ context: "linkedin-search" });

// --- Constants & Locators (HIGHLY LIKELY TO CHANGE) ---
const SEARCH_URL_BASE =
  "https://www.linkedin.com/search/results/people/?keywords=";
const PEOPLE_FILTER_BUTTON = By.xpath("//button[text()='People']");
const ALL_FILTERS_BUTTON = By.xpath("//button[text()='All filters']");
// Filter panel locators (Examples - MUST BE VERIFIED)
const CURRENT_COMPANY_INPUT = By.xpath(
  "//label[text()='Current company']/following-sibling::input",
);
const PAST_COMPANY_INPUT = By.xpath(
  "//label[text()='Past company']/following-sibling::input",
);
const SCHOOL_INPUT = By.xpath(
  "//label[text()='School']/following-sibling::input",
);
const APPLY_FILTERS_BUTTON = By.xpath("//button/span[text()='Show results']");
// Search results locators (Examples - MUST BE VERIFIED)
const SEARCH_RESULT_LIST = By.css(
  "ul.reusable-search__entity-result-list > li",
); // List items containing profiles
const PROFILE_LINK = By.css('a.app-aware-link[href*="/in/"]'); // Link within the list item
const NEXT_BUTTON = By.xpath("//button[@aria-label='Next']");
const TOTAL_RESULTS_INDICATOR = By.css(".search-results-container h2"); // Example for total results

/**
 * Search filter parameters for LinkedIn
 */
export interface LinkedInSearchFilters {
  keywords?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  school?: string;
  location?: string;
  industry?: string[];
  connectionDegree?: number[];
  currentCompany?: string[];
  pastCompany?: string[];
  profileLanguage?: string;
  openToWork?: boolean;
  currentRole?: string[];
  yearsOfExperience?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

/**
 * Search result interface
 */
export interface SearchResult {
  profileId: string;
  publicUrl: string;
  name: string;
  headline?: string;
  location?: string;
  connectionDegree?: string;
  profileImageUrl?: string;
  profileData?: LinkedInProfile;
}

/**
 * Search results with pagination
 */
export interface SearchResults {
  results: SearchResult[];
  totalResults: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  executionTimeMs: number;
  searchQuery: string;
  filters: LinkedInSearchFilters;
}

/**
 * LinkedIn Search Service
 */
export class LinkedInSearchService {
  private static instance: LinkedInSearchService;
  private logger: Logger;
  private readonly MAX_RETRY_COUNT = 3;
  private readonly LINKEDIN_SEARCH_BASE_URL = 'https://www.linkedin.com/search/results/people/';

  private constructor() {
    this.logger = new Logger('LinkedInSearchService');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): LinkedInSearchService {
    if (!LinkedInSearchService.instance) {
      LinkedInSearchService.instance = new LinkedInSearchService();
    }
    return LinkedInSearchService.instance;
  }

  /**
   * Execute a search on LinkedIn with the given filters
   *
   * @param searchQuery Main search query
   * @param filters Additional search filters
   * @param sessionId Optional existing session ID
   * @param accountId Optional LinkedIn account ID to use
   * @param proxyId Optional proxy ID to use
   * @param page Page number (1-based)
   * @param pageSize Number of results per page
   * @param scrapeProfiles Whether to scrape complete profile data
   * @returns Search results
   */
  public async search(
    searchQuery: string,
    filters: LinkedInSearchFilters = {},
    sessionId?: string,
    accountId?: string,
    proxyId?: string,
    page: number = 1,
    pageSize: number = 10,
    scrapeProfiles: boolean = false
  ): Promise<SearchResults> {
    const startTime = Date.now();
    let driver: WebDriver | null = null;
    let retryCount = 0;

    while (retryCount < this.MAX_RETRY_COUNT) {
      try {
        // Create a new WebDriver instance
        const options = {
          proxy: proxyId,
          headless: config.SELENIUM_HEADLESS !== 'false',
          timeout: parseInt(config.SELENIUM_TIMEOUT),
        };

        driver = await webDriverFactory.createDriver(options);

        // Try to use an existing session
        let authenticated = false;
        if (sessionId && browserSessionManager.isSessionValid(sessionId)) {
          this.logger.info(`Using existing session: ${sessionId}`);
          authenticated = await browserSessionManager.loadSession(driver, sessionId);
        }

        // If no valid session, authenticate with account
        if (!authenticated && accountId) {
          this.logger.info(`No valid session, authenticating with account: ${accountId}`);
          const authResult = await linkedInAuthService.authenticate(accountId, proxyId);

          if (authResult.success && authResult.sessionId) {
            sessionId = authResult.sessionId;
            authenticated = await browserSessionManager.loadSession(driver, sessionId);
          } else {
            throw new Error(`Authentication failed: ${authResult.errorMessage}`);
          }
        }

        if (!authenticated) {
          throw new Error('Failed to authenticate with LinkedIn');
        }

        // Apply anti-detection measures
        await AntiDetectionUtils.applyAllMeasures(driver);

        // Construct and navigate to the search URL
        const searchUrl = this.buildSearchUrl(searchQuery, filters, page);
        this.logger.info(`Executing search: ${searchUrl}`);
        await driver.get(searchUrl);

        // Wait for search results to load
        await driver.wait(until.elementLocated(By.css('.search-results-container')), parseInt(config.SELENIUM_TIMEOUT));

        // Add random delay to mimic human behavior
        await randomDelay(
          parseInt(config.LINKEDIN_SEARCH_DELAY_MIN),
          parseInt(config.LINKEDIN_SEARCH_DELAY_MAX)
        );

        // Extract search results
        const results = await this.extractSearchResults(driver, pageSize);

        // Get pagination info
        const paginationInfo = await this.extractPaginationInfo(driver);

        // If requested, scrape full profiles
        if (scrapeProfiles && sessionId) {
          for (let i = 0; i < results.length; i++) {
            try {
              const profileData = await linkedInProfileScraper.scrapeProfile(
                results[i].publicUrl,
                sessionId,
                accountId,
                proxyId
              );

              if (profileData) {
                results[i].profileData = profileData;
              }

              // Add delay between profile scrapes to avoid rate limiting
              await randomDelay(
                parseInt(config.LINKEDIN_SEARCH_DELAY_MIN),
                parseInt(config.LINKEDIN_SEARCH_DELAY_MAX)
              );
            } catch (profileError) {
              this.logger.error(`Error scraping profile ${results[i].publicUrl}:`, profileError);
            }
          }
        }

        // Close the driver
        if (driver) {
          try {
            await driver.quit();
          } catch (quitError) {
            this.logger.warn('Error closing WebDriver:', quitError);
          }
        }

        const executionTimeMs = Date.now() - startTime;

        // Return structured search results
        return {
          results,
          totalResults: paginationInfo.totalResults,
          page,
          pageSize,
          hasNextPage: paginationInfo.hasNextPage,
          executionTimeMs,
          searchQuery,
          filters
        };
      } catch (error: any) {
        retryCount++;
        this.logger.error(`Error executing search (attempt ${retryCount}/${this.MAX_RETRY_COUNT}):`, error);

        // Close the driver if it exists
        if (driver) {
          try {
            await driver.quit();
          } catch (quitError) {
            // Ignore quit errors
          }
          driver = null;
        }

        // Sleep before retry
        if (retryCount < this.MAX_RETRY_COUNT) {
          const delay = parseInt(config.LINKEDIN_LOGIN_RETRY_DELAY) * retryCount;
          this.logger.info(`Retrying in ${delay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Return empty results after max retries
          return {
            results: [],
            totalResults: 0,
            page,
            pageSize,
            hasNextPage: false,
            executionTimeMs: Date.now() - startTime,
            searchQuery,
            filters
          };
        }
      }
    }

    // This should not be reached, but TypeScript requires a return
    return {
      results: [],
      totalResults: 0,
      page,
      pageSize,
      hasNextPage: false,
      executionTimeMs: Date.now() - startTime,
      searchQuery,
      filters
    };
  }

  /**
   * Build LinkedIn search URL with filters
   *
   * @param searchQuery Main search query
   * @param filters Search filters
   * @param page Page number (1-based)
   * @returns Search URL
   */
  private buildSearchUrl(
    searchQuery: string,
    filters: LinkedInSearchFilters,
    page: number = 1
  ): string {
    // Start with base URL
    let url = this.LINKEDIN_SEARCH_BASE_URL;

    // Add query parameters
    const params = new URLSearchParams();

    // Main search query (keywords)
    if (searchQuery) {
      params.append('keywords', searchQuery);
    }

    // First name filter
    if (filters.firstName) {
      params.append('firstName', filters.firstName);
    }

    // Last name filter
    if (filters.lastName) {
      params.append('lastName', filters.lastName);
    }

    // Title filter
    if (filters.title) {
      params.append('title', filters.title);
    }

    // Company filter
    if (filters.company) {
      params.append('company', filters.company);
    }

    // School filter
    if (filters.school) {
      params.append('school', filters.school);
    }

    // Location filter
    if (filters.location) {
      params.append('geoUrn', `["${filters.location}"]`);
    }

    // Connection degree filters
    if (filters.connectionDegree && filters.connectionDegree.length > 0) {
      const degrees = filters.connectionDegree.map(d => `"${d}"`).join(',');
      params.append('network', `["${degrees}"]`);
    }

    // Current company filters
    if (filters.currentCompany && filters.currentCompany.length > 0) {
      const companies = filters.currentCompany.map(c => `"${c}"`).join(',');
      params.append('currentCompany', `[${companies}]`);
    }

    // Industry filters
    if (filters.industry && filters.industry.length > 0) {
      const industries = filters.industry.map(i => `"${i}"`).join(',');
      params.append('industry', `[${industries}]`);
    }

    // Past company filters
    if (filters.pastCompany && filters.pastCompany.length > 0) {
      const companies = filters.pastCompany.map(c => `"${c}"`).join(',');
      params.append('pastCompany', `[${companies}]`);
    }

    // Profile language filter
    if (filters.profileLanguage) {
      params.append('profileLanguage', `["${filters.profileLanguage}"]`);
    }

    // Open to work filter
    if (filters.openToWork) {
      params.append('serviceCategory', '["OPEN_TO_WORK"]');
    }

    // Set page size (origin=FACETED_SEARCH)
    params.append('origin', 'FACETED_SEARCH');

    // Pagination
    if (page > 1) {
      const start = (page - 1) * 10; // LinkedIn uses 10 results per page
      params.append('start', start.toString());
    }

    // Add params to URL
    url += `?${params.toString()}`;

    return url;
  }

  /**
   * Extract search results from the page
   *
   * @param driver WebDriver instance
   * @param pageSize Number of results to extract
   * @returns Array of search results
   */
  private async extractSearchResults(
    driver: WebDriver,
    pageSize: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      // Look for search result items
      const resultElements = await driver.findElements(By.css('.reusable-search__result-container'));

      // Process up to pageSize results
      const elementsToProcess = Math.min(resultElements.length, pageSize);

      for (let i = 0; i < elementsToProcess; i++) {
        try {
          const resultElement = resultElements[i];

          // Extract profile URL
          const profileLinkElement = await resultElement.findElement(By.css('a.app-aware-link[href*="/in/"]'));
          const profileUrl = await profileLinkElement.getAttribute('href');

          // Extract profileId from URL
          const profileId = this.extractProfileIdFromUrl(profileUrl);

          // Extract name
          const nameElement = await resultElement.findElement(By.css('.entity-result__title-text a'));
          const name = await nameElement.getText();

          // Initialize result object
          const result: SearchResult = {
            profileId,
            publicUrl: profileUrl,
            name: name.replace('• 1st', '').replace('• 2nd', '').replace('• 3rd+', '').trim(),
          };

          // Extract headline (if available)
          try {
            const headlineElement = await resultElement.findElement(By.css('.entity-result__primary-subtitle'));
            result.headline = await headlineElement.getText();
          } catch (e) {
            // Headline is optional
          }

          // Extract location (if available)
          try {
            const locationElement = await resultElement.findElement(By.css('.entity-result__secondary-subtitle'));
            result.location = await locationElement.getText();
          } catch (e) {
            // Location is optional
          }

          // Extract connection degree (if available)
          try {
            const degreeElement = await resultElement.findElement(By.css('.dist-value'));
            result.connectionDegree = await degreeElement.getText();
          } catch (e) {
            // Try alternate method - look in the name text
            if (name.includes('• 1st')) {
              result.connectionDegree = '1st';
            } else if (name.includes('• 2nd')) {
              result.connectionDegree = '2nd';
            } else if (name.includes('• 3rd+')) {
              result.connectionDegree = '3rd+';
            }
          }

          // Extract profile image (if available)
          try {
            const imgElement = await resultElement.findElement(By.css('.presence-entity__image'));
            result.profileImageUrl = await imgElement.getAttribute('src');
          } catch (e) {
            // Profile image is optional
          }

          results.push(result);
        } catch (resultError) {
          this.logger.debug(`Error extracting search result ${i}:`, resultError);
        }
      }
    } catch (error) {
      this.logger.error('Error extracting search results:', error);
    }

    return results;
  }

  /**
   * Extract pagination information
   *
   * @param driver WebDriver instance
   * @returns Pagination information
   */
  private async extractPaginationInfo(driver: WebDriver): Promise<{ totalResults: number; hasNextPage: boolean }> {
    try {
      // Get total results count
      const paginationElement = await driver.findElement(By.css('.search-results-container .pb2'));
      const paginationText = await paginationElement.getText();

      // Extract the number from text like "Showing 1-10 of 1,234 results"
      const match = paginationText.match(/of ([\d,]+) results/i);
      const totalResults = match ? parseInt(match[1].replace(/,/g, '')) : 0;

      // Check if there's a next page button
      let hasNextPage = false;
      try {
        const nextButton = await driver.findElement(By.css('button[aria-label="Next"]'));
        const isDisabled = await nextButton.getAttribute('disabled');
        hasNextPage = isDisabled !== 'true';
      } catch (e) {
        // No next button means there's no next page
        hasNextPage = false;
      }

      return { totalResults, hasNextPage };
    } catch (error) {
      this.logger.error('Error extracting pagination info:', error);
      return { totalResults: 0, hasNextPage: false };
    }
  }

  /**
   * Extract profile ID from LinkedIn profile URL
   *
   * @param profileUrl LinkedIn profile URL
   * @returns Profile ID
   */
  private extractProfileIdFromUrl(profileUrl: string): string {
    try {
      // Match the profile ID from /in/username pattern
      const match = profileUrl.match(/linkedin\.com\/in\/([^/?&]+)/i);
      return match ? match[1] : profileUrl;
    } catch (error) {
      return profileUrl;
    }
  }
}

// Singleton instance for easy import
export const linkedInSearchService = LinkedInSearchService.getInstance();
export default linkedInSearchService;
