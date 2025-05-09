import { rolesObj } from '../../utils/constants';
import fs from 'fs/promises';
import { Builder, WebDriver, By, until } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import logger from '../../utils/logger';
import { normalizeLinkedInUrl, extractProfileId, extractCleanName } from '../../utils/linkedin.utils';
import User from '../../models/user.model';
import Lead from '../../models/lead.model';
import mongoose from 'mongoose';
import { randomDelay, humanTypeText } from '../../utils/delay';
import { LinkedInProfileData } from '../../types/linkedin.types';

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

/**
 * LinkedInProfileScraper class
 * Service for scraping LinkedIn profiles
 */
export class LinkedInProfileScraper {
  private static instance: LinkedInProfileScraper;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

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
   * Initialize the Selenium WebDriver
   * @returns WebDriver instance
   */
  private async initializeDriver(): Promise<WebDriver> {
    logger.info('Initializing WebDriver for LinkedIn scraper');

    try {
      // Import Chrome specific classes to avoid TypeScript errors
      const chrome = require('selenium-webdriver/chrome');
      const chromeOptions = new chrome.Options();

      // Add necessary Chrome options
      chromeOptions.addArguments('--disable-notifications');
      chromeOptions.addArguments('--no-sandbox');
      chromeOptions.addArguments('--disable-dev-shm-usage');
      chromeOptions.addArguments('--disable-gpu');
      chromeOptions.addArguments('--window-size=1920,1080');

      // Add user-agent to appear as a regular browser
      chromeOptions.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36');

      // Create and return the WebDriver
      const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

      logger.info('WebDriver initialized successfully');
      return driver;
    } catch (error) {
      logger.error(`Failed to initialize WebDriver: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`WebDriver initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Scrape a LinkedIn profile
   * @param profileUrl URL of the LinkedIn profile to scrape
   * @returns Scraped profile data
   */
  public async scrapeProfile(profileUrl: string): Promise<LinkedInProfileData> {
    let driver: WebDriver | null = null;

    // Normalize the LinkedIn URL
    const normalizedUrl = normalizeLinkedInUrl(profileUrl);
    if (!normalizedUrl) {
      throw new Error(`Invalid LinkedIn profile URL: ${profileUrl}`);
    }

    try {
      logger.info(`Starting to scrape profile: ${normalizedUrl}`);

      // Extract the profile ID
      const profileId = extractProfileId(normalizedUrl);
      if (!profileId) {
        throw new Error(`Failed to extract profile ID from URL: ${normalizedUrl}`);
      }

      // Initialize the WebDriver
      driver = await this.initializeDriver();

      // Navigate to the profile page
      await driver.get(normalizedUrl);
      logger.info(`Navigated to profile page: ${normalizedUrl}`);

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
        profileId,
        profileUrl: normalizedUrl,
        name,
        headline,
        location,
        summary
      };

      logger.info(`Successfully scraped profile data for: ${normalizedUrl}`);
      return profileData;

    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error scraping LinkedIn profile ${normalizedUrl}: ${errorMessage}`);

      // Take a screenshot of the page if driver is available
      if (driver) {
        try {
          const screenshot = await driver.takeScreenshot();
          const screenshotPath = `./screenshots/linkedin_scrape_error_${Date.now()}.png`;
          await fs.writeFile(screenshotPath, Buffer.from(screenshot, 'base64'));
          logger.info(`Error screenshot saved to: ${screenshotPath}`);
        } catch (screenshotError) {
          logger.warn(`Failed to take error screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
        }
      }

      throw new Error(`Failed to extract profile data for ${profileUrl}: ${errorMessage}`);
    } finally {
      // Always close the driver
      if (driver) {
        try {
          await driver.quit();
          logger.info('WebDriver closed successfully');
        } catch (quitError) {
          logger.warn(`Error closing WebDriver: ${quitError instanceof Error ? quitError.message : String(quitError)}`);
        }
      }
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
   * Extract profile summary
   * @param driver WebDriver instance
   * @returns Profile summary
   */
  private async extractSummary(driver: WebDriver): Promise<string | undefined> {
    try {
      const summaryElements = await driver.findElements(By.css('.pv-about-section .pv-shared-text-with-see-more'));
      if (summaryElements.length > 0) {
        return await summaryElements[0].getText();
      }
      return undefined;
    } catch (error) {
      logger.warn(`Error extracting summary: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Extract profile image URL
   * @param driver WebDriver instance
   * @returns Profile image URL
   */
  private async extractProfileImage(driver: WebDriver): Promise<string | undefined> {
    try {
      const imageElement = await driver.findElement(By.css('.pv-top-card .pv-top-card-profile-picture__image'));
      return await imageElement.getAttribute('src');
    } catch (error) {
      logger.warn(`Error extracting profile image: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Expand sections that need to be clicked to show more information
   * @param driver WebDriver instance
   */
  private async expandSections(driver: WebDriver): Promise<void> {
    try {
      // Find and click all "Show more" buttons
      const showMoreButtons = await driver.findElements(By.css('.pv-profile-section__see-more-inline'));
      for (const button of showMoreButtons) {
        try {
          await button.click();
          await randomDelay(500, 1000);
        } catch (error) {
          // Continue if one button fails
          continue;
        }
      }

      // Also try to expand any "show all experiences" buttons
      const expandButtons = await driver.findElements(By.css('.inline-show-more-text__button'));
      for (const button of expandButtons) {
        try {
          await button.click();
          await randomDelay(500, 1000);
        } catch (error) {
          // Continue if one button fails
          continue;
        }
      }
    } catch (error) {
      logger.warn(`Error expanding sections: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract experience information
   * @param driver WebDriver instance
   * @returns Array of experience data
   */
  private async extractExperience(driver: WebDriver): Promise<ExperienceData[]> {
    const experiences: ExperienceData[] = [];
    try {
      // Locate the experience section
      const experienceSection = await driver.findElements(By.css('#experience-section, .experience-section'));

      // If experience section not found, try a different approach
      if (experienceSection.length === 0) {
        return experiences;
      }

      // Find all experience list items
      const experienceItems = await experienceSection[0].findElements(By.css('.pv-entity__position-group, .pv-profile-section__card-item'));

      for (const item of experienceItems) {
        try {
          // Extract basic info
          const titleElement = await item.findElements(By.css('.pv-entity__summary-info-v2 h3, .pv-entity__summary-info h3'));
          const companyElement = await item.findElements(By.css('.pv-entity__secondary-title, .pv-entity__company-summary-info h3'));
          const dateRangeElement = await item.findElements(By.css('.pv-entity__date-range span:nth-child(2)'));
          const locationElement = await item.findElements(By.css('.pv-entity__location span:nth-child(2)'));
          const descriptionElement = await item.findElements(By.css('.pv-entity__description'));

          let title = '';
          if (titleElement.length > 0) {
            title = await titleElement[0].getText();
          }

          let company = '';
          if (companyElement.length > 0) {
            company = await companyElement[0].getText();
          }

          if (!title || !company) {
            continue; // Skip if missing essential info
          }

          const experience: ExperienceData = {
            title: title.trim(),
            company: company.trim(),
          };

          if (dateRangeElement.length > 0) {
            const dateRange = await dateRangeElement[0].getText();

            // Check if current role
            experience.isCurrentRole = dateRange.toLowerCase().includes('present');

            // Extract dates
            const dates = dateRange.split(' – ');
            if (dates.length === 2) {
              experience.startDate = dates[0].trim();
              experience.endDate = dates[1].trim();
            }
          }

          if (locationElement.length > 0) {
            experience.location = await locationElement[0].getText();
          }

          if (descriptionElement.length > 0) {
            experience.description = await descriptionElement[0].getText();
          }

          experiences.push(experience);
        } catch (error) {
          // Continue to next experience if one fails
          continue;
        }
      }

      return experiences;
    } catch (error) {
      logger.warn(`Error extracting experience: ${error instanceof Error ? error.message : String(error)}`);
      return experiences;
    }
  }

  /**
   * Extract education information
   * @param driver WebDriver instance
   * @returns Array of education data
   */
  private async extractEducation(driver: WebDriver): Promise<EducationData[]> {
    const educations: EducationData[] = [];
    try {
      // Locate the education section
      const educationSection = await driver.findElements(By.css('#education-section, .education-section'));

      // If education section not found, try a different approach
      if (educationSection.length === 0) {
        return educations;
      }

      // Find all education list items
      const educationItems = await educationSection[0].findElements(By.css('.pv-education-entity, .pv-profile-section__card-item'));

      for (const item of educationItems) {
        try {
          // Extract basic info
          const schoolElement = await item.findElements(By.css('.pv-entity__school-name, h3.pv-entity__school-name'));
          const degreeElement = await item.findElements(By.css('.pv-entity__degree-name span:nth-child(2)'));
          const fieldElement = await item.findElements(By.css('.pv-entity__fos span:nth-child(2)'));
          const dateRangeElement = await item.findElements(By.css('.pv-entity__dates span:nth-child(2)'));

          let school = '';
          if (schoolElement.length > 0) {
            school = await schoolElement[0].getText();
          }

          if (!school) {
            continue; // Skip if missing essential info
          }

          const education: EducationData = {
            school: school.trim(),
          };

          if (degreeElement.length > 0) {
            education.degree = await degreeElement[0].getText();
          }

          if (fieldElement.length > 0) {
            education.field = await fieldElement[0].getText();
          }

          if (dateRangeElement.length > 0) {
            const dateRange = await dateRangeElement[0].getText();
            const dates = dateRange.split(' – ');
            if (dates.length === 2) {
              education.startDate = dates[0].trim();
              education.endDate = dates[1].trim();
            }
          }

          educations.push(education);
        } catch (error) {
          // Continue to next education if one fails
          continue;
        }
      }

      return educations;
    } catch (error) {
      logger.warn(`Error extracting education: ${error instanceof Error ? error.message : String(error)}`);
      return educations;
    }
  }

  /**
   * Extract skills
   * @param driver WebDriver instance
   * @returns Array of skills
   */
  private async extractSkills(driver: WebDriver): Promise<string[] | undefined> {
    try {
      const skills: string[] = [];

      // First try to find the skills section
      const skillsSection = await driver.findElements(By.css('.pv-skill-categories-section, #skills-section'));

      if (skillsSection.length === 0) {
        return undefined;
      }

      // Try to find the "Show more skills" button and click it
      const showMoreButton = await skillsSection[0].findElements(By.css('.pv-skills-section__additional-skills'));
      if (showMoreButton.length > 0) {
        try {
          await showMoreButton[0].click();
          await randomDelay(1000, 2000);
        } catch (error) {
          // Continue if button click fails
        }
      }

      // Extract skills
      const skillElements = await driver.findElements(By.css('.pv-skill-category-entity__name-text, .pv-skill-category-entity__name'));

      for (const element of skillElements) {
        try {
          const skill = await element.getText();
          if (skill) {
            skills.push(skill.trim());
          }
        } catch (error) {
          // Continue to next skill if one fails
          continue;
        }
      }

      return skills.length > 0 ? skills : undefined;
    } catch (error) {
      logger.warn(`Error extracting skills: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /**
   * Extract contact information
   * @param driver WebDriver instance
   * @returns Contact information
   */
  private async extractContactInfo(driver: WebDriver): Promise<ContactInfo | undefined> {
    try {
      // Initialize contact info
      const contactInfo: ContactInfo = {};

      // Find the "Contact info" link and click it
      const contactInfoLinks = await driver.findElements(By.css('a[data-control-name="contact_see_more"]'));

      if (contactInfoLinks.length === 0) {
        return undefined;
      }

      // Click on contact info link
      await contactInfoLinks[0].click();
      await randomDelay(2000, 3000);

      // Wait for the contact info modal to appear
      await driver.wait(until.elementLocated(By.css('.pv-contact-info')), 5000);

      // Extract email
      const emailElements = await driver.findElements(By.css('.pv-contact-info__ci-email .pv-contact-info__contact-link'));
      if (emailElements.length > 0) {
        contactInfo.email = await emailElements[0].getText();
      }

      // Extract phone
      const phoneElements = await driver.findElements(By.css('.pv-contact-info__ci-phone .pv-contact-info__contact-link'));
      if (phoneElements.length > 0) {
        contactInfo.phone = await phoneElements[0].getText();
      }

      // Extract LinkedIn URL
      const linkedinElements = await driver.findElements(By.css('.pv-contact-info__ci-vanity-url .pv-contact-info__contact-link'));
      if (linkedinElements.length > 0) {
        contactInfo.linkedin = await linkedinElements[0].getAttribute('href');
      }

      // Extract website
      const websiteElements = await driver.findElements(By.css('.pv-contact-info__ci-websites .pv-contact-info__contact-link'));
      if (websiteElements.length > 0) {
        contactInfo.website = await websiteElements[0].getAttribute('href');
      }

      // Extract Twitter
      const twitterElements = await driver.findElements(By.css('.pv-contact-info__ci-twitter .pv-contact-info__contact-link'));
      if (twitterElements.length > 0) {
        contactInfo.twitter = await twitterElements[0].getAttribute('href');
      }

      // Close the modal
      const closeButton = await driver.findElement(By.css('button[aria-label="Dismiss"]'));
      await closeButton.click();
      await randomDelay(1000, 2000);

      return Object.keys(contactInfo).length > 0 ? contactInfo : undefined;
    } catch (error) {
      logger.warn(`Error extracting contact info: ${error instanceof Error ? error.message : String(error)}`);

      // Try to close the modal if it's still open
      try {
        const closeButton = await driver.findElement(By.css('button[aria-label="Dismiss"]'));
        await closeButton.click();
      } catch {
        // Ignore if we can't find the close button
      }

      return undefined;
    }
  }

  /**
   * Save profile data to database
   * @param profileData Extracted profile data
   * @param campaignId Campaign ID
   */
  private async saveProfileData(profileData: ProfileData, campaignId: string): Promise<void> {
    try {
      // Check if we already have this profile
      let user = await User.findOne({ link: profileData.profileUrl });

      if (!user) {
        // Create a new user with CLIENT role
        user = await User.create({
          name: profileData.name,
          email: profileData.contactInfo?.email || `${profileData.profileId}@placeholder.com`,
          password: Math.random().toString(36).substring(2, 15), // Random password for CLIENT users
          phone: profileData.contactInfo?.phone ? Number(profileData.contactInfo.phone.replace(/\D/g, '')) : undefined,
          role: rolesObj.CLIENT,
          isActive: true,
          link: profileData.profileUrl,
          currentPosition: profileData.currentPosition,
          location: profileData.location,
          contactInfoArr: profileData.contactInfo ? [profileData.contactInfo] : undefined,
          educationArr: profileData.educationArr,
          experienceArr: profileData.experienceArr,
          searchCompleted: true,
          campaignId: new mongoose.Types.ObjectId(campaignId)
        });

        logger.info(`Created new user with CLIENT role for profile: ${profileData.profileId}`);
      } else {
        // Update existing user
        user.name = profileData.name;
        if (profileData.contactInfo?.email) user.email = profileData.contactInfo.email;
        if (profileData.contactInfo?.phone) {
          const phoneNumber = profileData.contactInfo.phone.replace(/\D/g, '');
          if (phoneNumber) user.phone = Number(phoneNumber);
        }
        user.currentPosition = profileData.currentPosition || user.currentPosition;
        user.location = profileData.location || user.location;
        if (profileData.contactInfo) user.contactInfoArr = [profileData.contactInfo];
        if (profileData.educationArr) user.educationArr = profileData.educationArr;
        if (profileData.experienceArr) user.experienceArr = profileData.experienceArr;
        user.searchCompleted = true;

        await user.save();
        logger.info(`Updated existing user for profile: ${profileData.profileId}`);
      }

      // Update lead record to mark as searched
      await Lead.findOneAndUpdate(
        { campaignId, link: profileData.profileUrl },
        { isSearched: true }
      );

      logger.info(`Updated lead record for profile: ${profileData.profileId}`);
    } catch (error) {
      logger.error(`Error saving profile data: ${error instanceof Error ? error.message : String(error)}`);
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
        "section.artdeco-card .pvs-header__title:contains('About')"
      ];

      // First, try to find and click on the About section header if it exists
      let aboutSection = null;
      for (const selector of selectors) {
        try {
          const aboutElements = await driver.findElements(By.css(selector));
          if (aboutElements.length > 0) {
            aboutSection = aboutElements[0];
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (aboutSection) {
        // Try to find the text content
        const contentSelectors = [
          "div.display-flex ~ .pv-shared-text-with-see-more div.inline-show-more-text",
          "div.pvs-list__outer-container .pvs-list div.inline-show-more-text",
          "section.pv-about-section div.inline-show-more-text",
          ".pv-about__summary-text .inline-show-more-text"
        ];

        for (const selector of contentSelectors) {
          try {
            const contentElements = await driver.findElements(By.css(selector));
            if (contentElements.length > 0) {
              logger.info(`Successfully extracted about section using selector: ${selector}`);
              return await contentElements[0].getText();
            }
          } catch (error) {
            continue;
          }
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
