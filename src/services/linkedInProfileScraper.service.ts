import { WebDriver, By } from 'selenium-webdriver';
import mongoose from 'mongoose';
import Lead, { ILeadDocument } from '../models/Lead.model';
import {
  navigateTo,
  findElementSafe,
  getTextSafe,
  randomDelay,
  scrollDownGradually
} from '../helpers/SeleniumUtils';
import { leadStatusObj } from '../helpers/Constants';
import { createLeadLogEntry } from '../controllers/leadLog.controller';

// --- Profile Page Locators (HIGHLY LIKELY TO CHANGE - EXAMPLES ONLY) ---
const PROFILE_NAME = By.css('h1'); // Main profile name
const PROFILE_HEADLINE = By.css('.text-body-medium.break-words'); // Headline below name
const PROFILE_LOCATION = By.css('.text-body-small.inline.break-words'); // Location below headline
const PROFILE_ABOUT_SECTION = By.xpath("//section[.//h2[contains(text(),'About')]]//div[contains(@class,'inline-show-more-text')]");
const PROFILE_EXPERIENCE_SECTION = By.xpath("//section[.//h2[contains(text(),'Experience')]]");
const PROFILE_EDUCATION_SECTION = By.xpath("//section[.//h2[contains(text(),'Education')]]");
const PROFILE_SKILLS_SECTION = By.xpath("//section[.//h2[contains(text(),'Skills')]]");
const EXPERIENCE_ITEM = By.css('.pvs-entity'); // General container for experience/education items
const EXPERIENCE_TITLE = By.css('span[aria-hidden="true"]'); // Often the title is in a span like this
const EXPERIENCE_COMPANY = By.css('.t-14.t-normal span[aria-hidden="true"]'); // Company name might be nested
const EXPERIENCE_DURATION = By.css('.t-14.t-normal.t-black--light span[aria-hidden="true"]'); // Duration info
const EXPERIENCE_DESCRIPTION = By.css('.inline-show-more-text span[aria-hidden="true"]'); // Description if present
const EDUCATION_SCHOOL = By.css('span[aria-hidden="true"]'); // School name
const EDUCATION_DEGREE = By.css('.t-14.t-normal span[aria-hidden="true"]'); // Degree/field of study
const EDUCATION_DATES = By.css('.t-14.t-normal.t-black--light span[aria-hidden="true"]'); // Dates attended
const SKILL_ITEM = By.css('.app-aware-link span[aria-hidden="true"]'); // Skill text
const PROFILE_PICTURE = By.css('.pv-top-card-profile-picture__image'); // Profile picture element

/**
 * Scrapes data from a LinkedIn profile page.
 *
 * @param driver WebDriver instance, assumed to be logged in and on the profile page.
 * @param lead The lead document to update.
 * @returns Promise<boolean> True if scraping was successful, false otherwise.
 */
export const scrapeProfileData = async (
    driver: WebDriver,
    lead: ILeadDocument
): Promise<boolean> => {
    console.log(`Starting profile scrape for lead: ${lead.clientId} (ID: ${lead._id})`);
    const profileUrl = `https://www.linkedin.com/in/${lead.clientId}/`;

    try {
        await navigateTo(driver, profileUrl);
        await randomDelay(4000, 7000); // Allow page to load fully

        // --- Scrape Core Info ---
        const name = await getTextSafe(driver, PROFILE_NAME);
        const title = await getTextSafe(driver, PROFILE_HEADLINE);
        const location = await getTextSafe(driver, PROFILE_LOCATION);
        let profilePicture: string | null = null;
        const picElement = await findElementSafe(driver, PROFILE_PICTURE);
        if(picElement) {
            profilePicture = await picElement.getAttribute('src');
        }

        // --- Scrape About Section ---
        await scrollDownGradually(driver, 2, 500); // Scroll slightly to load sections
        const aboutElement = await findElementSafe(driver, PROFILE_ABOUT_SECTION);
        const about = aboutElement ? await aboutElement.getText() : null;

        // --- Scrape Experience Section ---
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight / 3);');
        await randomDelay(1500, 3000);
        const experience: any[] = [];
        const experienceSection = await findElementSafe(driver, PROFILE_EXPERIENCE_SECTION);
        if (experienceSection) {
            const items = await experienceSection.findElements(EXPERIENCE_ITEM);
            for (const item of items) {
                try {
                    const expTitle = await getTextSafe(item, EXPERIENCE_TITLE);
                    const expCompany = await getTextSafe(item, EXPERIENCE_COMPANY);
                    const expDuration = await getTextSafe(item, EXPERIENCE_DURATION);
                    const expDesc = await getTextSafe(item, EXPERIENCE_DESCRIPTION);
                    if (expTitle || expCompany) { // Only add if we found something useful
                         experience.push({
                            title: expTitle,
                            company: expCompany,
                            duration: expDuration,
                            description: expDesc
                        });
                    }
                } catch (itemError) {
                    console.warn('Error processing an experience item:', itemError);
                }
            }
        }

        // --- Scrape Education Section ---
         await driver.executeScript('window.scrollTo(0, document.body.scrollHeight * 2 / 3);');
         await randomDelay(1500, 3000);
        const education: any[] = [];
        const educationSection = await findElementSafe(driver, PROFILE_EDUCATION_SECTION);
        if (educationSection) {
            const items = await educationSection.findElements(EXPERIENCE_ITEM); // Re-use general item locator
            for (const item of items) {
                try {
                    const eduSchool = await getTextSafe(item, EDUCATION_SCHOOL);
                    const eduDegree = await getTextSafe(item, EDUCATION_DEGREE);
                    const eduDates = await getTextSafe(item, EDUCATION_DATES);
                     if (eduSchool || eduDegree) {
                         education.push({
                            school: eduSchool,
                            degree: eduDegree,
                            dates: eduDates
                        });
                    }
                } catch (itemError) {
                     console.warn('Error processing an education item:', itemError);
                }
            }
        }

        // --- Scrape Skills Section ---
        await driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
        await randomDelay(1500, 3000);
        const skills: string[] = [];
        const skillsSection = await findElementSafe(driver, PROFILE_SKILLS_SECTION);
        if (skillsSection) {
             const items = await skillsSection.findElements(SKILL_ITEM);
             for (const item of items) {
                 try {
                     const skillText = await item.getText();
                     if (skillText) {
                         skills.push(skillText.trim());
                     }
                 } catch (itemError) {
                      console.warn('Error processing a skill item:', itemError);
                 }
             }
        }

        // --- Update Lead Document ---
        lead.profileData = {
            name: name || undefined,
            title: title || undefined,
            location: location || undefined,
            profilePicture: profilePicture || undefined,
            about: about || undefined,
            experience: experience.length > 0 ? experience : undefined,
            education: education.length > 0 ? education : undefined,
            skills: skills.length > 0 ? skills : undefined,
            // contactInfo: null // TODO: Implement contact info scraping if needed
        };
        lead.isSearched = true; // Mark profile as scraped
        lead.status = leadStatusObj.CONTACTED; // Or another appropriate status
        await lead.save();

        // Create log entry for successful scraping
        await createLeadLogEntry(
            lead._id,
            'PROFILE_SCRAPED',
            `Profile successfully scraped for ${lead.clientId}${name ? ' (' + name + ')' : ''}`,
            undefined, // System action, no user ID
            lead.status === leadStatusObj.CONTACTED ? 'CREATED' : lead.status, // Previous status
            leadStatusObj.CONTACTED // New status
        );

        console.log(`Successfully scraped and updated lead: ${lead.clientId}`);
        return true;

    } catch (error: any) {
        console.error(`Error scraping profile for lead ${lead.clientId}:`, error);
        lead.status = leadStatusObj.REJECTED; // Mark as failed to scrape
        lead.isSearched = false; // Keep as unscraped

        // Create log entry for failed scraping
        try {
            await createLeadLogEntry(
                lead._id,
                'PROFILE_SCRAPE_FAILED',
                `Failed to scrape profile: ${error.message || 'Unknown error'}`,
                undefined, // System action, no user ID
                lead.status, // Previous status
                leadStatusObj.REJECTED // New status
            );

            await lead.save();
        } catch (dbError) {
            console.error(`Failed to update lead status after scraping error for ${lead.clientId}`, dbError);
        }

        return false;
    }
};

/**
 * Processes a queue of leads for profile scraping.
 *
 * @param driver WebDriver instance
 * @param campaignId Campaign ID to find leads for.
 * @param limit Max number of leads to process in this batch.
 */
export const processLeadScrapingQueue = async (
    driver: WebDriver,
    campaignId: string | mongoose.Types.ObjectId,
    limit: number = 10
): Promise<void> => {
    console.log(`Checking lead scraping queue for campaign ${campaignId}`);
    const leadsToScrape = await Lead.find({
        campaignId: campaignId,
        isSearched: false, // Find leads not yet scraped
        status: leadStatusObj.CREATED // Only scrape newly created leads
    }).limit(limit);

    if (leadsToScrape.length === 0) {
        console.log(`No leads found in the scraping queue for campaign ${campaignId}.`);
        return;
    }

    console.log(`Found ${leadsToScrape.length} leads to scrape.`);

    for (const lead of leadsToScrape) {
        await scrapeProfileData(driver, lead);
        // Add delay between profile scrapes to mimic human behavior
        await randomDelay(15000, 30000); // 15-30 second delay
    }

    console.log(`Finished processing batch of ${leadsToScrape.length} leads for campaign ${campaignId}.`);
};