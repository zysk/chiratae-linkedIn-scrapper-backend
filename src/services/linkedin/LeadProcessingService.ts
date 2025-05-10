import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../utils/logger';
import { LinkedInProfileScraper } from './LinkedInProfileScraper';
import Lead, { LeadProcessingStatus } from '../../models/lead.model';
import Campaign, { CampaignStatus } from '../../models/campaign.model';
import JobQueueService, { JobType, JobPriority, QueueName } from '../redis/JobQueueService';
import { normalizeLinkedInUrl, constructProfileUrl } from '../../utils/linkedin.utils';
import WebDriverManager from '../selenium/WebDriverManager';
import { ILinkedInAccount } from '../../models/linkedinAccount.model';
import { IProxy } from '../../models/proxy.model';

/**
 * Service for cleaning up screenshots after campaign completion
 */
class ScreenshotCleanupService {
  /**
   * Clean up screenshots for a specific campaign
   * @param campaignId Campaign ID
   */
  public static async cleanupCampaignScreenshots(campaignId: string): Promise<void> {
    try {
      const screenshotsDir = path.join(process.cwd(), 'screenshots');

      // Check if directory exists
      try {
        await fs.access(screenshotsDir);
      } catch (error) {
        // Directory doesn't exist, nothing to clean up
        return;
      }

      // Get all files in the screenshots directory
      const files = await fs.readdir(screenshotsDir);

      // Filter files related to this campaign
      const campaignFiles = files.filter(file => file.includes(campaignId));

      // Delete each file
      for (const file of campaignFiles) {
        const filePath = path.join(screenshotsDir, file);
        await fs.unlink(filePath);
        logger.debug(`Deleted screenshot: ${filePath}`);
      }

      logger.info(`Cleaned up ${campaignFiles.length} screenshots for campaign ${campaignId}`);
    } catch (error) {
      logger.error(`Error cleaning up screenshots: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

/**
 * Lead Processing Service
 * Handles the processing of LinkedIn profile scraping jobs through the job queue
 */
class LeadProcessingService {
  private static instance: LeadProcessingService;
  private jobQueue: JobQueueService;
  private webDriverManager: typeof WebDriverManager;
  private activeProfileScrapings: Set<string> = new Set(); // Set of campaign IDs with active scraping

  /**
   * Private constructor to ensure singleton pattern
   */
  private constructor() {
    this.jobQueue = JobQueueService.getInstance();
    this.webDriverManager = WebDriverManager;
  }

  /**
   * Get singleton instance
   * @returns LeadProcessingService instance
   */
  public static getInstance(): LeadProcessingService {
    if (!LeadProcessingService.instance) {
      LeadProcessingService.instance = new LeadProcessingService();
    }
    return LeadProcessingService.instance;
  }

  /**
   * Check if a campaign is currently being processed
   * @param campaignId Campaign ID
   * @returns True if campaign is being processed, false otherwise
   */
  public isCampaignProcessing(campaignId: string): boolean {
    return this.activeProfileScrapings.has(campaignId);
  }

  /**
   * Mark a campaign as being processed
   * @param campaignId Campaign ID
   */
  private markCampaignAsProcessing(campaignId: string): void {
    this.activeProfileScrapings.add(campaignId);
  }

  /**
   * Mark a campaign as not being processed
   * @param campaignId Campaign ID
   */
  private markCampaignAsNotProcessing(campaignId: string): void {
    this.activeProfileScrapings.delete(campaignId);
  }

  /**
   * Queue profile scraping jobs for all leads in a campaign
   * @param campaignId Campaign ID
   * @param priority Job priority (defaults to medium)
   * @returns The number of queued jobs
   */
  public async queueCampaignLeads(
    campaignId: string | mongoose.Types.ObjectId,
    priority: JobPriority = JobPriority.MEDIUM
  ): Promise<number> {
    try {
      const campaignIdStr = campaignId.toString();

      // Check if campaign is already being processed
      if (this.isCampaignProcessing(campaignIdStr)) {
        logger.warn(`Campaign ${campaignIdStr} is already being processed, skipping`);
        return 0;
      }

      // Update campaign status
      await Campaign.findByIdAndUpdate(campaignIdStr, {
        status: CampaignStatus.PROCESSING_PROFILES
      });

      // Find all leads that haven't been searched yet
      const leads = await Lead.find({
        campaignId: campaignIdStr,
        isSearched: false,
        clientId: { $exists: true, $ne: null }
      }).sort({ createdAt: -1 });

      logger.info(`Queueing ${leads.length} leads for profile scraping in campaign ${campaignIdStr}`);

      // Queue each lead as a separate job
      let queueCount = 0;
      for (const lead of leads) {
        // Construct profile URL from clientId
        const profileUrl = lead.clientId ? constructProfileUrl(lead.clientId) : lead.link;

        if (profileUrl && !lead.isSearched) {
          // Validate the profile URL
          const normalizedUrl = normalizeLinkedInUrl(profileUrl);

          if (!normalizedUrl) {
            logger.warn(`Skipping invalid LinkedIn profile URL for lead ${lead._id}: ${profileUrl}`);
            continue;
          }

          // Create a job for this lead
          const jobId = await this.jobQueue.addJob(
            JobType.PROFILE_SCRAPING,
            campaignIdStr,
            {
              leadId: lead._id.toString(),
              profileUrl: normalizedUrl
            },
            priority
          );

          // Update the lead status to QUEUED and save the constructed URL
          await Lead.findByIdAndUpdate(lead._id, {
            link: normalizedUrl, // Store the constructed URL in the link field
            processingStatus: LeadProcessingStatus.QUEUED,
            lastProcessingAttempt: new Date(),
            $inc: { processingAttempts: 1 }
          });

          queueCount++;
          logger.info(`Queued profile scraping job ${jobId} for lead ${lead._id} in campaign ${campaignIdStr}`);
        } else {
          // Mark leads without valid clientId as searched to avoid future retries
          await Lead.findByIdAndUpdate(lead._id, { isSearched: true });
          logger.warn(`Lead ${lead._id} has no valid clientId to construct LinkedIn URL, marking as processed`);
        }
      }

      // If no jobs were queued, mark the campaign as completed
      if (queueCount === 0) {
        await Campaign.findByIdAndUpdate(campaignIdStr, {
          status: CampaignStatus.SEARCH_COMPLETED,
          completedAt: new Date()
        });
        logger.info(`Campaign ${campaignIdStr} has no valid leads to scrape, marked as completed`);
      }

      return queueCount;
    } catch (error) {
      logger.error(`Error queueing leads for campaign ${campaignId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Process a single profile scraping job
   * @param jobId Job ID
   * @param campaignId Campaign ID
   * @param leadId Lead ID
   * @param profileUrl LinkedIn profile URL
   * @returns True if successful, false otherwise
   */
  public async processProfileScrapingJob(
    jobId: string,
    campaignId: string,
    leadId: string,
    profileUrl: string
  ): Promise<boolean> {
    try {
      // Check if the campaign is already being processed
      if (this.isCampaignProcessing(campaignId)) {
        logger.warn(`Another job is already processing campaign ${campaignId}, requeuing job ${jobId}`);
        // Requeue the job with a delay
        await this.jobQueue.requeueJob(jobId, 30000); // 30 second delay
        return false;
      }

      // Mark the campaign as being processed
      this.markCampaignAsProcessing(campaignId);

      try {
        await this.jobQueue.markJobAsProcessing(jobId);
        logger.info(`Processing profile scraping job ${jobId} for lead ${leadId}`);

        // First find the lead and update its status to PROCESSING
        const lead = await Lead.findByIdAndUpdate(leadId, {
          processingStatus: LeadProcessingStatus.PROCESSING,
          lastProcessingAttempt: new Date()
        }, { new: true });

        if (!lead) {
          throw new Error(`Lead with ID ${leadId} not found`);
        }

        // Get the profile scraper singleton instance
        const profileScraper = LinkedInProfileScraper.getInstance();

        // Get the campaign with populated LinkedIn account and proxy
        const campaign = await Campaign.findById(campaignId)
          .populate<{ linkedinAccountId: ILinkedInAccount }>('linkedinAccountId')
          .populate<{ proxyId: IProxy }>('proxyId');

        if (!campaign || !campaign.linkedinAccountId) {
          throw new Error(`Campaign ${campaignId} not found or has no LinkedIn account configured`);
        }

        // Get the LinkedIn account password from environment or secure storage
		  const password = campaign.linkedinAccountId.getPassword(); // Get decrypted password
        if (!password) {
          throw new Error('LinkedIn account password not configured');
        }

        // Use the shared WebDriver instance managed by the WebDriverManager
        const result = await profileScraper.scrapeProfile(
          profileUrl,
          campaignId,
          campaign.linkedinAccountId,
          password,
          campaign.proxyId
        );

        if (result.success && result.profileData) {
          // Mark the lead as processed with status COMPLETED
          await Lead.findByIdAndUpdate(leadId, {
            processingStatus: LeadProcessingStatus.COMPLETED,
            isSearched: true,
            name: result.profileData.name,
            headline: result.profileData.headline,
            location: result.profileData.location,
            summary: result.profileData.summary,
            imageUrl: result.profileData.imageUrl,
            connections: result.profileData.connections
          });

          // Update campaign stats
          await Campaign.findByIdAndUpdate(campaignId, {
            $inc: {
              'stats.profilesScraped': 1
            }
          });

          logger.info(`Successfully scraped profile for lead ${leadId}: ${result.profileData.name}`);
          await this.jobQueue.markJobAsCompleted(jobId);
          return true;
        } else {
          // Handle scraping failure
          const errorMessage = result.message || 'Unknown error during profile scraping';
          logger.error(`Failed to scrape profile for lead ${leadId}: ${errorMessage}`);

          // Update lead status
          await Lead.findByIdAndUpdate(leadId, {
            processingStatus: LeadProcessingStatus.FAILED,
            processingError: errorMessage
          });

          // Mark the job as failed
          await this.jobQueue.markJobAsFailed(jobId, errorMessage);
          return false;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Error processing profile scraping job ${jobId}: ${errorMsg}`);

        // Mark the lead as processed with status FAILED
        await Lead.findByIdAndUpdate(leadId, {
          processingStatus: LeadProcessingStatus.FAILED,
          $push: { processingErrors: errorMsg }
        });

        // Update campaign stats
        await Campaign.findByIdAndUpdate(campaignId, {
          $inc: {
            'stats.failedScrapes': 1
          }
        });

        // Mark job as failed in the queue
        await this.jobQueue.markJobAsFailed(jobId, errorMsg);
        return false;
      } finally {
        // Mark the campaign as not being processed
        this.markCampaignAsNotProcessing(campaignId);
      }
    } catch (outerError) {
      logger.error(`Outer error in processProfileScrapingJob: ${outerError instanceof Error ? outerError.message : String(outerError)}`);
      this.markCampaignAsNotProcessing(campaignId);
      return false;
    }
  }

  /**
   * Check if all leads in a campaign have been processed
   * @param campaignId Campaign ID
   * @returns True if all leads have been processed, false otherwise
   */
  public async checkCampaignCompletion(campaignId: string): Promise<boolean> {
    try {
      // Count unprocessed leads
      const unprocessedCount = await Lead.countDocuments({
        campaignId,
        isSearched: false
      });

      // Check if any profile scraping jobs are still in the queue or processing
      const activeJobs = await this.jobQueue.getJobsByCampaignId(campaignId);
      const pendingJobs = activeJobs.filter(job =>
        job.type === JobType.PROFILE_SCRAPING &&
        !job.completedAt &&
        !job.failedAt
      );

      if (unprocessedCount === 0 && pendingJobs.length === 0) {
        // Cleanup the WebDriver for this campaign
        await this.webDriverManager.quitDriver(campaignId);
        logger.info(`Cleaned up WebDriver for completed campaign ${campaignId}`);

        // Update campaign status to completed
        await Campaign.findByIdAndUpdate(campaignId, {
          status: CampaignStatus.SEARCH_COMPLETED,
          completedAt: new Date()
        });

        // Clean up screenshots
        try {
          await ScreenshotCleanupService.cleanupCampaignScreenshots(campaignId);
          logger.info(`Cleaned up screenshots for campaign ${campaignId} after completion`);
        } catch (cleanupError) {
          logger.error(`Error cleaning up screenshots for campaign ${campaignId}: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
        }

        logger.info(`Campaign ${campaignId} profile scraping completed`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error checking campaign completion: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

export default LeadProcessingService.getInstance();
