import { WebDriver } from 'selenium-webdriver';
import { RedisClientType } from 'redis';
import Campaign from '../models/Campaign.model';
import { performSearch } from '../services/linkedInSearch.service';
import { campaignStatusObj } from '../helpers/Constants';
import { checkLinkedInLoginStatus } from '../services/linkedInAuth.service';
import { acquireLock, releaseLock } from '../services/redis.service';

/**
 * Main cron function that handles automated campaign execution
 *
 * @param driver - Selenium WebDriver instance
 * @param redisClient - Redis client for distributed locking
 */
export const cronFunc = async (
  driver: WebDriver | null,
  redisClient: RedisClientType | null // Allow null if connection failed
): Promise<void> => {
  if (!driver || !redisClient) {
    console.error('Cron Error: WebDriver or Redis client is not available.');
    return;
  }

  // Acquire lock using the service function
  const lockKey = 'cron:linkedin-search';
  // Use a more robust unique value, e.g., include hostname if multiple servers run cron
  const lockValue = `cron-worker-${process.pid}-${Date.now()}`;
  const lockAcquired = await acquireLock(redisClient, lockKey, lockValue, 3600); // 1 hour expiry

  if (!lockAcquired) {
    console.log('Cron job lock busy or failed to acquire. Skipping this run.');
    return;
  }

  console.log('Cron lock acquired.');

  try {
    // 1. Check if logged into LinkedIn
    const isLoggedIn = await checkLinkedInLoginStatus(driver);
    if (!isLoggedIn) {
      console.error('Cron Error: Not logged into LinkedIn. Manual login required.');
      // TODO: Add notification mechanism here (e.g., email admin)
      return; // Stop processing if not logged in
    }

    // 2. Find campaigns to run
    const now = new Date();
    const campaignsToRun = await Campaign.find({
      isScheduled: true, // Ensure it's supposed to be scheduled
      status: { $in: [campaignStatusObj.CREATED, campaignStatusObj.FAILED] }, // Run new or previously failed campaigns
      processing: false, // Ensure not already running
      // TODO: Add check for schedule timing if campaigns have individual cron patterns
      // For now, assume any scheduled, non-completed, non-processing campaign is eligible
    }).limit(5); // Limit number of campaigns per cron run to avoid overwhelming system

    if (campaignsToRun.length === 0) {
      console.log('No scheduled campaigns found to run at this time.');
      return;
    }

    console.log(`Found ${campaignsToRun.length} campaigns to run.`);

    // 3. Process each campaign sequentially
    for (const campaign of campaignsToRun) {
      console.log(`Processing campaign ${campaign.name} (ID: ${campaign._id}) via cron.`);
      try {
          // TODO: Need to handle driver/proxy assignment per campaign if needed
          // If campaigns need specific proxies, the driver might need to be recreated
          // For now, use the shared driver
          await performSearch(driver, campaign);
      } catch (campaignError) {
          console.error(`Error during cron execution for campaign ${campaign._id}:`, campaignError);
          // Error is logged within performSearch, which also sets status to FAILED
      }
    }

    console.log('Finished processing campaigns for this cron run.');

  } catch (error) {
    console.error('Unhandled error in main cron function:', error);
  } finally {
    // Release lock using the service function
    const released = await releaseLock(redisClient, lockKey, lockValue);
    if (released) {
      console.log('Cron lock released.');
    } else {
      console.warn('Cron lock could not be released (maybe expired or value changed).');
    }
  }
};