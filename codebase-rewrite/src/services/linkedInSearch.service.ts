import { WebDriver, By, WebElement } from 'selenium-webdriver';
import Campaign, { ICampaignDocument } from '../models/Campaign.model';
import Lead from '../models/Lead.model';
import PreviousLead from '../models/PreviousLead.model';
import { campaignStatusObj, leadStatusObj } from '../helpers/Constants';
import {
  navigateTo,
  findElementWait,
  findElementSafe,
  sendKeysSafe,
  clickElementSafe,
  randomDelay,
  scrollDownGradually,
  getTextSafe
} from '../helpers/SeleniumUtils';
import { processLeadScrapingQueue } from './linkedInProfileScraper.service'; // Import the profile scraper

// --- Constants & Locators (HIGHLY LIKELY TO CHANGE) ---
const SEARCH_URL_BASE = 'https://www.linkedin.com/search/results/people/?keywords=';
const PEOPLE_FILTER_BUTTON = By.xpath("//button[text()='People']");
const ALL_FILTERS_BUTTON = By.xpath("//button[text()='All filters']");
// Filter panel locators (Examples - MUST BE VERIFIED)
const CURRENT_COMPANY_INPUT = By.xpath("//label[text()='Current company']/following-sibling::input");
const PAST_COMPANY_INPUT = By.xpath("//label[text()='Past company']/following-sibling::input");
const SCHOOL_INPUT = By.xpath("//label[text()='School']/following-sibling::input");
const APPLY_FILTERS_BUTTON = By.xpath("//button/span[text()='Show results']");
// Search results locators (Examples - MUST BE VERIFIED)
const SEARCH_RESULT_LIST = By.css('ul.reusable-search__entity-result-list > li'); // List items containing profiles
const PROFILE_LINK = By.css('a.app-aware-link[href*="/in/"]'); // Link within the list item
const NEXT_BUTTON = By.xpath("//button[@aria-label='Next']");
const TOTAL_RESULTS_INDICATOR = By.css('.search-results-container h2'); // Example for total results

// --- Helper Functions ---

/**
 * Extracts LinkedIn profile ID from a profile URL.
 * Example: https://www.linkedin.com/in/williamhgates/ -> williamhgates
 */
const extractProfileId = (url: string): string | null => {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.pathname.startsWith('/in/')) {
      // Split by '/', filter empty parts, take the last part
      const parts = parsedUrl.pathname.split('/').filter(part => part !== '');
      if (parts.length > 0 && parts[0] === 'in') {
          // Return the part after '/in/', removing potential query params
          return parts[1].split('?')[0];
      }
    }
  } catch (e) {
    console.error(`Error parsing URL ${url}:`, e);
  }
  return null;
};

// --- Main Search Function ---

/**
 * Performs the LinkedIn search based on campaign criteria.
 *
 * @param driver WebDriver instance, assumed to be logged in.
 * @param campaign The campaign document to process.
 * @returns Promise resolving when the search part is complete.
 */
export const performSearch = async (driver: WebDriver, campaign: ICampaignDocument): Promise<void> => {
  console.log(`Starting search for campaign: ${campaign.name} (ID: ${campaign._id})`);
  let leadsFoundInThisRun = 0;

  try {
    // 1. Mark campaign as processing
    campaign.processing = true;
    await campaign.save();

    // 2. Navigate to search results page
    const searchUrl = `${SEARCH_URL_BASE}${encodeURIComponent(campaign.searchQuery)}`;
    await navigateTo(driver, searchUrl);
    await randomDelay(3000, 5000);

    // 3. Apply People Filter (usually default, but good to ensure)
    // await clickElementSafe(driver, PEOPLE_FILTER_BUTTON); // May not be needed if people is default
    // await randomDelay(1500, 3000);

    // 4. Apply Advanced Filters if present
    let filtersApplied = false;
    if (campaign.company || campaign.pastCompany || campaign.school) {
        if (!await clickElementSafe(driver, ALL_FILTERS_BUTTON)) {
            console.warn('Could not find/click All Filters button. Proceeding without advanced filters.');
        } else {
            await randomDelay(2000, 4000);
            // Apply filters (add error handling for each)
            if (campaign.company) await sendKeysSafe(driver, CURRENT_COMPANY_INPUT, campaign.company + '\n'); // + Enter
            if (campaign.pastCompany) await sendKeysSafe(driver, PAST_COMPANY_INPUT, campaign.pastCompany + '\n');
            if (campaign.school) await sendKeysSafe(driver, SCHOOL_INPUT, campaign.school + '\n');
            await randomDelay(1500, 3000);

            if (!await clickElementSafe(driver, APPLY_FILTERS_BUTTON)) {
                 console.warn('Could not apply filters. Proceeding with basic search.');
            } else {
                filtersApplied = true;
                console.log('Applied advanced filters.');
                await randomDelay(4000, 6000);
            }
        }
    }

    // 5. Extract Total Results (optional, can be inaccurate)
    try {
        const totalText = await getTextSafe(driver, TOTAL_RESULTS_INDICATOR, 5000);
        if (totalText) {
            const match = totalText.match(/(\d+)/); // Basic number extraction
            if (match && match[1]) {
                campaign.totalResults = parseInt(match[1], 10);
                console.log(`Estimated total results: ${campaign.totalResults}`);
            }
        }
    } catch (e) { console.warn('Could not extract total results indicator.', e); }

    // 6. Paginate through results
    let currentPage = 1;
    const maxPages = 100; // LinkedIn limit
    while (currentPage <= maxPages) {
      console.log(`Processing page ${currentPage} for campaign ${campaign.name}`);
      await scrollDownGradually(driver, 5, 600);
      await randomDelay(2000, 4000);

      const resultItems = await driver.findElements(SEARCH_RESULT_LIST);
      console.log(`Found ${resultItems.length} potential profiles on page ${currentPage}.`);

      if (resultItems.length === 0 && currentPage > 1) {
          console.log('No more results found on this page, likely end of search.');
          break; // Exit if empty page after first page
      }

      for (const item of resultItems) {
        let profileUrl: string | null = null;
        try {
          const linkElement = await item.findElement(PROFILE_LINK);
          profileUrl = await linkElement.getAttribute('href');
        } catch (e) {
            continue;
        }

        // Ensure profileUrl is not null before processing
        if (!profileUrl) {
            console.warn('Skipping item with null profile URL');
            continue;
        }

        const profileId = extractProfileId(profileUrl); // Now guaranteed to pass a string
        if (!profileId) {
          console.warn(`Could not extract profile ID from URL: ${profileUrl}`);
          continue;
        }

        // Check for duplicates
        const alreadyExists = await PreviousLead.findOne({ profileId });
        if (alreadyExists) {
          // console.log(`Skipping duplicate profile: ${profileId}`);
          continue;
        }

        // Create Lead and PreviousLead documents
        try {
          const newLead = new Lead({
            clientId: profileId,
            campaignId: campaign._id,
            status: leadStatusObj.CREATED,
            isSearched: false,
            createdBy: campaign.createdBy
          });
          await newLead.save();

          const newPreviousLead = new PreviousLead({
              profileId: profileId,
              campaignId: campaign._id,
              timestamp: new Date()
          });
          await newPreviousLead.save();

          // Ensure resultsArr exists before pushing
          if (!campaign.resultsArr) {
              campaign.resultsArr = [];
          }
          campaign.resultsArr.push(newLead._id);
          leadsFoundInThisRun++;
          // console.log(`New lead created: ${profileId}`);

        } catch (dbError: any) {
          if (dbError.code === 11000) { // Handle rare race condition for duplicates
            // console.log(`Duplicate profile (race condition): ${profileId}`);
          } else {
            console.error(`Error saving lead/previousLead for ${profileId}:`, dbError);
          }
        }
      } // End loop through items on page

       console.log(`Finished processing page ${currentPage}. Leads found in this run: ${leadsFoundInThisRun}`);

      // Check for and click the Next button
      const nextButton = await findElementSafe(driver, NEXT_BUTTON, 3000);
      if (nextButton && await nextButton.isEnabled()) {
        await clickElementSafe(driver, NEXT_BUTTON);
        currentPage++;
        await randomDelay(3000, 6000); // Wait for next page load
      } else {
        console.log('Next button not found or disabled. End of results.');
        break; // Exit pagination loop
      }
    } // End pagination loop

    // 7. Update campaign status after search phase
    campaign.isSearched = true;
    campaign.status = campaignStatusObj.COMPLETED; // Mark search as done
    campaign.processing = false; // No longer processing search
    campaign.lastRun = new Date();
    campaign.runCount = (campaign.runCount || 0) + 1;
    await campaign.save();
    console.log(`Search phase completed for campaign: ${campaign.name}. Total new leads found: ${leadsFoundInThisRun}`);

    // 8. Trigger Profile Scraping for the newly found leads
    if (leadsFoundInThisRun > 0) {
        console.log(`Triggering profile scraping for campaign: ${campaign.name}`);
        // Run this asynchronously in the background
        processLeadScrapingQueue(driver, campaign._id, 100) // Process up to 100 profiles
          .then(() => {
              console.log(`Background profile scraping queue processing finished for campaign: ${campaign.name}`);
               // Optionally update campaign status again after scraping?
          })
          .catch(scrapeError => {
              console.error(`Background profile scraping failed for campaign ${campaign.name}:`, scrapeError);
              // Optionally update campaign status to indicate scraping error?
          });
    }

  } catch (error: any) {
    console.error(`Error processing search for campaign ${campaign._id}:`, error);
    // Mark campaign as failed or potentially retry?
    campaign.status = campaignStatusObj.FAILED;
    campaign.processing = false;
    campaign.lastRun = new Date();
    await campaign.save();
    // TODO: Log error details appropriately (e.g., UserLog or specific CampaignLog)
  }
};