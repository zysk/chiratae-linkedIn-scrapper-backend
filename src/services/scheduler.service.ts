import schedule from "node-schedule";
import mongoose from "mongoose";
import { WebDriver } from "selenium-webdriver";
import Campaign from "../models/Campaign.model";
import { leadStatusObj } from "../helpers/Constants";
import { performSearch } from "./linkedInSearch.service";
import { processLeadScrapingQueue } from "./linkedInProfileScraper.service";
import { getRedisClient, acquireLock, releaseLock } from "./redis.service";
import { createWebDriver } from "../app";
import config from "../config/config";
import Logger from "../helpers/Logger";

// Create a dedicated logger for scheduler service
const logger = new Logger({ context: "scheduler" });

// Store jobs by campaign ID for cancellation
const scheduledJobs: Map<string, schedule.Job> = new Map();

/**
 * Schedule a campaign to run on a specified cron schedule
 * @param campaignId Campaign ID
 * @param cronExpression Cron expression (e.g., '0 9 * * 1-5' for weekdays at 9am)
 * @returns Promise<boolean> True if scheduling was successful
 */
export const scheduleCampaign = async (
  campaignId: string | mongoose.Types.ObjectId,
  cronExpression: string,
): Promise<boolean> => {
  if (!campaignId || !cronExpression) {
    logger.error("Campaign ID and cron expression are required");
    return false;
  }

  const id = campaignId.toString();

  try {
    // Cancel any existing schedule for this campaign
    cancelSchedule(id);

    // Validate that campaign exists
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      logger.error(`Campaign ${id} not found`);
      return false;
    }

    // Schedule the job with node-schedule
    const job = schedule.scheduleJob(cronExpression, async function () {
      logger.info(`Running scheduled campaign: ${id}`);

      // Attempt to acquire a lock to prevent concurrent runs
      const lockKey = `campaign:${id}:lock`;
      const redisClient = await getRedisClient();

      if (await acquireLock(redisClient, lockKey, 60 * 60)) {
        // 1 hour lock
        logger.info(`Acquired lock for campaign ${id}`);
        let driver: WebDriver | null = null;

        try {
          // Check if campaign is still active before running
          const currentCampaign = await Campaign.findById(id);
          if (!currentCampaign || !currentCampaign.isActive) {
            logger.info(
              `Campaign ${id} is no longer active, cancelling schedule`,
            );
            cancelSchedule(id);
            await releaseLock(redisClient, lockKey);
            return;
          }

          // Create a web driver for this job
          driver = await createWebDriver(currentCampaign.proxyId?.toString());
          if (!driver) {
            throw new Error("Failed to create WebDriver for scheduled task");
          }

          // Run the campaign search
          await performSearch(
            driver,
            id,
            currentCampaign.searchParams?.search || "",
            currentCampaign.searchParams?.location || "",
            currentCampaign.linkedInAccountId?.toString() || "",
            currentCampaign.searchParams?.filters || {},
            currentCampaign.searchParams?.maxResults || 10,
          );

          // Process scraped leads
          await processLeadScrapingQueue(driver, id);

          // Update lastRun time
          await Campaign.findByIdAndUpdate(id, {
            lastRun: new Date(),
            updatedBy: currentCampaign.createdBy,
          });

          logger.info(`Scheduled campaign ${id} completed successfully`);
        } catch (error) {
          logger.error(`Error running scheduled campaign ${id}:`, error);
          // Update campaign with error info
          await Campaign.findByIdAndUpdate(id, {
            lastError:
              error instanceof Error
                ? error.message
                : "Unknown error during scheduled run",
            lastErrorTime: new Date(),
            updatedBy: campaign.createdBy,
          });
        } finally {
          // Clean up
          if (driver) {
            try {
              await driver.quit();
            } catch (e) {
              logger.error("Error closing WebDriver:", e);
            }
          }

          // Release the lock
          await releaseLock(redisClient, lockKey);
        }
      } else {
        logger.info(
          `Could not acquire lock for campaign ${id}, it might be already running`,
        );
      }
    });

    // Store the job for later cancellation
    scheduledJobs.set(id, job);

    // Update campaign schedule info
    await Campaign.findByIdAndUpdate(id, {
      scheduledTime: cronExpression,
      isScheduled: true,
      updatedBy: campaign.createdBy,
    });

    logger.info(
      `Campaign ${id} scheduled with cron expression: ${cronExpression}`,
    );
    return true;
  } catch (error) {
    logger.error(`Error scheduling campaign ${id}:`, error);
    return false;
  }
};

/**
 * Cancel a scheduled campaign
 * @param campaignId Campaign ID
 * @returns boolean True if cancellation was successful
 */
export const cancelSchedule = (campaignId: string): boolean => {
  try {
    const job = scheduledJobs.get(campaignId);
    if (job) {
      job.cancel();
      scheduledJobs.delete(campaignId);
      logger.info(`Cancelled schedule for campaign ${campaignId}`);

      // Update campaign schedule status
      Campaign.findByIdAndUpdate(campaignId, {
        isScheduled: false,
        updatedBy: new mongoose.Types.ObjectId(), // This is problematic, should be the user ID
      }).catch((e) =>
        logger.error(`Failed to update campaign schedule status: ${e}`),
      );

      return true;
    }
    return false; // No job found
  } catch (error) {
    logger.error(
      `Error cancelling schedule for campaign ${campaignId}:`,
      error,
    );
    return false;
  }
};

/**
 * Initialize all scheduled campaigns from the database
 * Should be called when the application starts
 */
export const initializeScheduledCampaigns = async (): Promise<void> => {
  try {
    logger.info("Initializing scheduled campaigns");
    const campaigns = await Campaign.find({
      isActive: true,
      isScheduled: true,
      scheduledTime: { $exists: true, $ne: null },
    });

    logger.info(`Found ${campaigns.length} campaigns to schedule`);

    for (const campaign of campaigns) {
      if (campaign.scheduledTime) {
        await scheduleCampaign(campaign._id, campaign.scheduledTime);
      }
    }

    logger.info("Campaign scheduling initialization complete");
  } catch (error) {
    logger.error("Failed to initialize scheduled campaigns:", error);
  }
};

/**
 * Schedule a campaign to run one time at a specific date/time
 * @param campaignId Campaign ID
 * @param dateTime Date and time to run the campaign
 * @returns Promise<boolean> True if scheduling was successful
 */
export const scheduleOneTime = async (
  campaignId: string | mongoose.Types.ObjectId,
  dateTime: Date,
): Promise<boolean> => {
  if (!campaignId || !dateTime) {
    logger.error("Campaign ID and date/time are required");
    return false;
  }

  const id = campaignId.toString();

  try {
    // Cancel any existing schedule for this campaign
    cancelSchedule(id);

    // Validate that campaign exists
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      logger.error(`Campaign ${id} not found`);
      return false;
    }

    // Check if the date is in the future
    if (dateTime <= new Date()) {
      logger.error(`Date ${dateTime} is not in the future`);
      return false;
    }

    // Schedule the job for one-time execution
    const job = schedule.scheduleJob(dateTime, async function () {
      // Implementation is the same as for recurring jobs
      logger.info(`Running one-time scheduled campaign: ${id}`);

      // Use the same run logic as in scheduleCampaign, but without rescheduling
      // This is a duplicate of the job function in scheduleCampaign
      const lockKey = `campaign:${id}:lock`;
      const redisClient = await getRedisClient();

      if (await acquireLock(redisClient, lockKey, 60 * 60)) {
        // 1 hour lock
        let driver: WebDriver | null = null;
        try {
          // Check if campaign is still active before running
          const currentCampaign = await Campaign.findById(id);
          if (!currentCampaign || !currentCampaign.isActive) {
            logger.info(`Campaign ${id} is no longer active`);
            await releaseLock(redisClient, lockKey);
            return;
          }

          // Create a web driver for this job
          driver = await createWebDriver(currentCampaign.proxyId?.toString());
          if (!driver) {
            throw new Error("Failed to create WebDriver for one-time task");
          }

          // Run the campaign search
          await performSearch(
            driver,
            id,
            currentCampaign.searchParams?.search || "",
            currentCampaign.searchParams?.location || "",
            currentCampaign.linkedInAccountId?.toString() || "",
            currentCampaign.searchParams?.filters || {},
            currentCampaign.searchParams?.maxResults || 10,
          );

          // Process scraped leads
          await processLeadScrapingQueue(driver, id);

          // Update lastRun time and remove isScheduled flag
          await Campaign.findByIdAndUpdate(id, {
            lastRun: new Date(),
            isScheduled: false, // One-time execution completed
            updatedBy: currentCampaign.createdBy,
          });

          logger.info(`One-time campaign ${id} completed successfully`);
        } catch (error) {
          logger.error(`Error running one-time campaign ${id}:`, error);
          await Campaign.findByIdAndUpdate(id, {
            lastError:
              error instanceof Error
                ? error.message
                : "Unknown error during one-time run",
            lastErrorTime: new Date(),
            isScheduled: false, // Remove scheduled status even on failure
            updatedBy: campaign.createdBy,
          });
        } finally {
          // Clean up
          if (driver) {
            try {
              await driver.quit();
            } catch (e) {
              logger.error("Error closing WebDriver:", e);
            }
          }

          // Release the lock
          await releaseLock(redisClient, lockKey);
        }
      } else {
        logger.info(`Could not acquire lock for one-time campaign ${id}`);
      }
    });

    // Store the job for potential cancellation
    scheduledJobs.set(id, job);

    // Update campaign schedule info
    await Campaign.findByIdAndUpdate(id, {
      scheduledTime: dateTime.toISOString(),
      isScheduled: true,
      updatedBy: campaign.createdBy,
    });

    logger.info(`Campaign ${id} scheduled for one-time run at: ${dateTime}`);
    return true;
  } catch (error) {
    logger.error(`Error scheduling one-time campaign ${id}:`, error);
    return false;
  }
};

export default {
  scheduleCampaign,
  cancelSchedule,
  initializeScheduledCampaigns,
  scheduleOneTime,
};
