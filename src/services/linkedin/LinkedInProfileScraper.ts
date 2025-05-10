import { rolesObj } from '../../utils/constants';
import fs from 'fs/promises';
import { WebDriver, By, until } from 'selenium-webdriver';
import logger from '../../utils/logger';
import { normalizeLinkedInUrl, extractProfileId, extractCleanName } from '../../utils/linkedin.utils';
import User from '../../models/user.model';
import Lead from '../../models/lead.model';
import mongoose from 'mongoose';
import { randomDelay } from '../../utils/delay';
import { LinkedInProfileData } from '../../types/linkedin.types';
import path from 'path';
import WebDriverManager from '../selenium/WebDriverManager';
import SeleniumService from '../selenium/SeleniumService';
import { ILinkedInAccount } from '../../models/linkedinAccount.model';
import { IProxy } from '../../models/proxy.model';
import LinkedInAuthService from './LinkedInAuthService';

/**
 * Interface for education data
 */
interface EducationData {
  school: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

/**
 * Interface for experience data
 */
interface ExperienceData {
  title: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  isCurrentRole?: boolean;
}

/**
 * Interface for contact information
 */
interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
}

/**
 * Interface for profile data
 */
export interface ProfileData {
  profileId: string;
  profileUrl: string;
  name: string;
  headline?: string;
  location?: string;
  summary?: string;
  currentPosition?: string;
  experienceArr?: ExperienceData[];
  educationArr?: EducationData[];
  contactInfo?: ContactInfo;
  skills?: string[];
  imageUrl?: string;
}

interface IScrapeResult {
  success: boolean;
  profileData?: LinkedInProfileData;
  message?: string;
}

/**
 * LinkedInProfileScraper class
 * Service for scraping LinkedIn profiles
 */
export class LinkedInProfileScraper {
  private static instance: LinkedInProfileScraper;
  private webDriverManager: typeof WebDriverManager;
  private linkedInAuthService: typeof LinkedInAuthService;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.webDriverManager = WebDriverManager;
    this.linkedInAuthService = LinkedInAuthService;
  }

  /**
   * Get singleton instance
   * @returns LinkedInProfileScraper instance
   */
  public static getInstance(): LinkedInProfileScraper {
    if (!LinkedInProfileScraper.instance) {
      LinkedInProfileScraper.instance = new LinkedInProfileScraper();
    }
    return LinkedInProfileScraper.instance;
  }

  /**
   * Scrape a LinkedIn profile
   */
  public async scrapeProfile(
    profileUrl: string,
    campaignId: string,
    linkedInAccount: ILinkedInAccount,
    password: string,
    proxy?: IProxy
  ): Promise<IScrapeResult> {
    let driver: WebDriver | null = null;
    try {
      // Get or create a WebDriver with session management
      driver = await this.webDriverManager.getDriver(campaignId, {
        headless: true,
        proxy,
        linkedInAccount,
        password
      });

      if (!driver) {
        throw new Error('Failed to initialize WebDriver');
      }

      // Navigate to the profile page
      logger.info(`Navigating to profile: ${profileUrl}`);
      await driver.get(profileUrl);

      // Check if we're on the login page
      const isLoginPage = await this.linkedInAuthService.isOnLoginPage(driver);
      if (isLoginPage) {
        logger.warn('Redirected to login page, attempting to reuse existing session');

        // Try to get an existing session
        const existingDriver = await this.webDriverManager.getExistingSession(linkedInAccount.username);
        if (existingDriver) {
          driver = existingDriver;
          await driver.get(profileUrl);
        } else {
          // No valid session exists, login and try again
          logger.info('No valid session found, logging in');
          const loginResult = await this.linkedInAuthService.login(linkedInAccount, password, proxy);
          if (!loginResult.success || !loginResult.driver) {
            throw new Error(`Failed to login: ${loginResult.message}`);
          }
          driver = loginResult.driver;
          await driver.get(profileUrl);
        }
      }

      // Wait for the page to load
      await driver.wait(until.elementLocated(By.css('body')), 10000);

      // Add additional wait to ensure dynamic content loads
      await driver.sleep(3000);

      // Check if we're logged in by looking for login-required elements
      try {
        const signInButtons = await driver.findElements(By.css('.authwall-join-form, .login-form'));
        if (signInButtons.length > 0) {
          throw new Error('Not logged in to LinkedIn. Please check cookies.');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Not logged in')) {
          throw error;
        }
        // Ignore other errors here as we're just checking login status
      }

      // Extract profile data
      const name = await this.extractName(driver);
      logger.info(`Extracted name: ${name}`);

      const headline = await this.extractHeadline(driver);
      logger.info(`Extracted headline: ${headline || 'Not found'}`);

      const location = await this.extractLocation(driver);
      logger.info(`Extracted location: ${location || 'Not found'}`);

      // Extract about section (renamed to summary for interface compatibility)
      const summary = await this.extractAbout(driver);
      logger.info(`Extracted summary: ${summary ? 'Found' : 'Not found'}`);

      // Construct and return the profile data
      const profileData: LinkedInProfileData = {
        profileId: extractProfileId(profileUrl),
        profileUrl,
        name,
        headline,
        location,
        summary
      };

      // Validate that essential fields are present
      if (!profileData.name || !profileData.profileId) {
        logger.error(`Scraped profile data for ${profileUrl} is missing essential fields`);
        logger.debug(`Incomplete profile data: ${JSON.stringify(profileData)}`);

        // Take a screenshot for debugging
        if (driver) {
          await this.takeErrorScreenshot(driver, `missing-data-${profileData.profileId}`);
        }

        throw new Error(`Failed to extract essential profile data (name, ID) for ${profileUrl}`);
      }

      // Add debug logging before returning
      logger.debug(`Successfully scraped profile data for ${profileUrl}: ${JSON.stringify({
        profileId: profileData.profileId,
        name: profileData.name,
        location: profileData.location,
        summary: profileData.summary ? 'Present' : 'Not found',
      })}`);

      return {
        success: true,
        profileData
      };

    } catch (error) {
      logger.error(`Error scraping LinkedIn profile ${profileUrl}: ${error instanceof Error ? error.message : String(error)}`);

      // Save screenshot on error if driver is available
      if (driver) {
        await this.takeErrorScreenshot(driver, `scrape-error-${campaignId}`);
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Take a screenshot when an error occurs
   * @param driver WebDriver instance
   * @param errorType Type of error for filename
   */
  private async takeErrorScreenshot(driver: WebDriver, errorType: string): Promise<void> {
    try {
      // Save error screenshot
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(process.cwd(), 'screenshots', `${errorType}-${timestamp}.png`);
      const screenshotData = await driver.takeScreenshot();
      await fs.writeFile(screenshotPath, screenshotData, 'base64');
      logger.info(`Error screenshot saved to ${screenshotPath}`);
    } catch (screenshotError) {
      logger.warn(`Failed to save error screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
    }
  }

  /**
   * Extract profile name
   * @param driver WebDriver instance
   * @returns Profile name
   */
  private async extractName(driver: WebDriver): Promise<string> {
    try {
      // Try multiple selectors to handle different LinkedIn profile page layouts
      const selectors = [
        ".pv-top-card h1",
        ".text-heading-xlarge",
        "h1.text-heading-xlarge",
        "div.ph5 div.mt2 h1",
        "div.ph5 h1",
        "div.display-flex h1",
        "[data-test-id='profile-topcard-name']",
        "section.artdeco-card h1"
      ];

      for (const selector of selectors) {
        try {
          const elements = await driver.findElements(By.css(selector));
          if (elements.length > 0) {
            const fullName = await elements[0].getText();
            logger.info(`Successfully extracted name using selector: ${selector}`);
            return extractCleanName(fullName);
          }
        } catch (error) {
          // Continue to next selector on error
          continue;
        }
      }

      // If we get here, none of the selectors worked
      logger.warn("All name extraction selectors failed");
      return 'Unknown Name';
    } catch (error) {
      logger.warn(`Error extracting name: ${error instanceof Error ? error.message : String(error)}`);
      return 'Unknown Name';
    }
  }

  /**
   * Extract profile headline
   * @param driver WebDriver instance
   * @returns Profile headline
   */
  private async extractHeadline(driver: WebDriver): Promise<string | undefined> {
    try {
      // Try multiple selectors for headline
      const selectors = [
        ".pv-top-card .text-body-medium",
        ".text-body-medium.break-words",
        ".ph5 .mt1 .text-body-medium",
        "[data-test-id='profile-topcard-headline']",
        "section.artdeco-card div.text-body-medium"
      ];

      for (const selector of selectors) {
        try {
          const elements = await driver.findElements(By.css(selector));
          if (elements.length > 0) {
            logger.info(`Successfully extracted headline using selector: ${selector}`);
            return await elements[0].getText();
          }
        } catch (error) {
          // Continue to next selector
          continue;
        }
      }

      // If we get here, none of the selectors worked
      logger.warn("All headline extraction selectors failed");
      return undefined;
    } catch (error) {
      logger.warn(`Error extracting headline: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Extract profile location
   * @param driver WebDriver instance
   * @returns Profile location
   */
  private async extractLocation(driver: WebDriver): Promise<string | undefined> {
    try {
      // Try multiple selectors for location
      const selectors = [
        ".pv-top-card .text-body-small.inline.t-black--light.break-words",
        ".pv-text-details__left-panel .text-body-small",
        ".ph5 .mt2 span.text-body-small",
        ".pv-text-details__left-panel span.text-body-small",
        "[data-test-id='profile-topcard-location']",
        "section.artdeco-card .text-body-small.inline.t-black--light"
      ];

      for (const selector of selectors) {
        try {
          const elements = await driver.findElements(By.css(selector));
          if (elements.length > 0) {
            logger.info(`Successfully extracted location using selector: ${selector}`);
            return await elements[0].getText();
          }
        } catch (error) {
          // Continue to next selector
          continue;
        }
      }

      // If we get here, none of the selectors worked
      logger.warn("All location extraction selectors failed");
      return undefined;
    } catch (error) {
      logger.warn(`Error extracting location: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Extract profile about section
   * @param driver WebDriver instance
   * @returns Profile about section
   */
  private async extractAbout(driver: WebDriver): Promise<string | undefined> {
    try {
      // Try to find the About section
      const selectors = [
        "#about ~ .pvs-header__title",
        "[data-field='about'] .pvs-header__title",
        "section#about .pvs-header__title",
        "section.artdeco-card .pvs-header__title:contains('About')",
        // Additional selectors for the about section
        ".pv-about-section",
        ".display-flex .pv-shared-text-with-see-more",
        ".pv-about__summary-text",
        "[data-section='summary']"
      ];

      // First, try to find and click on the About section header if it exists
      for (const selector of selectors) {
        try {
          const aboutElements = await driver.findElements(By.css(selector));
          if (aboutElements.length > 0) {
            // Try to find the text content
            const contentSelectors = [
              "div.display-flex ~ .pv-shared-text-with-see-more div.inline-show-more-text",
              "div.pvs-list__outer-container .pvs-list div.inline-show-more-text",
              "section.pv-about-section div.inline-show-more-text",
              ".pv-about__summary-text .inline-show-more-text",
              // Direct content selectors
              ".pv-shared-text-with-see-more",
              ".inline-show-more-text",
              ".lt-line-clamp__raw-line"
            ];

            for (const contentSelector of contentSelectors) {
              try {
                const contentElements = await driver.findElements(By.css(contentSelector));
                if (contentElements.length > 0) {
                  logger.info(`Successfully extracted about section using selector: ${contentSelector}`);
                  return await contentElements[0].getText();
                }
              } catch (error) {
                continue;
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      logger.warn("Could not find or extract About section");
      return undefined;
    } catch (error) {
      logger.warn(`Error extracting about section: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }
}

export default LinkedInProfileScraper.getInstance();
