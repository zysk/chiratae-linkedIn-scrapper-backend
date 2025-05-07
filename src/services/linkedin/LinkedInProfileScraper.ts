import { WebDriver, By, until } from 'selenium-webdriver';
import { randomDelay, humanTypeText } from '../../utils/delay';
import logger from '../../utils/logger';
import { normalizeLinkedInUrl, extractProfileId, extractCleanName } from '../../utils/linkedin.utils';
import User from '../../models/user.model';
import Lead from '../../models/lead.model';
import mongoose from 'mongoose';
import { rolesObj } from '../../utils/constants';

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
 * Service for LinkedIn profile scraping functionality
 */
class LinkedInProfileScraper {
  private static instance: LinkedInProfileScraper;

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
   * Scrape a LinkedIn profile by URL
   * @param driver WebDriver instance
   * @param profileUrl LinkedIn profile URL
   * @param campaignId Optional campaign ID for lead tracking
   * @returns Extracted profile data or null if scraping fails
   */
  public async scrapeProfile(
    driver: WebDriver,
    profileUrl: string,
    campaignId?: string
  ): Promise<ProfileData | null> {
    try {
      logger.info(`Scraping LinkedIn profile: ${profileUrl}`);
      const normalizedUrl = normalizeLinkedInUrl(profileUrl);
      const profileId = extractProfileId(normalizedUrl);

      if (!profileId) {
        logger.error(`Invalid LinkedIn profile URL: ${profileUrl}`);
        return null;
      }

      // Navigate to profile
      await driver.get(normalizedUrl);
      await randomDelay(3000, 5000);

      // Check if page loaded properly
      try {
        await driver.wait(
          until.elementLocated(By.css('.pv-top-card')),
          15000
        );
      } catch (error) {
        logger.error(`Failed to load profile page: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      }

      // Start extracting basic profile data
      const profileData: ProfileData = {
        profileId,
        profileUrl: normalizedUrl,
        name: await this.extractName(driver),
      };

      // Extract additional profile information
      profileData.headline = await this.extractHeadline(driver);
      profileData.location = await this.extractLocation(driver);
      profileData.summary = await this.extractSummary(driver);
      profileData.imageUrl = await this.extractProfileImage(driver);

      // Check if we need to click "Show more" buttons to expand sections
      await this.expandSections(driver);

      // Extract experience data
      profileData.experienceArr = await this.extractExperience(driver);

      // Set current position based on experience data
      if (profileData.experienceArr && profileData.experienceArr.length > 0) {
        const currentJob = profileData.experienceArr.find(exp => exp.isCurrentRole);
        if (currentJob) {
          profileData.currentPosition = `${currentJob.title} at ${currentJob.company}`;
        }
      }

      // Extract education data
      profileData.educationArr = await this.extractEducation(driver);

      // Extract skills
      profileData.skills = await this.extractSkills(driver);

      // Extract contact info (requires additional navigation)
      profileData.contactInfo = await this.extractContactInfo(driver);

      // If campaign ID is provided, update or create User and Lead records
      if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
        await this.saveProfileData(profileData, campaignId);
      }

      logger.info(`Successfully scraped profile data for ${profileData.name}`);
      return profileData;
    } catch (error) {
      logger.error(`Profile scraping error: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Extract profile name
   * @param driver WebDriver instance
   * @returns Profile name
   */
  private async extractName(driver: WebDriver): Promise<string> {
    try {
      const nameElement = await driver.findElement(By.css('.pv-top-card h1'));
      const fullName = await nameElement.getText();
      return extractCleanName(fullName);
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
      const headlineElement = await driver.findElement(By.css('.pv-top-card .text-body-medium'));
      return await headlineElement.getText();
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
      const locationElement = await driver.findElement(By.css('.pv-top-card .text-body-small.inline'));
      return await locationElement.getText();
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
}

export default LinkedInProfileScraper.getInstance();
