import { rolesObj } from '../../utils/constants';
import fs from 'fs/promises';
import { WebDriver, By, until, WebElement } from 'selenium-webdriver';
import logger from '../../utils/logger';
import { normalizeLinkedInUrl, extractProfileId, extractCleanName } from '../../utils/linkedin.utils';
import User from '../../models/user.model';
import Lead from '../../models/lead.model';
import mongoose from 'mongoose';
import { randomDelay } from '../../utils/delay';
import { LinkedInProfileData, LinkedInExperienceItem, LinkedInEducationItem, Endorsement } from '../../types/linkedin.types';
import path from 'path';
import WebDriverManager from '../selenium/WebDriverManager';
import SeleniumService from '../selenium/SeleniumService';
import { ILinkedInAccount } from '../../models/linkedinAccount.model';
import { IProxy } from '../../models/proxy.model';
import linkedInAuthService from './LinkedInAuthService';
import { CONFIG } from '../../utils/config';
import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { SelectorVerifier, SelectorHealthMetrics } from './SelectorVerifier';

interface Experience {
  title: string;
  company: string;
  dateRange: string;
  location: string;
  description: string;
}

interface Education {
  school: string;
  degree: string;
  fieldOfStudy: string;
  dateRange: string;
  description: string;
}

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

interface LinkedInProfile {
  firstName?: string;
  lastName?: string;
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  profilePictureUrl?: string;
  backgroundImageUrl?: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications?: {
    name: string;
    issuingOrganization?: string;
    issueDate?: string;
    expirationDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }[];
  volunteering?: {
    role: string;
    organization: string;
    cause?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }[];
  awards?: {
    title: string;
    issuer?: string;
    issueDate?: string;
    description?: string;
  }[];
  publications?: {
    title: string;
    publisher?: string;
    publicationDate?: string;
    description?: string;
    url?: string;
    authors?: string[];
  }[];
  recommendations?: {
    text: string;
    recommenderName?: string;
    recommenderTitle?: string;
    date?: string;
    relationship?: string;
  }[];
  interests?: {
    name: string;
    category?: string;
    followers?: number;
  }[];
  languages?: {
    language: string;
    proficiency?: string;
  }[];
  contactInfo?: {
    email?: string;
    phone?: string;
    birthday?: string;
    websites?: string[];
    twitter?: string;
  };
  endorsements?: Endorsement[];
}

/**
 * LinkedInProfileScraper class
 * Service for scraping LinkedIn profiles
 */
export class LinkedInProfileScraper {
  private static instance: LinkedInProfileScraper;
  private webDriverManager: typeof WebDriverManager;
  private linkedInAuthService: typeof linkedInAuthService;
  private selectorVerifier: SelectorVerifier;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.webDriverManager = WebDriverManager;
    this.linkedInAuthService = linkedInAuthService;
    this.selectorVerifier = new SelectorVerifier();
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
   * @param profileUrl The LinkedIn profile URL to scrape
   * @param campaignId Campaign ID for tracking and screenshots
   * @param linkedInAccount LinkedIn account to use for authentication
   * @param proxy Optional proxy to use for the request
   * @returns Scraped LinkedIn profile data
   */
  public async scrapeProfile(
    profileUrl: string,
    campaignId?: string,
    linkedInAccount?: ILinkedInAccount,
    proxy?: IProxy
  ): Promise<LinkedInProfile> {
    const driver = await this.setupDriver(linkedInAccount, proxy);
    try {
      await this.navigateToProfile(driver, profileUrl, linkedInAccount);
      // No need to call scrollProfile here as it's already called inside navigateToProfile

      // Extract profile data
      const [
        nameResult,
        headline,
        location,
        about,
        profilePicture,
        backgroundImage,
        experience,
        education,
        skills,
        certifications,
        volunteering,
        awards,
        publications,
        recommendations,
        interests,
        languages,
        contactInfo,
        endorsements
      ] = await Promise.all([
        this.extractName(driver).catch(error => {
          logger.warn(`Error extracting name: ${error instanceof Error ? error.message : String(error)}`);
          return { firstName: undefined, lastName: undefined };
        }),
        this.extractHeadline(driver).catch(error => {
          logger.warn(`Error extracting headline: ${error instanceof Error ? error.message : String(error)}`);
          return undefined;
        }),
        this.extractLocation(driver).catch(error => {
          logger.warn(`Error extracting location: ${error instanceof Error ? error.message : String(error)}`);
          return undefined;
        }),
        this.extractAbout(driver).catch(error => {
          logger.warn(`Error extracting about: ${error instanceof Error ? error.message : String(error)}`);
          return undefined;
        }),
        this.extractProfilePicture(driver).catch(error => {
          logger.warn(`Error extracting profile picture: ${error instanceof Error ? error.message : String(error)}`);
          return undefined;
        }),
        this.extractBackgroundImage(driver).catch(error => {
          logger.warn(`Error extracting background image: ${error instanceof Error ? error.message : String(error)}`);
          return undefined;
        }),
        this.extractExperience(driver).catch(error => {
          logger.warn(`Error extracting experience: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }),
        this.extractEducation(driver).catch(error => {
          logger.warn(`Error extracting education: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }),
        this.extractSkills(driver).catch(error => {
          logger.warn(`Error extracting skills: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }),
        this.extractCertifications(driver).catch(error => {
          logger.warn(`Error extracting certifications: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }),
        this.extractVolunteering(driver).catch(error => {
          logger.warn(`Error extracting volunteering: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }),
        this.extractAwards(driver).catch(error => {
          logger.warn(`Error extracting awards: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }),
        this.extractPublications(driver).catch(error => {
          logger.warn(`Error extracting publications: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }),
        this.extractRecommendations(driver).catch(error => {
          logger.warn(`Error extracting recommendations: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }),
        this.extractInterests(driver).catch(error => {
          logger.warn(`Error extracting interests: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        }),
        this.extractLanguages(driver).catch(error => {
          logger.warn(`Error extracting languages: ${error instanceof Error ? error.message : String(error)}`);
          return undefined;
        }),
        this.extractContactInfo(driver).catch(error => {
          logger.warn(`Error extracting contact info: ${error instanceof Error ? error.message : String(error)}`);
          return undefined;
        }),
        this.extractEndorsements(driver).catch(error => {
          logger.warn(`Error extracting endorsements: ${error instanceof Error ? error.message : String(error)}`);
          return [];
        })
      ]);

      // Construct and return the profile
      return {
        firstName: nameResult?.firstName,
        lastName: nameResult?.lastName,
        name: nameResult?.firstName && nameResult?.lastName
          ? `${nameResult.firstName} ${nameResult.lastName}`
          : (nameResult?.firstName || nameResult?.lastName || 'Unknown Profile'),
        headline,
        location,
        about,
        profilePictureUrl: profilePicture,
        backgroundImageUrl: backgroundImage,
        experience: experience || [],
        education: education || [],
        skills: skills || [],
        certifications,
        volunteering,
        awards,
        publications,
        recommendations,
        interests,
        languages,
        contactInfo,
        endorsements
      };
    } catch (error) {
      logger.error('Error scraping profile:', error);
      throw error;
    } finally {
      try {
        await driver.quit();
      } catch (error) {
        logger.error('Error closing driver:', error);
      }
    }
  }

  /**
   * Run verification on all selectors
   * Useful for testing selectors against real LinkedIn profiles
   * @param profileUrl LinkedIn profile URL to test against
   * @param linkedInAccount Optional LinkedIn account for authentication
   */
  public static async verifySelectors(profileUrl: string, linkedInAccount?: ILinkedInAccount): Promise<Map<string, SelectorHealthMetrics>> {
    const instance = LinkedInProfileScraper.getInstance();

    // Reset health metrics before running tests
    instance.selectorVerifier.resetHealthMetrics();

    logger.info(`Starting LinkedIn selector verification for profile: ${profileUrl}`);
    logger.info(`Using LinkedIn account: ${linkedInAccount?.username || 'None provided'}`);

    let driver: WebDriver | null = null;

    try {
      // Set up the web driver with extended timeouts for verification
      driver = await instance.setupDriver(linkedInAccount);
      logger.info('WebDriver initialized successfully');

      try {
        // Navigate to profile and wait for load
        logger.info(`Navigating to LinkedIn profile: ${profileUrl}`);
        if (linkedInAccount) {
          logger.info(`Logging in with account ${linkedInAccount.username}`);
        }

        await instance.navigateToProfile(driver, profileUrl, linkedInAccount);
        logger.info('Successfully navigated to profile, waiting for page to load');

        await instance.waitForProfileLoad(driver);
        logger.info('Profile page loaded successfully');

        // Take screenshot of the profile page for debugging
        await instance.takeScreenshot(driver, 'profile-page-loaded');

        // Scroll through profile to load all dynamic content
        logger.info('Scrolling through profile to load all dynamic content');
        await instance.scrollToBottom(driver);
        logger.info('Profile scrolling completed');

        // Run verification on all selectors
        logger.info('Starting selector verification tests');
        await instance.selectorVerifier.testAllSelectors(driver);
        logger.info('Selector verification tests completed');

        // Return health metrics
        const metrics = instance.selectorVerifier.getHealthMetrics();
        logger.info(`Verified ${metrics.size} selectors successfully`);

        return metrics;
      } catch (navigationError) {
        logger.error(`Error navigating to profile: ${navigationError instanceof Error ? navigationError.message : String(navigationError)}`);

        // Try to take a screenshot of the failed state
        if (driver) {
          try {
            await instance.takeScreenshot(driver, 'profile-navigation-failed');

            // Log current URL for diagnostics
            const currentUrl = await driver.getCurrentUrl();
            logger.info(`Current URL at failure: ${currentUrl}`);

            // Log page title for diagnostics
            const pageTitle = await driver.getTitle();
            logger.info(`Page title at failure: ${pageTitle}`);
          } catch (screenshotError) {
            logger.warn(`Could not take error screenshot: ${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}`);
          }
        }

        throw navigationError;
      }
    } catch (error) {
      logger.error(`Error verifying selectors: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      // Close driver
      if (driver) {
        try {
          logger.info('Closing WebDriver');
          await driver.quit();
          logger.info('WebDriver closed successfully');
        } catch (quitError) {
          logger.warn(`Error closing driver: ${quitError instanceof Error ? quitError.message : String(quitError)}`);
        }
      }
    }
  }

  /**
   * Get selector health metrics
   * @returns Map of selector health metrics
   */
  public getSelectorHealthMetrics(): Map<string, SelectorHealthMetrics> {
    return this.selectorVerifier.getHealthMetrics();
  }

  /**
   * Reset selector health metrics
   */
  public resetSelectorHealthMetrics(): void {
    this.selectorVerifier.resetHealthMetrics();
  }

  private async waitForProfileLoad(driver: WebDriver): Promise<void> {
    try {
      // Wait for critical profile elements
      const waitTimeMs = 10000; // 10 seconds

      // Use selectors for profile content
      const contentSelectors = [
        'div.pv-text-details__left-panel',
        'div.ph5',
        'div.profile-info',
        'div.artdeco-card'
      ];

      // Try each selector
      for (const selector of contentSelectors) {
        try {
          await driver.wait(until.elementLocated(By.css(selector)), waitTimeMs);
          const element = await driver.findElement(By.css(selector));

          // Check if the element is visible
          if (await element.isDisplayed()) {
            logger.info(`Profile loaded successfully, found selector: ${selector}`);
            return;
          }
        } catch (selectorError) {
          // Continue trying other selectors
          continue;
        }
      }

      logger.warn('Profile content detection timed out, continuing anyway');
    } catch (error) {
      logger.warn(`Error waiting for profile load: ${error instanceof Error ? error.message : String(error)}`);
      // Continue execution even if this fails, since some content might still be accessible
    }
  }

  private async extractName(driver: WebDriver): Promise<{ firstName?: string; lastName?: string }> {
    try {
      const nameSelectors = [
        'h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words',
        'h1.text-heading-xlarge',
        'h1.pv-text-details__title--main',
        'h1.top-card-layout__title',
        'h1.profile-topcard-person-entity__name',
        'h1.artdeco-entity-lockup__title',
        'div.pv-text-details__left-panel h1'
      ];

      for (const selector of nameSelectors) {
        try {
          const elements = await driver.findElements(By.css(selector));
          for (const element of elements) {
            if (await element.isDisplayed()) {
              const fullName = await element.getText();
              if (fullName && fullName.trim()) {
                logger.info(`Successfully extracted name using selector: ${selector}`);
                const nameParts = fullName.trim().split(/\s+/);
                return {
                  firstName: nameParts[0],
                  lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined
                };
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      // Try XPath as fallback
      const xpathSelectors = [
        "//div[contains(@class, 'pv-text-details__left-panel')]//h1[contains(@class, 'text-heading-xlarge')]",
        "//div[contains(@class, 'ph5')]//h1[contains(@class, 'text-heading-xlarge')]",
        "//div[contains(@class, 'profile-info')]//h1[contains(@class, 'text-heading-xlarge')]"
      ];

      for (const xpath of xpathSelectors) {
        try {
          const elements = await driver.findElements(By.xpath(xpath));
          for (const element of elements) {
            if (await element.isDisplayed()) {
              const fullName = await element.getText();
              if (fullName && fullName.trim()) {
                logger.info(`Successfully extracted name using XPath: ${xpath}`);
                const nameParts = fullName.trim().split(/\s+/);
                return {
                  firstName: nameParts[0],
                  lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined
                };
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      return { firstName: undefined, lastName: undefined };
    } catch (error) {
      logger.warn(`Error extracting name: ${error instanceof Error ? error.message : String(error)}`);
      return { firstName: undefined, lastName: undefined };
    }
  }

  /**
   * Extract profile headline
   * @param driver WebDriver instance
   * @returns Profile headline
   */
  private async extractHeadline(driver: WebDriver): Promise<string | undefined> {
    try {
      const headlineSelectors = [
        'div.pv-text-details__left-panel div.text-body-medium',
        'div.ph5 div.text-body-medium',
        'div.pv-text-details__title div.text-body-medium',
        'div.profile-info div.text-body-medium',
        'div[data-field="headline"]',
        'div.profile-headline',
        'div.pv-top-card-section__headline',
        'div.ph5 div.mt2 div.text-body-medium',
        'div.pv-text-details__left-panel span.text-body-medium',
        'div.artdeco-entity-lockup__subtitle'
      ];

      for (const selector of headlineSelectors) {
        try {
          const elements = await driver.findElements(By.css(selector));
          for (const element of elements) {
            if (await element.isDisplayed()) {
              const headline = await element.getText();
              if (headline && headline.trim()) {
                return headline.trim();
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      return undefined;
    } catch (error) {
      logger.error('Error extracting headline:', error);
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
      const locationSelectors = [
        'div.pv-text-details__left-panel span.text-body-small.inline.t-black--light.break-words',
        'div.ph5 span.text-body-small.inline.t-black--light.break-words',
        'div.pv-text-details__title span.text-body-small.inline.t-black--light.break-words',
        'div.profile-info span.text-body-small.inline.t-black--light.break-words',
        'div[data-field="location"] span.text-body-small',
        'div.profile-location span.text-body-small',
        'div.pv-top-card-section__location',
        'div.ph5 div.mt2 span.text-body-small',
        'div.pv-text-details__left-panel div.text-body-small',
        'div.artdeco-entity-lockup__caption'
      ];

      for (const selector of locationSelectors) {
        try {
          const elements = await driver.findElements(By.css(selector));
          for (const element of elements) {
            if (await element.isDisplayed()) {
              const text = await element.getText();
              if (text && text.trim()) {
                logger.info(`Successfully extracted location using selector: ${selector}`);
                return text.trim();
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      // Try XPath as fallback
      const xpathSelectors = [
        "//div[contains(@class, 'pv-text-details__left-panel')]//span[contains(@class, 'text-body-small') and contains(@class, 't-black--light')]",
        "//div[contains(@class, 'ph5')]//span[contains(@class, 'text-body-small') and contains(@class, 't-black--light')]",
        "//div[contains(@class, 'profile-info')]//span[contains(@class, 'text-body-small')]"
      ];

      for (const xpath of xpathSelectors) {
        try {
          const elements = await driver.findElements(By.xpath(xpath));
          for (const element of elements) {
            if (await element.isDisplayed()) {
              const text = await element.getText();
              if (text && text.trim()) {
                logger.info(`Successfully extracted location using XPath: ${xpath}`);
                return text.trim();
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

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
      // First try to find the About section container
      const aboutSectionSelectors = [
        'section#about',
        'section[data-section="about"]',
        'section.artdeco-card.pv-profile-card.break-words',
        'div#about',
        'div[data-field="about"]',
        'div.pvs-list__outer-container'
      ];

      // Try to expand all "See more" buttons in the about section
      await this.clickExpandButtons(driver, aboutSectionSelectors);
      await randomDelay(1000, 2000); // Wait for content to load

      const aboutTextSelectors = [
        'div.inline-show-more-text span[aria-hidden="true"]',
        'div.pv-shared-text-with-see-more span[aria-hidden="true"]',
        'div.pv-about__summary-text span[aria-hidden="true"]',
        'div.pvs-description span[aria-hidden="true"]',
        'div.pv-entity__description span[aria-hidden="true"]',
        'div.pvs-entity__title-text span[aria-hidden="true"]'
      ];

      for (const sectionSelector of aboutSectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            const aboutText = await this.extractTextFromElements(await section.findElements(By.css(aboutTextSelectors.join(','))));
            if (aboutText) {
              return aboutText;
            }
          }
        } catch (error) {
          continue;
        }
      }

      return undefined;
    } catch (error) {
      logger.error('Error extracting about section:', error);
      return undefined;
    }
  }

  private async extractBackgroundImage(driver: WebDriver): Promise<string | undefined> {
    try {
      const backgroundElement = await driver.findElement(By.css('.profile-background-image__image'));
      return await backgroundElement.getAttribute('src');
    } catch (error) {
      return undefined;
    }
  }

  private async extractConnections(driver: WebDriver): Promise<string | undefined> {
    try {
      const selectors = [
        'span.distance-badge',
        'span.top-card__connections',
        'span.top-card-layout__first-subline',
        'div.pv-top-card--list span'
      ];

      for (const selector of selectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          if (await element.isDisplayed()) {
            const text = await element.getText();
            const match = text.match(/(\d+,?\d*)\+?\s*connections?/i);
            if (match) return match[1];
          }
        } catch (error) {
          continue;
        }
      }
      return undefined;
    } catch (error) {
      logger.warn(`Error extracting connections: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  private async extractFollowers(driver: WebDriver): Promise<number | undefined> {
    try {
      const selectors = [
        'div.top-card__followers-count',
        'div.pv-top-card--list span.t-bold',
        'div.pv-recent-activity-section__follower-count',
        'span[data-test-id="follower-count"]'
      ];

      for (const selector of selectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          if (await element.isDisplayed()) {
            const text = await element.getText();
            const match = text.match(/(\d+,?\d*)\+?\s*followers?/i);
            if (match) {
              return parseInt(match[1].replace(/,/g, ''), 10);
            }
          }
        } catch (error) {
          continue;
        }
      }
      return undefined;
    } catch (error) {
      logger.warn(`Error extracting followers: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  private async extractEndorsements(driver: WebDriver): Promise<Endorsement[]> {
    try {
      const endorsements: Endorsement[] = [];
      const skillsSection = await driver.findElement(By.css('section.pv-skill-categories-section'));

      // Expand the skills section if possible
      try {
        const showMoreButton = await skillsSection.findElement(By.css('button.pv-skills-section__additional-skills'));
        await showMoreButton.click();
        await driver.sleep(1000); // Wait for expansion animation
      } catch (error) {
        // No show more button or already expanded
      }

      const skillElements = await skillsSection.findElements(By.css('div.pv-skill-category-entity'));

      for (const skillElement of skillElements) {
        try {
          const skillName = await skillElement.findElement(By.css('.pv-skill-category-entity__name')).getText();
          const endorserCountElement = await skillElement.findElement(By.css('.pv-skill-category-entity__endorsement-count'));
          const endorserCount = parseInt(await endorserCountElement.getText(), 10) || 0;

          const endorserProfiles: { name: string; headline?: string; profileUrl?: string; }[] = [];

          // Try to get endorser profiles if available
          try {
            const endorserElements = await skillElement.findElements(By.css('.pv-skill-category-entity__endorser-profile'));
            for (const endorserElement of endorserElements) {
              const endorserName = await endorserElement.findElement(By.css('.pv-skill-category-entity__endorser-name')).getText();
              let headline: string | undefined;
              let profileUrl: string | undefined;

              try {
                headline = await endorserElement.findElement(By.css('.pv-skill-category-entity__endorser-headline')).getText();
              } catch (error) {
                // Headline not available
              }

              try {
                const profileLink = await endorserElement.findElement(By.css('a'));
                profileUrl = await profileLink.getAttribute('href');
              } catch (error) {
                // Profile URL not available
              }

              endorserProfiles.push({ name: endorserName, headline, profileUrl });
            }
          } catch (error) {
            // Endorser profiles not available
          }

          endorsements.push({
            skill: skillName,
            endorsers: endorserCount,
            endorserProfiles: endorserProfiles.length > 0 ? endorserProfiles : undefined
          });
        } catch (error) {
          logger.warn(`Error extracting endorsement details: ${error instanceof Error ? error.message : String(error)}`);
          continue;
        }
      }

      return endorsements;
    } catch (error) {
      logger.error('Error extracting endorsements:', error);
      return [];
    }
  }

  private async extractCertifications(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['certifications']>> {
    try {
      const certifications: NonNullable<LinkedInProfileData['certifications']> = [];
      const sectionSelectors = [
        'section#certifications',
        'section.certifications-section',
        'div[id*="certifications"]'
      ];

      for (const sectionSelector of sectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            const items = await section.findElements(By.css('.pvs-list__item-container, .pv-certification-entity'));

            for (const item of items) {
              try {
                const nameElement = await item.findElement(By.css('.pvs-entity__title-text, .pv-entity__title'));
                const orgElement = await item.findElement(By.css('.pvs-entity__subtitle-text, .pv-entity__secondary-title'));

                const nameText = await nameElement.getText() || '';
                const orgText = await orgElement.getText() || '';

                if (!nameText || !orgText) continue;

                const certification = {
                  name: nameText,
                  issuingOrganization: orgText,
                  issueDate: '',
                  expirationDate: '',
                  credentialId: '',
                  credentialUrl: ''
                };

                try {
                  const dateElement = await item.findElement(By.css('.pvs-entity__date-range, .pv-entity__date-range'));
                  const dateText = await dateElement.getText() || '';
                  if (dateText) {
                    const dates = dateText.split(' - ').map(d => d.trim()).filter(Boolean);
                    if (dates[0]) certification.issueDate = dates[0];
                    if (dates[1]) certification.expirationDate = dates[1];
                  }
                } catch (error) {
                  // Dates are optional
                }

                try {
                  const credentialElement = await item.findElement(By.css('.pv-certifications__credential-id'));
                  const credentialId = await credentialElement.getText() || '';
                  if (credentialId) certification.credentialId = credentialId;
                } catch (error) {
                  // Credential ID is optional
                }

                try {
                  const urlElement = await item.findElement(By.css('a[data-test-certification-url]'));
                  const credentialUrl = await urlElement.getAttribute('href') || '';
                  if (credentialUrl) certification.credentialUrl = credentialUrl;
                } catch (error) {
                  // URL is optional
                }

                certifications.push(certification);
              } catch (error) {
                continue;
              }
            }

            if (certifications.length > 0) break;
          }
        } catch (error) {
          continue;
        }
      }

      return certifications;
    } catch (error) {
      logger.warn(`Error extracting certifications: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async extractSkills(driver: WebDriver): Promise<string[]> {
    try {
      const skills: string[] = [];

      // First try to find the Skills section container
      const skillsSectionSelectors = [
        'section#skills',
        'section[data-section="skills"]',
        'section.artdeco-card.pv-profile-card.break-words',
        'div#skills',
        'div[data-field="skills"]',
        'div.pvs-list__outer-container'
      ];

      // Try to expand all "See more" buttons in the skills section
      await this.clickExpandButtons(driver, skillsSectionSelectors);
      await randomDelay(1000, 2000); // Wait for content to load

      // Try different selectors for skill items
      const skillItemSelectors = [
        'li.artdeco-list__item',
        'div.pvs-entity',
        'div.pv-skill-category-entity',
        'div.pv-profile-section__card-item',
        'div.pv-entity__summary-info',
        'div.skill-item'
      ];

      const skillTextSelectors = [
        'span.mr1.hoverable-link-text span[aria-hidden="true"]',
        'span.t-14.t-black.t-bold span[aria-hidden="true"]',
        'span.pv-skill-category-entity__name-text',
        'div.pv-entity__skill-name',
        'div.inline-show-more-text span[aria-hidden="true"]',
        'div.pvs-entity__title-text span[aria-hidden="true"]'
      ];

      for (const sectionSelector of skillsSectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            const items = await section.findElements(By.css(skillItemSelectors.join(',')));
            for (const item of items) {
              try {
                if (await item.isDisplayed()) {
                  const skillText = await this.extractTextFromElements(await item.findElements(By.css(skillTextSelectors.join(','))));
                  if (skillText) {
                    skills.push(skillText);
                  }
                }
              } catch (error) {
                continue;
              }
            }
            if (skills.length > 0) {
              break; // Found skills, no need to try other section selectors
            }
          }
        } catch (error) {
          continue;
        }
      }

      return Array.from(new Set(skills)); // Remove duplicates
    } catch (error) {
      logger.error('Error extracting skills:', error);
      return [];
    }
  }

  private async extractLanguages(driver: WebDriver): Promise<{ language: string; proficiency?: string; }[]> {
    try {
      const languages: { language: string; proficiency?: string; }[] = [];
      const languagesSection = await driver.findElement(By.css('section[aria-label="Languages"]'));

      const languageElements = await languagesSection.findElements(By.css('li.languages__list-item'));

      for (const languageElement of languageElements) {
        try {
          const language = await languageElement.findElement(By.css('h3')).getText();
          const proficiency = await this.getTextContent(languageElement.findElement(By.css('.languages__proficiency')));

          languages.push({ language, proficiency });
        } catch (error) {
          // Skip this language if there's an error
          continue;
        }
      }

      return languages;
    } catch (error) {
      return [];
    }
  }

  private async extractContactInfo(driver: WebDriver): Promise<LinkedInProfileData['contactInfo']> {
    try {
      // Click the contact info button to open the modal
      const contactInfoButton = await driver.findElement(By.css('a[data-control-name="contact_see_more"]'));
      await contactInfoButton.click();
      await driver.sleep(1000); // Wait for modal to open

      const contactInfo: NonNullable<LinkedInProfileData['contactInfo']> = {};

      const modal = await driver.findElement(By.css('div.pv-profile-section__section-info'));

      // Extract email
      try {
        const emailSection = await modal.findElement(By.css('section.ci-email'));
        const email = await emailSection.findElement(By.css('a')).getText();
        if (email) contactInfo.email = email;
      } catch (error) {}

      // Extract phone
      try {
        const phoneSection = await modal.findElement(By.css('section.ci-phone'));
        const phone = await phoneSection.findElement(By.css('span')).getText();
        if (phone) contactInfo.phone = phone;
      } catch (error) {}

      // Extract websites
      try {
        const websitesSection = await modal.findElement(By.css('section.ci-websites'));
        const websiteElements = await websitesSection.findElements(By.css('a'));
        if (websiteElements.length > 0) {
          contactInfo.websites = await Promise.all(
            websiteElements.map(element => element.getAttribute('href'))
          );
        }
      } catch (error) {}

      // Extract Twitter
      try {
        const twitterSection = await modal.findElement(By.css('section.ci-twitter'));
        const twitter = await twitterSection.findElement(By.css('a')).getAttribute('href');
        if (twitter) contactInfo.twitter = twitter;
      } catch (error) {}

      // Extract birthday
      try {
        const birthdaySection = await modal.findElement(By.css('section.ci-birthday'));
        const birthday = await birthdaySection.findElement(By.css('span')).getText();
        if (birthday) contactInfo.birthday = birthday;
      } catch (error) {}

      // Extract connected date
      try {
        const connectedSection = await modal.findElement(By.css('section.ci-connected'));
        const connectedOn = await connectedSection.findElement(By.css('span')).getText();
        if (connectedOn) contactInfo.connectedOn = connectedOn;
      } catch (error) {}

      // Close the modal
      const closeButton = await driver.findElement(By.css('button[aria-label="Dismiss"]'));
      await closeButton.click();
      await driver.sleep(500); // Wait for modal to close

      return Object.keys(contactInfo).length > 0 ? contactInfo : undefined;
    } catch (error) {
      return undefined;
    }
  }

  private async extractLastUpdated(driver: WebDriver): Promise<string | undefined> {
    try {
      const selectors = [
        '.pv-last-activity',
        '.profile-last-updated',
        '[data-test-id="last-activity-timestamp"]'
      ];

      for (const selector of selectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          if (await element.isDisplayed()) {
            return await element.getText();
          }
        } catch (error) {
          continue;
        }
      }
      return undefined;
    } catch (error) {
      logger.warn(`Error extracting last updated time: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  private async extractVolunteering(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['volunteering']>> {
    try {
      const volunteering: NonNullable<LinkedInProfileData['volunteering']> = [];
      const sectionSelectors = [
        'section#volunteering',
        'section.volunteering-section',
        'div[id*="volunteering"]'
      ];

      for (const sectionSelector of sectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            const items = await section.findElements(By.css('.pvs-list__item-container, .pv-volunteering-entity'));

            for (const item of items) {
              try {
                const roleElement = await item.findElement(By.css('.pvs-entity__title-text, .pv-entity__role-details-title'));
                const orgElement = await item.findElement(By.css('.pvs-entity__subtitle-text, .pv-entity__secondary-title'));

                const role = await roleElement.getText() || '';
                const organization = await orgElement.getText() || '';

                if (!role || !organization) continue;

                const volunteer: NonNullable<LinkedInProfileData['volunteering']>[number] = {
                  role,
                  organization
                };

                try {
                  const causeElement = await item.findElement(By.css('.pv-volunteer-causes'));
                  const cause = await causeElement.getText() || '';
                  if (cause) volunteer.cause = cause;
                } catch (error) {
                  // Cause is optional
                }

                try {
                  const dateElement = await item.findElement(By.css('.pvs-entity__date-range, .pv-entity__date-range'));
                  const dateText = await dateElement.getText() || '';
                  if (dateText) {
                    const dates = dateText.split(' - ').map(d => d.trim()).filter(Boolean);
                    if (dates[0]) volunteer.startDate = dates[0];
                    if (dates[1]) volunteer.endDate = dates[1];
                  }
                } catch (error) {
                  // Dates are optional
                }

                try {
                  const descElement = await item.findElement(By.css('.pvs-entity__description-text, .pv-entity__description'));
                  const description = await descElement.getText() || '';
                  if (description) volunteer.description = description;
                } catch (error) {
                  // Description is optional
                }

                volunteering.push(volunteer);
              } catch (error) {
                continue;
              }
            }

            if (volunteering.length > 0) break;
          }
        } catch (error) {
          continue;
        }
      }

      return volunteering;
    } catch (error) {
      logger.warn(`Error extracting volunteering: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async extractAwards(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['awards']>> {
    try {
      const awards: NonNullable<LinkedInProfileData['awards']> = [];
      const sectionSelectors = [
        'section#honors_and_awards',
        'section.awards-section',
        'div[id*="awards"]'
      ];

      for (const sectionSelector of sectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            const items = await section.findElements(By.css('.pvs-list__item-container, .pv-accomplishment-entity'));

            for (const item of items) {
              try {
                const titleElement = await item.findElement(By.css('.pvs-entity__title-text, .pv-accomplishment-entity__title'));
                const title = await titleElement.getText() || '';

                if (!title) continue;

                const award: NonNullable<LinkedInProfileData['awards']>[number] = {
                  title
                };

                try {
                  const issuerElement = await item.findElement(By.css('.pvs-entity__subtitle-text, .pv-accomplishment-entity__issuer'));
                  const issuer = await issuerElement.getText() || '';
                  if (issuer) award.issuer = issuer;
                } catch (error) {
                  // Issuer is optional
                }

                try {
                  const dateElement = await item.findElement(By.css('.pvs-entity__caption-text, .pv-accomplishment-entity__date'));
                  const issueDate = await dateElement.getText() || '';
                  if (issueDate) award.issueDate = issueDate;
                } catch (error) {
                  // Date is optional
                }

                try {
                  const descElement = await item.findElement(By.css('.pvs-entity__description-text, .pv-accomplishment-entity__description'));
                  const description = await descElement.getText() || '';
                  if (description) award.description = description;
                } catch (error) {
                  // Description is optional
                }

                awards.push(award);
              } catch (error) {
                continue;
              }
            }

            if (awards.length > 0) break;
          }
        } catch (error) {
          continue;
        }
      }

      return awards;
    } catch (error) {
      logger.warn(`Error extracting awards: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async extractPublications(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['publications']>> {
    try {
      const publications: NonNullable<LinkedInProfileData['publications']> = [];
      const sectionSelectors = [
        'section#publications',
        'section.publications-section',
        'div[id*="publications"]'
      ];

      for (const sectionSelector of sectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            const items = await section.findElements(By.css('.pvs-list__item-container, .pv-publication-entity'));

            for (const item of items) {
              try {
                const titleElement = await item.findElement(By.css('.pvs-entity__title-text, .pv-publication-entity__title'));
                const title = await titleElement.getText() || '';

                if (!title) continue;

                const publication: NonNullable<LinkedInProfileData['publications']>[number] = {
                  title
                };

                try {
                  const publisherElement = await item.findElement(By.css('.pvs-entity__subtitle-text, .pv-publication-entity__publisher'));
                  const publisher = await publisherElement.getText() || '';
                  if (publisher) publication.publisher = publisher;
                } catch (error) {
                  // Publisher is optional
                }

                try {
                  const dateElement = await item.findElement(By.css('.pvs-entity__caption-text, .pv-publication-entity__date'));
                  const date = await dateElement.getText() || '';
                  if (date) publication.date = date;
                } catch (error) {
                  // Date is optional
                }

                try {
                  const urlElement = await item.findElement(By.css('a[data-test-publication-url]'));
                  const url = await urlElement.getAttribute('href') || '';
                  if (url) publication.url = url;
                } catch (error) {
                  // URL is optional
                }

                try {
                  const descElement = await item.findElement(By.css('.pvs-entity__description-text, .pv-publication-entity__description'));
                  const description = await descElement.getText() || '';
                  if (description) publication.description = description;
                } catch (error) {
                  // Description is optional
                }

                try {
                  const authorsElement = await item.findElement(By.css('.pv-publication-entity__authors'));
                  const authorsText = await authorsElement.getText() || '';
                  if (authorsText) {
                    const coAuthors = authorsText.split(',').map(a => a.trim()).filter(Boolean);
                    if (coAuthors.length > 0) publication.coAuthors = coAuthors;
                  }
                } catch (error) {
                  // Co-authors are optional
                }

                publications.push(publication);
              } catch (error) {
                continue;
              }
            }

            if (publications.length > 0) break;
          }
        } catch (error) {
          continue;
        }
      }

      return publications;
    } catch (error) {
      logger.warn(`Error extracting publications: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async extractRecommendations(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['recommendations']>> {
    try {
      const recommendations: NonNullable<LinkedInProfileData['recommendations']> = [];

      // Comprehensive section selectors
      const sectionSelectors = [
        'section#recommendations',
        'section.recommendations-section',
        'div[id*="recommendations"]',
        'section.artdeco-card.pv-profile-card.break-words.mt4',
        'div.pvs-list__outer-container[aria-label*="recommendation"]'
      ];

      // Try to expand all "See more" buttons in the recommendations section
      await this.clickExpandButtons(driver, sectionSelectors);
      await randomDelay(1000, 2000); // Wait for content to load

      for (const sectionSelector of sectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            // Try to find the tab panel container
            const tabPanels = await section.findElements(By.css('.artdeco-tabpanel'));

            if (tabPanels.length > 0) {
              // Handle tabbed recommendations (newer layout)
              for (const panel of tabPanels) {
                try {
                  const ariaLabel = await panel.getAttribute('aria-label');
                  const type = ariaLabel?.toLowerCase().includes('received') ? 'received' : 'given';

                  const items = await panel.findElements(By.css([
                    '.pvs-list__item-container',
                    '.pv-recommendation-entity',
                    '.artdeco-list__item'
                  ].join(',')));

                  for (const item of items) {
                    try {
                      const recommendation = await this.extractRecommendationItem(item, type);
                      if (recommendation) recommendations.push(recommendation);
                    } catch (error) {
                      logger.debug(`Error extracting recommendation item: ${error instanceof Error ? error.message : String(error)}`);
                      continue;
                    }
                  }
                } catch (error) {
                  logger.debug(`Error processing recommendation panel: ${error instanceof Error ? error.message : String(error)}`);
                  continue;
                }
              }
            } else {
              // Handle non-tabbed recommendations (older layout)
              const items = await section.findElements(By.css([
                '.pvs-list__item-container',
                '.pv-recommendation-entity',
                '.artdeco-list__item'
              ].join(',')));

              for (const item of items) {
                try {
                  // Try to determine type from the item's structure
                  const type = await this.determineRecommendationType(item);
                  const recommendation = await this.extractRecommendationItem(item, type);
                  if (recommendation) recommendations.push(recommendation);
                } catch (error) {
                  logger.debug(`Error extracting recommendation item: ${error instanceof Error ? error.message : String(error)}`);
                  continue;
                }
              }
            }

            if (recommendations.length > 0) {
              logger.info(`Successfully extracted ${recommendations.length} recommendations`);
              break; // Found recommendations, no need to try other section selectors
            }
          }
        } catch (error) {
          logger.debug(`Error processing recommendations section with selector ${sectionSelector}: ${error instanceof Error ? error.message : String(error)}`);
          continue;
        }
      }

      return recommendations;
    } catch (error) {
      logger.warn(`Error extracting recommendations: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private async determineRecommendationType(item: WebElement): Promise<'received' | 'given'> {
    try {
      const selectors = [
        '.pvs-entity__text',
        '.pv-recommendation-entity__text',
        '.artdeco-list__item-title'
      ];

      for (const selector of selectors) {
        try {
          const element = await item.findElement(By.css(selector));
          const text = await element.getText();
          return text.toLowerCase().includes('received') ? 'received' : 'given';
        } catch (error) {
          continue;
        }
      }

      // Default to 'received' if we can't determine
      return 'received';
    } catch (error) {
      return 'received';
    }
  }

  private async extractRecommendationItem(item: WebElement, type: 'received' | 'given'): Promise<NonNullable<LinkedInProfileData['recommendations']>[number] | null> {
    try {
      // Define selector categories
      const categories = {
        text: 'Recommendation Text',
        author: 'Recommendation Author',
        title: 'Recommendation Title',
        relationship: 'Recommendation Relationship',
        date: 'Recommendation Date',
        featured: 'Recommendation Featured'
      };

      // Multiple selectors for recommendation text
      const textSelectors = [
        '.pvs-entity__description-text',
        '.pv-recommendation-entity__text',
        '.artdeco-list__item-description',
        'div.inline-show-more-text span[aria-hidden="true"]',
        'div[data-field="recommendation_text"]'
      ];

      // Multiple selectors for author name
      const authorSelectors = [
        '.pvs-entity__title-text',
        '.pv-recommendation-entity__detail__title',
        '.artdeco-list__item-title',
        'a[data-field="recommender"]',
        'span.hoverable-link-text'
      ];

      // Multiple selectors for author title
      const titleSelectors = [
        '.pvs-entity__subtitle-text',
        '.pv-recommendation-entity__detail__subtitle',
        '.artdeco-list__item-subtitle',
        'div[data-field="recommender_title"]'
      ];

      // Multiple selectors for relationship
      const relationshipSelectors = [
        '.pvs-entity__caption-text',
        '.pv-recommendation-entity__detail__caption',
        '.artdeco-list__item-caption',
        'div[data-field="recommender_relationship"]'
      ];

      // Multiple selectors for date
      const dateSelectors = [
        '.pvs-entity__supplementary-text',
        '.pv-recommendation-entity__detail__date',
        '.artdeco-list__item-supplementary',
        'div[data-field="recommendation_date"]'
      ];

      // Featured indicators
      const featuredSelectors = [
        '.pv-recommendation-entity--featured',
        '[data-field="is_featured"]',
        '.featured-recommendation'
      ];

      // Check if we have health metrics to use
      const useHealthMetrics = this.selectorVerifier.getHealthMetrics().size > 0;

      // Get the most effective selectors based on health metrics if available
      const effectiveTextSelectors = useHealthMetrics ?
        this.selectorVerifier.getWorkingSelectors(categories.text) : textSelectors;

      const effectiveAuthorSelectors = useHealthMetrics ?
        this.selectorVerifier.getWorkingSelectors(categories.author) : authorSelectors;

      // Extract text with retry logic and track selector effectiveness
      let text = '';
      for (const selector of effectiveTextSelectors.length > 0 ? effectiveTextSelectors : textSelectors) {
        try {
          const element = await item.findElement(By.css(selector));
          text = await element.getText() || '';
          if (text) {
            // Record success for this selector
            this.selectorVerifier.updateSelectorHealth(selector, categories.text, true, { text });
            break;
          } else {
            // Record failure - found element but no text
            this.selectorVerifier.updateSelectorHealth(selector, categories.text, false);
          }
        } catch (error) {
          // Record failure - selector didn't find an element
          this.selectorVerifier.updateSelectorHealth(selector, categories.text, false);
          continue;
        }
      }

      if (!text) {
        logger.debug('No recommendation text found');
        return null;
      }

      // Extract author name with retry logic
      let authorName = '';
      for (const selector of effectiveAuthorSelectors.length > 0 ? effectiveAuthorSelectors : authorSelectors) {
        try {
          const element = await item.findElement(By.css(selector));
          authorName = await element.getText() || '';
          if (authorName) {
            // Record success for this selector
            this.selectorVerifier.updateSelectorHealth(selector, categories.author, true, { text: authorName });
            break;
          } else {
            // Record failure - found element but no text
            this.selectorVerifier.updateSelectorHealth(selector, categories.author, false);
          }
        } catch (error) {
          // Record failure - selector didn't find an element
          this.selectorVerifier.updateSelectorHealth(selector, categories.author, false);
          continue;
        }
      }

      if (!authorName) {
        logger.debug('No author name found');
        return null;
      }

      const recommendation: NonNullable<LinkedInProfileData['recommendations']>[number] = {
        type,
        text: text.trim(),
        author: {
          name: authorName.trim()
        }
      };

      // Extract optional author title
      for (const selector of titleSelectors) {
        try {
          const element = await item.findElement(By.css(selector));
          const title = await element.getText() || '';
          if (title) {
            recommendation.author.title = title.trim();
            this.selectorVerifier.updateSelectorHealth(selector, categories.title, true, { text: title });
            break;
          } else {
            this.selectorVerifier.updateSelectorHealth(selector, categories.title, false);
          }
        } catch (error) {
          this.selectorVerifier.updateSelectorHealth(selector, categories.title, false);
          continue;
        }
      }

      // Extract optional relationship
      for (const selector of relationshipSelectors) {
        try {
          const element = await item.findElement(By.css(selector));
          const relationship = await element.getText() || '';
          if (relationship) {
            recommendation.author.relationship = relationship.trim();
            this.selectorVerifier.updateSelectorHealth(selector, categories.relationship, true, { text: relationship });
            break;
          } else {
            this.selectorVerifier.updateSelectorHealth(selector, categories.relationship, false);
          }
        } catch (error) {
          this.selectorVerifier.updateSelectorHealth(selector, categories.relationship, false);
          continue;
        }
      }

      // Extract optional date
      for (const selector of dateSelectors) {
        try {
          const element = await item.findElement(By.css(selector));
          const date = await element.getText() || '';
          if (date) {
            recommendation.date = date.trim();
            this.selectorVerifier.updateSelectorHealth(selector, categories.date, true, { text: date });
            break;
          } else {
            this.selectorVerifier.updateSelectorHealth(selector, categories.date, false);
          }
        } catch (error) {
          this.selectorVerifier.updateSelectorHealth(selector, categories.date, false);
          continue;
        }
      }

      // Try to extract featured/highlighted status
      try {
        let isFeatured = false;
        for (const selector of featuredSelectors) {
          try {
            const element = await item.findElement(By.css(selector));
            if (await element.isDisplayed()) {
              isFeatured = true;
              this.selectorVerifier.updateSelectorHealth(selector, categories.featured, true);
              break;
            } else {
              this.selectorVerifier.updateSelectorHealth(selector, categories.featured, false);
            }
          } catch (error) {
            this.selectorVerifier.updateSelectorHealth(selector, categories.featured, false);
            continue;
          }
        }

        if (isFeatured) {
          recommendation.featured = true;
        }
      } catch (error) {
        // Featured status is optional
      }

      return recommendation;
    } catch (error) {
      logger.debug(`Error extracting recommendation item details: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private async extractInterests(driver: WebDriver): Promise<NonNullable<LinkedInProfileData['interests']>> {
    try {
      const interests: NonNullable<LinkedInProfileData['interests']> = [];
      const sectionSelectors = [
        'section#interests',
        'section.interests-section',
        'div[id*="interests"]'
      ];

      for (const sectionSelector of sectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            const items = await section.findElements(By.css('.pvs-list__item-container, .pv-interest-entity'));

            for (const item of items) {
              try {
                const nameElement = await item.findElement(By.css('.pvs-entity__title-text, .pv-entity__summary-title-text'));
                const name = await nameElement.getText() || '';

                if (!name) continue;

                const interest: NonNullable<LinkedInProfileData['interests']>[number] = {
                  name
                };

                try {
                  const categoryElement = await item.findElement(By.css('.pvs-entity__subtitle-text, .pv-entity__summary-subtitle'));
                  const category = await categoryElement.getText() || '';
                  if (category) interest.category = category;
                } catch (error) {
                  // Category is optional
                }

                try {
                  const followersElement = await item.findElement(By.css('.pvs-entity__caption-text, .pv-entity__follower-count'));
                  const followersText = await followersElement.getText() || '';
                  const match = followersText.match(/(\d+,?\d*)\s*followers?/i);
                  if (match) {
                    interest.followers = parseInt(match[1].replace(/,/g, ''), 10);
                  }
                } catch (error) {
                  // Followers count is optional
                }

                interests.push(interest);
              } catch (error) {
                continue;
              }
            }

            if (interests.length > 0) break;
          }
        } catch (error) {
          continue;
        }
      }

      return interests;
    } catch (error) {
      logger.warn(`Error extracting interests: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Extract profile image URL
   * @param driver WebDriver instance
   * @returns Profile image URL
   */
  private async extractProfilePicture(driver: WebDriver): Promise<string | undefined> {
    try {
      const profilePicElement = await driver.findElement(By.css('.pv-top-card-profile-picture__image'));
      return await profilePicElement.getAttribute('src');
    } catch (error) {
      return undefined;
    }
  }

  private async extractExperience(driver: WebDriver): Promise<Experience[]> {
    try {
      const experiences: Experience[] = [];
      const categories = {
        section: 'Experience Section',
        item: 'Experience Item',
        title: 'Experience Title',
        company: 'Experience Company',
        dates: 'Experience Dates',
        description: 'Experience Description',
        location: 'Experience Location'
      };

      // First try to find the Experience section container
      const experienceSectionSelectors = [
        'section#experience',
        'section[data-section="experience"]',
        'section.artdeco-card.pv-profile-card.break-words',
        'div#experience',
        'div[data-field="experience"]',
        'div.pvs-list__outer-container'
      ];

      // Try to expand all "See more" buttons in the experience section
      await this.clickExpandButtons(driver, experienceSectionSelectors);
      await randomDelay(1000, 2000); // Wait for content to load

      // Try different selectors for experience items
      const experienceItemSelectors = [
        'li.artdeco-list__item',
        'div.pvs-entity',
        'div.pv-entity__position-group',
        'div.pv-profile-section__card-item',
        'div.pv-entity__summary-info',
        'div.experience-item'
      ];

      // Check if we have health metrics to use
      const useHealthMetrics = this.selectorVerifier.getHealthMetrics().size > 0;

      // Get the most effective selectors based on health metrics if available
      const effectiveSectionSelectors = useHealthMetrics ?
        this.selectorVerifier.getWorkingSelectors(categories.section) : experienceSectionSelectors;

      const effectiveItemSelectors = useHealthMetrics ?
        this.selectorVerifier.getWorkingSelectors(categories.item) : experienceItemSelectors;

      for (const sectionSelector of effectiveSectionSelectors.length > 0 ? effectiveSectionSelectors : experienceSectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            // Record success for this section selector
            this.selectorVerifier.updateSelectorHealth(sectionSelector, categories.section, true);

            const items = await section.findElements(By.css(effectiveItemSelectors.length > 0 ?
              effectiveItemSelectors.join(',') : experienceItemSelectors.join(',')));

            for (const item of items) {
              try {
                if (await item.isDisplayed()) {
                  const experienceItem = await this.extractExperienceDetails(item);
                  if (experienceItem) {
                    experiences.push(experienceItem);
                  }
                }
              } catch (error) {
                logger.debug(`Error extracting experience item: ${error instanceof Error ? error.message : String(error)}`);
                continue;
              }
            }

            if (experiences.length > 0) {
              logger.info(`Successfully extracted ${experiences.length} experiences`);
              break; // Found experiences, no need to try other section selectors
            }
          } else {
            // Record failure - section not displayed
            this.selectorVerifier.updateSelectorHealth(sectionSelector, categories.section, false);
          }
        } catch (error) {
          // Record failure - selector didn't find an element
          this.selectorVerifier.updateSelectorHealth(sectionSelector, categories.section, false);
          continue;
        }
      }

      return experiences;
    } catch (error) {
      logger.error('Error extracting experience:', error);
      return [];
    }
  }

  private async extractExperienceDetails(item: WebElement): Promise<Experience | null> {
    try {
      const titleSelectors = [
        'span.mr1.t-bold span[aria-hidden="true"]',
        'span.t-16.t-black.t-bold span[aria-hidden="true"]',
        'h3.t-16.t-black.t-bold',
        'div.pv-entity__summary-info h3',
        'div.pv-entity__role-details h3'
      ];

      const companySelectors = [
        'span.t-14.t-normal span[aria-hidden="true"]',
        'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
        'p.pv-entity__secondary-title',
        'span.pv-entity__secondary-title',
        'div.inline-show-more-text span[aria-hidden="true"]'
      ];

      const dateRangeSelectors = [
        'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
        'div.display-flex.align-items-center.t-14.t-normal.t-black--light span[aria-hidden="true"]',
        'h4.pv-entity__date-range span:not(:first-child)',
        'div.pv-entity__date-range span:not(:first-child)'
      ];

      const locationSelectors = [
        'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
        'h4.pv-entity__location span:not(:first-child)',
        'div.pv-entity__location span:not(:first-child)'
      ];

      const descriptionSelectors = [
        'div.inline-show-more-text span[aria-hidden="true"]',
        'div.pv-entity__description span[aria-hidden="true"]',
        'div.pv-entity__extra-details span[aria-hidden="true"]'
      ];

      const title = await this.extractTextFromElements(await item.findElements(By.css(titleSelectors.join(','))));
      const company = await this.extractTextFromElements(await item.findElements(By.css(companySelectors.join(','))));
      const dateRange = await this.extractTextFromElements(await item.findElements(By.css(dateRangeSelectors.join(','))));
      const location = await this.extractTextFromElements(await item.findElements(By.css(locationSelectors.join(','))));
      const description = await this.extractTextFromElements(await item.findElements(By.css(descriptionSelectors.join(','))));

      if (title || company) {
        return {
          title: title || '',
          company: company || '',
          dateRange: dateRange || '',
          location: location || '',
          description: description || ''
        };
      }
    } catch (error) {
      logger.error('Error extracting experience details:', error);
    }
    return null;
  }

  private async extractEducation(driver: WebDriver): Promise<Education[]> {
    try {
      const education: Education[] = [];

      // First try to find the Education section container
      const educationSectionSelectors = [
        'section#education',
        'section[data-section="education"]',
        'section.artdeco-card.pv-profile-card.break-words',
        'div#education',
        'div[data-field="education"]',
        'div.pvs-list__outer-container'
      ];

      // Try to expand all "See more" buttons in the education section
      await this.clickExpandButtons(driver, educationSectionSelectors);
      await randomDelay(1000, 2000); // Wait for content to load

      // Try different selectors for education items
      const educationItemSelectors = [
        'li.artdeco-list__item',
        'div.pvs-entity',
        'div.pv-entity__degree-info',
        'div.pv-profile-section__card-item',
        'div.pv-entity__summary-info',
        'div.education-item'
      ];

      for (const sectionSelector of educationSectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            const items = await section.findElements(By.css(educationItemSelectors.join(',')));
            for (const item of items) {
              try {
                if (await item.isDisplayed()) {
                  const educationItem = await this.extractEducationDetails(item);
                  if (educationItem) {
                    education.push(educationItem);
                  }
                }
              } catch (error) {
                continue;
              }
            }
            if (education.length > 0) {
              break; // Found education entries, no need to try other section selectors
            }
          }
        } catch (error) {
          continue;
        }
      }

      return education;
    } catch (error) {
      logger.error('Error extracting education:', error);
      return [];
    }
  }

  private async extractEducationDetails(item: WebElement): Promise<Education | null> {
    try {
      const schoolSelectors = [
        'span.mr1.hoverable-link-text.t-bold span[aria-hidden="true"]',
        'h3.pv-entity__school-name',
        'div.pv-entity__degree-info h3',
        'div.pv-entity__school-info h3',
        'div.inline-show-more-text span[aria-hidden="true"]'
      ];

      const degreeSelectors = [
        'span.t-14.t-normal span[aria-hidden="true"]',
        'span.pv-entity__comma-item',
        'p.pv-entity__degree-name span:not(:first-child)',
        'div.pv-entity__degree span:not(:first-child)',
        'div.pv-entity__degree-info p span:not(:first-child)'
      ];

      const fieldOfStudySelectors = [
        'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
        'p.pv-entity__fos span:not(:first-child)',
        'div.pv-entity__fos span:not(:first-child)',
        'div.pv-entity__field-of-study span:not(:first-child)'
      ];

      const dateRangeSelectors = [
        'span.t-14.t-normal.t-black--light span[aria-hidden="true"]',
        'p.pv-entity__dates span:not(:first-child)',
        'div.pv-entity__dates span:not(:first-child)',
        'div.display-flex.align-items-center.t-14.t-normal.t-black--light span[aria-hidden="true"]'
      ];

      const descriptionSelectors = [
        'div.inline-show-more-text span[aria-hidden="true"]',
        'div.pv-entity__description span[aria-hidden="true"]',
        'div.pv-entity__extra-details span[aria-hidden="true"]'
      ];

      const school = await this.extractTextFromElements(await item.findElements(By.css(schoolSelectors.join(','))));
      const degree = await this.extractTextFromElements(await item.findElements(By.css(degreeSelectors.join(','))));
      const fieldOfStudy = await this.extractTextFromElements(await item.findElements(By.css(fieldOfStudySelectors.join(','))));
      const dateRange = await this.extractTextFromElements(await item.findElements(By.css(dateRangeSelectors.join(','))));
      const description = await this.extractTextFromElements(await item.findElements(By.css(descriptionSelectors.join(','))));

      if (school || degree) {
        return {
          school: school || '',
          degree: degree || '',
          fieldOfStudy: fieldOfStudy || '',
          dateRange: dateRange || '',
          description: description || ''
        };
      }
    } catch (error) {
      logger.error('Error extracting education details:', error);
    }
    return null;
  }

  private async clickExpandButtons(driver: WebDriver, sectionSelectors: string[]): Promise<void> {
    try {
      const seeMoreSelectors = [
        'button.pv-profile-section__see-more-inline',
        'button.inline-show-more-text__button',
        'button.artdeco-button.artdeco-button--tertiary',
        'button.pvs-profile-section__action-button',
        'button[aria-label*="more"]',
        'button[aria-label*="Show more"]'
      ];

      for (const sectionSelector of sectionSelectors) {
        try {
          const section = await driver.findElement(By.css(sectionSelector));
          if (await section.isDisplayed()) {
            for (const seeMoreSelector of seeMoreSelectors) {
              try {
                const buttons = await section.findElements(By.css(seeMoreSelector));
                for (const button of buttons) {
                  if (await button.isDisplayed()) {
                    await button.click();
                    await randomDelay(500, 1000);
                  }
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
    } catch (error) {
      logger.warn('Error clicking expand buttons:', error);
    }
  }

  private async setupDriver(linkedInAccount?: ILinkedInAccount, proxy?: IProxy): Promise<WebDriver> {
    try {
      // Either use the WebDriverManager or create a new instance
      if (linkedInAccount && proxy) {
        // Use the managed instance with specific account and proxy
        // The getDriver method expects (campaignId: string, options: {...})
        const campaignId = 'scraper-session'; // Default campaign ID for standalone scraping
        return await this.webDriverManager.getDriver(campaignId, {
          linkedInAccount,
          proxy,
			headless: CONFIG.BROWSER.HEADLESS
        });
      } else {
        // Create a standalone Chrome driver for general use
        const builder = new Builder().forBrowser('chrome');

        // Setup Chrome options
        const options = new chrome.Options();

        // Add common Chrome options
        options.addArguments('--disable-extensions');
        options.addArguments('--disable-gpu');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');

        // Apply headless mode if configured
        if (CONFIG.BROWSER.HEADLESS) {
          options.addArguments('--headless=new');
        }

        // Apply window size
        options.windowSize({ width: 1920, height: 1080 });

        builder.setChromeOptions(options);
        return await builder.build();
      }
    } catch (error) {
      logger.error(`Error setting up WebDriver: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Navigate to a LinkedIn profile URL
   * Handles authentication if a LinkedIn account is provided
   * @param driver WebDriver instance
   * @param profileUrl URL of the LinkedIn profile to navigate to
   * @param linkedInAccount Optional LinkedIn account for authentication
   */
  private async navigateToProfile(driver: WebDriver, profileUrl: string, linkedInAccount?: ILinkedInAccount): Promise<void> {
    try {
      const normalizedUrl = normalizeLinkedInUrl(profileUrl);
      logger.info(`Navigating to normalized profile URL: ${normalizedUrl}`);

      // Login to LinkedIn if an account is provided
      if (linkedInAccount) {
        logger.info(`Attempting to log in with LinkedIn account: ${linkedInAccount.username}`);

        // Get decrypted password
        const password = linkedInAccount.getPassword();
        if (!password) {
          logger.error('Failed to decrypt LinkedIn account password');
          throw new Error('Failed to decrypt LinkedIn account password');
        }

        // Use the authentication service to login
        const loginResult = await linkedInAuthService.login(linkedInAccount, password);

        if (!loginResult.success) {
          logger.error(`Login error: ${loginResult.message}`);
          // Save page source and screenshot for diagnosis
          await this.takeScreenshot(driver, 'login-failed');
          throw new Error(`Failed to log in to LinkedIn: ${loginResult.message}`);
        }

        // Use the authenticated driver from the login result
        if (loginResult.driver) {
          // Quit current driver and use the authenticated one
          try {
            await driver.quit();
          } catch (quitError) {
            logger.warn(`Error quitting driver: ${quitError instanceof Error ? quitError.message : String(quitError)}`);
          }

          // Capture the authenticated driver
          driver = loginResult.driver;
          logger.info('Successfully authenticated with LinkedIn');
        }

        // Navigate to the profile URL directly now that we're logged in
        logger.info(`Navigating to profile: ${normalizedUrl}`);
        await driver.get(normalizedUrl);

        // Check if we've been redirected to a sign-in page
        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint')) {
          logger.error(`Redirected to login page: ${currentUrl} despite successful authentication`);
          await this.takeScreenshot(driver, 'login-redirect');
          throw new Error('Redirected to login page despite successful authentication');
        }
      } else {
        // If no account is provided, just navigate to the URL directly
        logger.info('No LinkedIn account provided, navigating directly');
        await driver.get(normalizedUrl);

        // Check if we've been redirected to a sign-in page
        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint')) {
          logger.error(`Redirected to login page: ${currentUrl}`);
          await this.takeScreenshot(driver, 'public-access-redirect');
          throw new Error('LinkedIn is requiring authentication to view this profile');
        }
      }

      // Wait for navigation to complete
      await randomDelay(3000, 5000);
      logger.info('Navigation to profile completed successfully');
    } catch (error) {
      logger.error(`Error navigating to profile: ${error instanceof Error ? error.message : String(error)}`);

      // Additional diagnostics
      try {
        const currentUrl = await driver.getCurrentUrl();
        const pageTitle = await driver.getTitle();
        logger.error(`Current URL: ${currentUrl}, Page title: ${pageTitle}`);
        await this.takeScreenshot(driver, 'navigation-error');
      } catch (diagnosticError) {
        logger.warn(`Error capturing diagnostics: ${diagnosticError instanceof Error ? diagnosticError.message : String(diagnosticError)}`);
      }

      throw error;
    }
  }

  private async isLoggedIn(driver: WebDriver): Promise<boolean> {
    try {
      // Check for elements that are present when logged in
      const loginIndicators = await driver.findElements(By.css('.global-nav__me, .feed-identity-module, [data-control-name="identity_welcome_message"]'));
      return loginIndicators.length > 0;
    } catch (error) {
      // If there's an error, assume not logged in
      return false;
    }
  }

  /**
   * Takes a screenshot and saves it to the data/screenshots directory
   * @param driver WebDriver instance
   * @param name Name identifier for the screenshot
   */
  private async takeScreenshot(driver: WebDriver, name: string): Promise<void> {
    try {
      // Create screenshots directory if it doesn't exist
      const screenshotsDir = path.join(process.cwd(), 'data', 'screenshots');
      try {
        await fs.mkdir(screenshotsDir, { recursive: true });
      } catch (mkdirError) {
        logger.warn(`Could not create screenshots directory: ${mkdirError instanceof Error ? mkdirError.message : String(mkdirError)}`);
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
      const filename = path.join(screenshotsDir, `${name}_${timestamp}.png`);

      // Take the screenshot
      const screenshot = await driver.takeScreenshot();
      await fs.writeFile(filename, screenshot, 'base64');

      // Also save the page source for further analysis
      try {
        const pageSource = await driver.getPageSource();
        const htmlFilename = path.join(screenshotsDir, `${name}_${timestamp}.html`);
        await fs.writeFile(htmlFilename, pageSource, 'utf8');
        logger.info(`Saved page source to ${htmlFilename}`);
      } catch (pageSourceError) {
        logger.warn(`Could not save page source: ${pageSourceError instanceof Error ? pageSourceError.message : String(pageSourceError)}`);
      }

      // Get and log the current URL and page title for context
      try {
        const url = await driver.getCurrentUrl();
        const title = await driver.getTitle();
        logger.info(`Screenshot saved to ${filename} (URL: ${url}, Title: ${title})`);
      } catch (error) {
        logger.info(`Screenshot saved to ${filename}`);
      }
    } catch (error) {
      logger.warn(`Error taking screenshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async scrollToBottom(driver: WebDriver): Promise<void> {
    try {
      // Scroll to bottom in increments
      let lastHeight = await driver.executeScript('return document.body.scrollHeight');

      while (true) {
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
        await randomDelay(1000, 2000); // Wait for content to load

        const newHeight = await driver.executeScript('return document.body.scrollHeight');
        if (newHeight === lastHeight) {
          break;
        }
        lastHeight = newHeight;
      }

      // Scroll back to top
      await driver.executeScript('window.scrollTo(0, 0)');
      await randomDelay(1000, 2000);
    } catch (error) {
      logger.error(`Error scrolling profile: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async extractTextFromElements(elements: WebElement[]): Promise<string | undefined> {
    for (const element of elements) {
      try {
        if (await element.isDisplayed()) {
          const text = await element.getText();
          if (text && text.trim()) {
            return text.trim();
          }
        }
      } catch (error) {
        continue;
      }
    }
    return undefined;
  }

  private async findVisibleElement(driver: WebDriver, selectors: string[]): Promise<WebElement | null> {
    for (const selector of selectors) {
      try {
        const elements = await driver.findElements(By.css(selector));
        for (const element of elements) {
          if (await element.isDisplayed()) {
            return element;
          }
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }

  private async getTextContent(element: Promise<WebElement>): Promise<string | undefined> {
    try {
      const resolvedElement = await element;
      const text = await resolvedElement.getText();
      return text.trim() || undefined;
    } catch (error) {
      return undefined;
    }
  }
}

export default LinkedInProfileScraper.getInstance();
