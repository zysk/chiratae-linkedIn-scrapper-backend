import { WebDriver, By, until } from 'selenium-webdriver';
import { Logger } from './logger.service';
import { webDriverFactory } from './webDriverFactory.service';
import { browserSessionManager } from './browserSession.service';
import linkedInAuthService from './linkedInAuth.service';
import AntiDetectionUtils from '../helpers/antiDetection';
import { randomDelay } from '../helpers/SeleniumUtils';
import { config } from '../config/config';

/**
 * LinkedIn Profile Data Structure
 */
export interface LinkedInProfile {
  profileId: string;
  publicUrl?: string;
  firstName: string;
  lastName: string;
  headline?: string;
  company?: string;
  currentRole?: string;
  location?: string;
  connectionDegree?: string;
  profileImageUrl?: string;
  about?: string;
  experience?: {
    title: string;
    company: string;
    dateRange: string;
    description?: string;
    location?: string;
  }[];
  education?: {
    school: string;
    degree?: string;
    field?: string;
    dateRange?: string;
  }[];
  skills?: string[];
  recommendationCount?: number;
  connectionCount?: number;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
    twitter?: string;
    linkedIn?: string;
    other?: string[];
  };
  extractedTimestamp: Date;
  raw?: string; // Raw HTML or additional data (optional)
}

/**
 * LinkedIn Profile Scraper Service
 */
export class LinkedInProfileScraperService {
  private static instance: LinkedInProfileScraperService;
  private logger: Logger;
  private readonly MAX_RETRY_COUNT = 3;

  private constructor() {
    this.logger = new Logger('LinkedInProfileScraper');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): LinkedInProfileScraperService {
    if (!LinkedInProfileScraperService.instance) {
      LinkedInProfileScraperService.instance = new LinkedInProfileScraperService();
    }
    return LinkedInProfileScraperService.instance;
  }

  /**
   * Scrape a LinkedIn profile by URL
   *
   * @param profileUrl LinkedIn profile URL
   * @param sessionId Optional existing session ID
   * @param accountId Optional LinkedIn account ID to use
   * @param proxyId Optional proxy ID to use
   * @returns Scraped profile data
   */
  public async scrapeProfile(
    profileUrl: string,
    sessionId?: string,
    accountId?: string,
    proxyId?: string
  ): Promise<LinkedInProfile | null> {
    let driver: WebDriver | null = null;
    let retryCount = 0;
    let profile: LinkedInProfile | null = null;

    while (retryCount < this.MAX_RETRY_COUNT && !profile) {
      try {
        // Create a new WebDriver instance
        const options = {
          proxy: proxyId,
          headless: config.SELENIUM_HEADLESS !== 'false',
          timeout: 60000,
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

        // Navigate to the profile URL
        this.logger.info(`Navigating to profile: ${profileUrl}`);
        await driver.get(profileUrl);

        // Wait for the profile page to load
        await driver.wait(until.elementLocated(By.css('.pv-top-card')), 20000);

        // Add random delay to mimic human behavior
        await randomDelay(2000, 4000);

        // Extract profile data
        profile = await this.extractProfileData(driver, profileUrl);

        this.logger.info(`Successfully scraped profile: ${profile.firstName} ${profile.lastName}`);
      } catch (error: any) {
        retryCount++;
        this.logger.error(`Error scraping profile (attempt ${retryCount}/${this.MAX_RETRY_COUNT}):`, error);

        // Sleep before retry
        if (retryCount < this.MAX_RETRY_COUNT) {
          const delay = 5000 * retryCount; // Increase delay with each retry
          this.logger.info(`Retrying in ${delay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } finally {
        // Close the driver
        if (driver) {
          try {
            await driver.quit();
          } catch (quitError) {
            this.logger.warn('Error closing WebDriver:', quitError);
          }
        }
      }
    }

    return profile;
  }

  /**
   * Extract profile data from the loaded LinkedIn profile page
   *
   * @param driver WebDriver instance
   * @param profileUrl Original profile URL
   * @returns Structured profile data
   */
  private async extractProfileData(driver: WebDriver, profileUrl: string): Promise<LinkedInProfile> {
    try {
      // Initialize the profile object
      const profile: LinkedInProfile = {
        profileId: this.extractProfileId(profileUrl),
        publicUrl: await driver.getCurrentUrl(),
        firstName: '',
        lastName: '',
        extractedTimestamp: new Date()
      };

      // Extract basic information from the top card
      const nameElement = await driver.findElement(By.css('.pv-top-card .text-heading-xlarge'));
      const fullName = await nameElement.getText();
      const nameParts = fullName.trim().split(' ');
      profile.firstName = nameParts[0];
      profile.lastName = nameParts.slice(1).join(' ');

      // Extract headline
      try {
        const headlineElement = await driver.findElement(By.css('.pv-top-card .text-body-medium'));
        profile.headline = await headlineElement.getText();
      } catch (error) {
        this.logger.debug('Headline not found');
      }

      // Extract location
      try {
        const locationElement = await driver.findElement(By.css('.pv-top-card .text-body-small:nth-child(2)'));
        profile.location = await locationElement.getText();
      } catch (error) {
        this.logger.debug('Location not found');
      }

      // Extract current company/position
      try {
        const currentPositionElement = await driver.findElement(By.css('.pv-top-card .pv-text-details__right-panel-item'));
        const currentPosition = await currentPositionElement.getText();
        if (currentPosition.includes(' at ')) {
          const [role, company] = currentPosition.split(' at ').map(s => s.trim());
          profile.currentRole = role;
          profile.company = company;
        } else {
          profile.company = currentPosition;
        }
      } catch (error) {
        this.logger.debug('Current position not found');
      }

      // Extract connection degree
      try {
        const degreeElement = await driver.findElement(By.css('.dist-value'));
        const degreeText = await degreeElement.getText();
        profile.connectionDegree = degreeText;
      } catch (error) {
        this.logger.debug('Connection degree not found');
      }

      // Extract profile image
      try {
        const imgElement = await driver.findElement(By.css('.pv-top-card-profile-picture__image'));
        profile.profileImageUrl = await imgElement.getAttribute('src');
      } catch (error) {
        this.logger.debug('Profile image not found');
      }

      // Scroll down to load more sections
      await AntiDetectionUtils.humanLikeScrolling(driver, 1500, 8);
      await randomDelay(1000, 2000);

      // Extract about section
      try {
        const aboutElement = await driver.findElement(By.css('#about ~ .pvs-list__outer-container .display-flex'));
        profile.about = await aboutElement.getText();
      } catch (error) {
        this.logger.debug('About section not found');
      }

      // Extract experience
      profile.experience = await this.extractExperience(driver);

      // Extract education
      profile.education = await this.extractEducation(driver);

      // Extract skills
      profile.skills = await this.extractSkills(driver);

      // More scrolling to reveal additional sections
      await AntiDetectionUtils.humanLikeScrolling(driver, 1000, 6);
      await randomDelay(1000, 2000);

      // Extract recommendations count
      try {
        const recommendationsElement = await driver.findElement(By.css('section#recommendations .pvs-header__subtitle'));
        const recText = await recommendationsElement.getText();
        const match = recText.match(/(\d+)/);
        if (match) {
          profile.recommendationCount = parseInt(match[1], 10);
        }
      } catch (error) {
        this.logger.debug('Recommendations count not found');
      }

      // Extract contact info through button click
      try {
        // Find and click the contact info button
        const contactInfoButton = await driver.findElement(By.css('a[href*="detail/contact-info"]'));
        await contactInfoButton.click();

        // Wait for the modal to appear
        await driver.wait(until.elementLocated(By.css('.artdeco-modal')), 5000);
        await randomDelay(800, 1500);

        // Extract contact info
        profile.contactInfo = await this.extractContactInfo(driver);

        // Close the modal
        const closeButton = await driver.findElement(By.css('.artdeco-modal__dismiss'));
        await closeButton.click();
        await randomDelay(500, 1000);
      } catch (error) {
        this.logger.debug('Could not extract contact info:', error);
      }

      return profile;
    } catch (error) {
      this.logger.error('Error extracting profile data:', error);
      throw error;
    }
  }

  /**
   * Extract experience sections
   *
   * @param driver WebDriver instance
   * @returns Array of experience items
   */
  private async extractExperience(driver: WebDriver): Promise<any[]> {
    const experience: any[] = [];

    try {
      // Locate the experience section
      const experienceSection = await driver.findElement(By.css('#experience'));

      // Scroll to the experience section
      await driver.executeScript('arguments[0].scrollIntoView()', experienceSection);
      await randomDelay(800, 1500);

      // Find all experience list items
      const experienceItems = await driver.findElements(By.css('#experience ~ div .pvs-entity'));

      for (const item of experienceItems) {
        try {
          const titleElement = await item.findElement(By.css('.t-bold span[aria-hidden="true"]'));
          const title = await titleElement.getText();

          const companyElement = await item.findElement(By.css('.t-14.t-normal span[aria-hidden="true"]'));
          const company = await companyElement.getText();

          const dateRangeElement = await item.findElement(By.css('.t-14.t-normal.t-black--light span[aria-hidden="true"]'));
          const dateRange = await dateRangeElement.getText();

          let description = '';
          try {
            const descElement = await item.findElement(By.css('.pv-entity__description'));
            description = await descElement.getText();
          } catch (e) {
            // Description is optional
          }

          let location = '';
          try {
            const locationElement = await item.findElement(By.css('.t-14.t-normal.t-black--light:nth-child(4) span[aria-hidden="true"]'));
            location = await locationElement.getText();
          } catch (e) {
            // Location is optional
          }

          experience.push({
            title,
            company,
            dateRange,
            description,
            location
          });
        } catch (itemError) {
          this.logger.debug('Error parsing experience item:', itemError);
        }
      }
    } catch (error) {
      this.logger.debug('Could not extract experience section:', error);
    }

    return experience;
  }

  /**
   * Extract education sections
   *
   * @param driver WebDriver instance
   * @returns Array of education items
   */
  private async extractEducation(driver: WebDriver): Promise<any[]> {
    const education: any[] = [];

    try {
      // Locate the education section
      const educationSection = await driver.findElement(By.css('#education'));

      // Scroll to the education section
      await driver.executeScript('arguments[0].scrollIntoView()', educationSection);
      await randomDelay(800, 1500);

      // Find all education list items
      const educationItems = await driver.findElements(By.css('#education ~ div .pvs-entity'));

      for (const item of educationItems) {
        try {
          const schoolElement = await item.findElement(By.css('.t-bold span[aria-hidden="true"]'));
          const school = await schoolElement.getText();

          let degree = '';
          let field = '';

          try {
            const degreeElement = await item.findElement(By.css('.t-14.t-normal span[aria-hidden="true"]'));
            const degreeText = await degreeElement.getText();

            // Parse degree and field from combined text (e.g., "Bachelor's degree, Computer Science")
            if (degreeText.includes(',')) {
              [degree, field] = degreeText.split(',').map(s => s.trim());
            } else {
              degree = degreeText;
            }
          } catch (e) {
            // Degree info is optional
          }

          let dateRange = '';
          try {
            const dateElement = await item.findElement(By.css('.t-14.t-normal.t-black--light span[aria-hidden="true"]'));
            dateRange = await dateElement.getText();
          } catch (e) {
            // Date range is optional
          }

          education.push({
            school,
            degree,
            field,
            dateRange
          });
        } catch (itemError) {
          this.logger.debug('Error parsing education item:', itemError);
        }
      }
    } catch (error) {
      this.logger.debug('Could not extract education section:', error);
    }

    return education;
  }

  /**
   * Extract skills from profile
   *
   * @param driver WebDriver instance
   * @returns Array of skills
   */
  private async extractSkills(driver: WebDriver): Promise<string[]> {
    const skills: string[] = [];

    try {
      // Locate the skills section and try to expand it if possible
      try {
        const skillsSection = await driver.findElement(By.css('#skills'));

        // Scroll to the skills section
        await driver.executeScript('arguments[0].scrollIntoView()', skillsSection);
        await randomDelay(800, 1500);

        // Try to click "Show more" if it exists
        try {
          const showMoreButton = await driver.findElement(By.css('#skills ~ div button[aria-expanded="false"]'));
          await showMoreButton.click();
          await randomDelay(1000, 2000);
        } catch (e) {
          // No show more button or already expanded
        }
      } catch (e) {
        this.logger.debug('Skills section not found');
        return skills;
      }

      // Extract all visible skills
      const skillElements = await driver.findElements(By.css('#skills ~ div .pvs-entity .t-bold span[aria-hidden="true"]'));

      for (const skillElement of skillElements) {
        const skill = await skillElement.getText();
        if (skill) {
          skills.push(skill.trim());
        }
      }
    } catch (error) {
      this.logger.debug('Could not extract skills:', error);
    }

    return skills;
  }

  /**
   * Extract contact information from the contact info modal
   *
   * @param driver WebDriver instance
   * @returns Contact information object
   */
  private async extractContactInfo(driver: WebDriver): Promise<any> {
    const contactInfo: any = {};

    try {
      // Get all contact info sections
      const sections = await driver.findElements(By.css('.artdeco-modal__content section'));

      for (const section of sections) {
        try {
          const headerElement = await section.findElement(By.css('.pv-contact-info__header'));
          const header = await headerElement.getText();
          const headerLower = header.toLowerCase();

          if (headerLower.includes('email')) {
            const emailElement = await section.findElement(By.css('.pv-contact-info__ci-container a'));
            contactInfo.email = await emailElement.getText();
          } else if (headerLower.includes('phone')) {
            const phoneElement = await section.findElement(By.css('.pv-contact-info__ci-container span'));
            contactInfo.phone = await phoneElement.getText();
          } else if (headerLower.includes('twitter')) {
            const twitterElement = await section.findElement(By.css('.pv-contact-info__ci-container a'));
            contactInfo.twitter = await twitterElement.getAttribute('href');
          } else if (headerLower.includes('linkedin')) {
            const linkedInElement = await section.findElement(By.css('.pv-contact-info__ci-container a'));
            contactInfo.linkedIn = await linkedInElement.getAttribute('href');
          } else if (headerLower.includes('website') || headerLower.includes('websites')) {
            const websiteElement = await section.findElement(By.css('.pv-contact-info__ci-container a'));
            contactInfo.website = await websiteElement.getAttribute('href');
          } else {
            // Handle other contact types
            contactInfo.other = contactInfo.other || [];
            const valueElement = await section.findElement(By.css('.pv-contact-info__ci-container'));
            const value = await valueElement.getText();
            contactInfo.other.push({ type: header, value });
          }
        } catch (sectionError) {
          // Skip sections with errors
        }
      }
    } catch (error) {
      this.logger.debug('Error extracting contact info from modal:', error);
    }

    return contactInfo;
  }

  /**
   * Extract profile ID from LinkedIn profile URL
   *
   * @param profileUrl LinkedIn profile URL
   * @returns Profile ID
   */
  private extractProfileId(profileUrl: string): string {
    try {
      // Extract from /in/username format
      const inMatch = profileUrl.match(/linkedin\.com\/in\/([^/]+)/);
      if (inMatch) {
        return inMatch[1];
      }

      // Extract from /mwlite/in/username format (mobile)
      const mwliteMatch = profileUrl.match(/linkedin\.com\/mwlite\/in\/([^/]+)/);
      if (mwliteMatch) {
        return mwliteMatch[1];
      }

      // Extract from /profile/view?id=numeric format
      const idMatch = profileUrl.match(/id=([^&]+)/);
      if (idMatch) {
        return idMatch[1];
      }

      // If no match, use the full URL as a fallback
      const urlObj = new URL(profileUrl);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      if (pathSegments.length >= 2 && pathSegments[0] === 'in') {
        return pathSegments[1];
      }

      // Last resort: just use the path
      return urlObj.pathname.replace(/^\/+|\/+$/g, '').replace(/\//g, '_');
    } catch (error) {
      // If URL parsing fails, return a hash of the URL
      return Buffer.from(profileUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
    }
  }
}

// Singleton instance for easy import
export const linkedInProfileScraper = LinkedInProfileScraperService.getInstance();
export default linkedInProfileScraper;