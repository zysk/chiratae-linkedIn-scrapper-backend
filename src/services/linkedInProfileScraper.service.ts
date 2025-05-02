import { WebDriver, By } from "selenium-webdriver";
import mongoose from "mongoose";
import {
  navigateTo,
  findElementSafe,
  randomDelay,
  scrollDownGradually,
} from "../helpers/SeleniumUtils";
import Lead, { ILeadDocument } from "../models/Lead.model";
import { leadStatusObj } from "../helpers/Constants";
import Logger from "../helpers/Logger";

// Create a dedicated logger for profile scraper
const logger = new Logger({ context: "profile-scraper" });

// --- Locators --- (These are likely to change and need maintenance)
const PROFILE_NAME = By.css(".text-heading-xlarge");
const PROFILE_TITLE = By.css(".text-body-medium");
const PROFILE_LOCATION = By.css(
  ".text-body-small.inline.t-black--light.break-words",
);
const PROFILE_ABOUT = By.css("[data-section='summary']");
const PROFILE_EXPERIENCE_SECTION = By.css("#experience");
const PROFILE_EXPERIENCE_ITEMS = By.css(
  "#experience .pvs-list__outer-container .pvs-entity",
);
const PROFILE_EDUCATION_SECTION = By.css("#education");
const PROFILE_EDUCATION_ITEMS = By.css(
  "#education .pvs-list__outer-container .pvs-entity",
);
const PROFILE_SKILLS_SECTION = By.css("#skills");
const PROFILE_SKILLS_ITEMS = By.css(
  "#skills .pvs-list__outer-container .pvs-entity .mr1 span",
);

// Types for profile data
interface ProfileData {
  name?: string;
  title?: string;
  location?: string;
  about?: string;
  experience?: Array<{
    title?: string;
    company?: string;
    dates?: string;
  }>;
  education?: Array<{
    school?: string;
    degree?: string;
    dates?: string;
  }>;
  skills?: string[];
  contactInfo?: Record<string, unknown>; // Structure can vary
}

/**
 * Scrape LinkedIn profile data for a lead
 * @param driver - Selenium WebDriver
 * @param lead - The lead document to update with scraped data
 * @returns Promise<boolean> - Success status
 */
export const scrapeProfileData = async (
  driver: WebDriver,
  lead: ILeadDocument,
): Promise<boolean> => {
  logger.info(
    `Starting profile scrape for lead: ${lead.clientId} (ID: ${lead._id})`,
  );
  const profileUrl = `https://www.linkedin.com/in/${lead.clientId}/`;

  try {
    // 1. Navigate to profile page
    await navigateTo(driver, profileUrl);
    await randomDelay(3000, 5000);

    // 2. Scroll to view more content
    await scrollDownGradually(driver, 5, 800);

    // 3. Start collecting data
    const profileData: ProfileData = {};

    // Basic info
    profileData.name = await findElementSafe(driver, PROFILE_NAME)
      .then((el) => (el ? el.getText() : null))
      .catch(() => null);

    profileData.title = await findElementSafe(driver, PROFILE_TITLE)
      .then((el) => (el ? el.getText() : null))
      .catch(() => null);

    profileData.location = await findElementSafe(driver, PROFILE_LOCATION)
      .then((el) => (el ? el.getText() : null))
      .catch(() => null);

    profileData.about = await findElementSafe(driver, PROFILE_ABOUT)
      .then((el) => (el ? el.getText() : null))
      .catch(() => null);

    // Experience
    await scrollDownGradually(driver, 3, 800);
    await randomDelay(1500, 3000);

    const experience: Array<{
      title?: string;
      company?: string;
      dates?: string;
    }> = [];

    const experienceSection = await findElementSafe(
      driver,
      PROFILE_EXPERIENCE_SECTION,
    );
    if (experienceSection) {
      const experienceItems = await driver.findElements(
        PROFILE_EXPERIENCE_ITEMS,
      );
      for (const item of experienceItems) {
        try {
          const text = await item.getText();
          const lines = text.split("\n");
          if (lines.length >= 2) {
            experience.push({
              title: lines[0],
              company: lines[1],
              dates: lines.length > 2 ? lines[2] : "",
            });
          }
        } catch (itemError) {
          logger.warn("Error processing an experience item:", itemError);
        }
      }
    }

    profileData.experience = experience;

    // Education
    await scrollDownGradually(driver, 3, 800);
    await randomDelay(1500, 3000);

    const education: Array<{
      school?: string;
      degree?: string;
      dates?: string;
    }> = [];

    const educationSection = await findElementSafe(
      driver,
      PROFILE_EDUCATION_SECTION,
    );
    if (educationSection) {
      const educationItems = await driver.findElements(PROFILE_EDUCATION_ITEMS);
      for (const item of educationItems) {
        try {
          const text = await item.getText();
          const lines = text.split("\n");
          if (lines.length >= 1) {
            education.push({
              school: lines[0],
              degree: lines.length > 1 ? lines[1] : "",
              dates: lines.length > 2 ? lines[2] : "",
            });
          }
        } catch (itemError) {
          logger.warn("Error processing an education item:", itemError);
        }
      }
    }

    profileData.education = education;

    // Skills
    await scrollDownGradually(driver, 3, 800);
    const skills: string[] = [];
    const skillsSection = await findElementSafe(driver, PROFILE_SKILLS_SECTION);
    if (skillsSection) {
      const skillItems = await driver.findElements(PROFILE_SKILLS_ITEMS);
      for (const item of skillItems) {
        try {
          const text = await item.getText();
          if (text.trim()) {
            skills.push(text.trim());
          }
        } catch (itemError) {
          logger.warn("Error processing a skill item:", itemError);
        }
      }
    }

    profileData.skills = skills;

    // 4. Update lead with scraped data
    lead.profileData = profileData;
    lead.isSearched = true;
    lead.status = leadStatusObj.NEW; // Mark as successfully scraped
    lead.lastScraped = new Date();
    await lead.save();

    logger.info(`Successfully scraped and updated lead: ${lead.clientId}`);
    return true;
  } catch (error: any) {
    logger.error(`Error scraping profile for lead ${lead.clientId}:`, error);
    lead.status = leadStatusObj.REJECTED; // Mark as failed to scrape
    lead.isSearched = false; // Keep as unscraped
    lead.lastScrapeFailed = new Date();
    lead.scrapeError = error.message || String(error);

    // Try to save the error info
    try {
      await lead.save();
    } catch (dbError) {
      logger.error(
        `Failed to update lead status after scraping error for ${lead.clientId}`,
        dbError,
      );
    }

    return false;
  }
};

/**
 * Process a batch of leads from the scraping queue for a campaign
 * @param driver - Selenium WebDriver
 * @param campaignId - Campaign ID
 * @param limit - Maximum number of leads to process (default: 10)
 */
export const processLeadScrapingQueue = async (
  driver: WebDriver,
  campaignId: string | mongoose.Types.ObjectId,
  limit: number = 10,
): Promise<void> => {
  logger.info(`Checking lead scraping queue for campaign ${campaignId}`);
  const leadsToScrape = await Lead.find({
    campaignId: campaignId,
    isSearched: false, // Find leads not yet scraped
    status: { $ne: leadStatusObj.REJECTED }, // Skip already rejected leads
  })
    .limit(limit)
    .exec();

  if (leadsToScrape.length === 0) {
    logger.info(
      `No leads found in the scraping queue for campaign ${campaignId}.`,
    );
    return;
  }

  logger.info(`Found ${leadsToScrape.length} leads to scrape.`);

  for (const lead of leadsToScrape) {
    await scrapeProfileData(driver, lead);
    // Add small delay between profiles to avoid rate limiting
    await randomDelay(3000, 5000);
  }

  logger.info(
    `Finished processing batch of ${leadsToScrape.length} leads for campaign ${campaignId}.`,
  );
};
