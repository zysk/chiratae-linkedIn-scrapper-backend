import logger from '../utils/logger';
import JobQueueService, { JobType, QueueName } from '../services/redis/JobQueueService';
import LeadProcessingService from '../services/linkedin/LeadProcessingService';
import { Job } from '../services/redis/JobQueueService';

/**
 * Profile Scraping Worker
 * This worker continuously processes LinkedIn profile scraping jobs from the queue
 */
class ProfileScrapingWorker {
  private jobQueue: JobQueueService;
  private leadProcessingService: LeadProcessingService;
  private isRunning: boolean = false;
  private pollingInterval: number = 5000; // 5 seconds
  private processInterval: NodeJS.Timeout | null = null;
  private maxConcurrentJobs: number = 1; // Process one job at a time to avoid rate limiting
  private activeJobs: number = 0;

  constructor() {
    this.jobQueue = JobQueueService.getInstance();
    this.leadProcessingService = LeadProcessingService.getInstance();
  }

  /**
   * Start the worker
   */
  public start(): void {
    if (this.isRunning) {
      logger.info('Profile scraping worker is already running');
      return;
    }

    logger.info('Starting profile scraping worker');
    this.isRunning = true;
    this.poll();
  }

  /**
   * Stop the worker
   */
  public stop(): void {
    if (!this.isRunning) {
      logger.info('Profile scraping worker is not running');
      return;
    }

    logger.info('Stopping profile scraping worker');
    this.isRunning = false;

    if (this.processInterval) {
      clearTimeout(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Poll for jobs to process
   */
  private poll(): void {
    this.processInterval = setTimeout(async () => {
      if (!this.isRunning) {
        return;
      }

      try {
        // Only fetch new jobs if we haven't reached the concurrency limit
        if (this.activeJobs < this.maxConcurrentJobs) {
          const job = await this.jobQueue.getNextJob(JobType.PROFILE_SCRAPING);

          if (job) {
            // Process the job in the background
            this.activeJobs++;
            this.processJob(job)
              .finally(() => {
                this.activeJobs--;
              });
          }
        }
      } catch (error) {
        logger.error(`Error polling for profile scraping jobs: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        // Continue polling
        if (this.isRunning) {
          this.poll();
        }
      }
    }, this.pollingInterval);
  }

  /**
   * Process a profile scraping job
   * @param job The job to process
   */
  private async processJob(job: Job): Promise<void> {
    const { id: jobId, campaignId, data } = job;
    const { leadId, profileUrl } = data;

    try {
      logger.info(`Processing profile scraping job ${jobId} for lead ${leadId}`);

      // Process the job using the lead processing service
      await this.leadProcessingService.processProfileScrapingJob(
        jobId,
        campaignId,
        leadId,
        profileUrl
      );

      // Check if this was the last job for the campaign
      await this.leadProcessingService.checkCampaignCompletion(campaignId);
    } catch (error) {
      logger.error(`Error processing profile scraping job ${jobId}: ${error instanceof Error ? error.message : String(error)}`);

      // Mark the job as failed in the queue
      await this.jobQueue.markJobAsFailed(
        jobId,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}

// Create and export the worker instance
const profileScrapingWorker = new ProfileScrapingWorker();
export default profileScrapingWorker;

// Start the worker when this module is run directly
if (require.main === module) {
  logger.info('Starting profile scraping worker as standalone process');
  profileScrapingWorker.start();
}
