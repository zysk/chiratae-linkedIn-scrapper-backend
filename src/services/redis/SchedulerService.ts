import schedule from 'node-schedule';
import logger from '../../utils/logger';
import JobQueueService, { JobType, JobPriority, QueueName, Job } from './JobQueueService';
import RedisService from './RedisService';
import Campaign, { CampaignStatus } from '../../models/campaign.model';
import Lead from '../../models/lead.model';
import { CONFIG } from '../../utils/config';

// Define the internal API token constant if not in CONFIG
const INTERNAL_API_TOKEN = CONFIG.SCHEDULER.INTERNAL_API_TOKEN;

/**
 * Service for managing scheduled jobs using node-schedule
 */
class SchedulerService {
  private static instance: SchedulerService;
  private jobQueue: JobQueueService;
  private redis: RedisService;
  private scheduledJobs: Map<string, schedule.Job> = new Map();
  private isInitialized: boolean = false;

  /**
   * Private constructor - use getInstance()
   */
  private constructor() {
    this.jobQueue = JobQueueService.getInstance();
    this.redis = RedisService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * Initialize scheduler - set up recurring tasks
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing scheduler service...');

      // Schedule job processors
      this.scheduleJobProcessors();

      // Schedule campaign status checker
      this.scheduleCampaignStatusChecker();

      // Schedule stalled job checker
      this.scheduleStalledJobChecker();

      // Schedule checker for scheduled campaigns
      this.scheduleScheduledCampaignChecker();

      this.isInitialized = true;
      logger.info('Scheduler service initialized');
    } catch (error) {
      logger.error(`Failed to initialize scheduler service: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Schedule job processors for different queues
   */
  private scheduleJobProcessors(): void {
    // Process profile scraping queue every minute
    const profileScrapingProcessor = schedule.scheduleJob('*/1 * * * *', async () => {
      await this.processQueue(JobType.PROFILE_SCRAPING);
    });
    this.scheduledJobs.set('profile-scraping-processor', profileScrapingProcessor);

    // Process search queue every minute
    const searchProcessor = schedule.scheduleJob('*/1 * * * *', async () => {
      await this.processQueue(JobType.SEARCH);
    });
    this.scheduledJobs.set('search-processor', searchProcessor);

    logger.info('Job processors scheduled');
  }

  /**
   * Schedule campaign status checker
   */
  private scheduleCampaignStatusChecker(): void {
    // Check campaigns every 5 minutes
    const campaignChecker = schedule.scheduleJob('*/5 * * * *', async () => {
      await this.checkCampaignStatus();
    });
    this.scheduledJobs.set('campaign-checker', campaignChecker);

    logger.info('Campaign status checker scheduled');
  }

  /**
   * Schedule stalled job checker
   */
  private scheduleStalledJobChecker(): void {
    // Check for stalled jobs every 15 minutes
    const stalledJobChecker = schedule.scheduleJob('*/15 * * * *', async () => {
      await this.checkStalledJobs();
    });
    this.scheduledJobs.set('stalled-job-checker', stalledJobChecker);

    logger.info('Stalled job checker scheduled');
  }

  /**
   * Schedule checker for scheduled campaigns
   */
  private scheduleScheduledCampaignChecker(): void {
    // Check for scheduled campaigns every minute
    const scheduledCampaignChecker = schedule.scheduleJob('*/1 * * * *', async () => {
      await this.checkScheduledCampaigns();
    });
    this.scheduledJobs.set('scheduled-campaign-checker', scheduledCampaignChecker);

    logger.info('Scheduled campaign checker initialized');
  }

  /**
   * Process jobs in a queue
   */
  private async processQueue(jobType: JobType): Promise<void> {
    try {
      // Get the next job from the queue
      const job = await this.jobQueue.getNextJob(jobType);

      if (!job) {
        // No jobs to process
        return;
      }

      logger.info(`Processing ${jobType} job ${job.id} for campaign ${job.campaignId}`);

      // Mark job as processing
      await this.jobQueue.markJobAsProcessing(job.id);

      // Process job based on type
      if (jobType === JobType.PROFILE_SCRAPING) {
        // Add campaign to the profile scraping queue
        try {
          // Call the profile scraping API endpoint
          const response = await fetch(`http://localhost:${CONFIG.PORT}/api/campaigns/${job.campaignId}/linkedInProfileScrappingReq`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Token': 'internal-scheduler-token' // This would require proper security implementation
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to trigger profile scraping: ${errorText}`);
          }

          await this.jobQueue.markJobAsCompleted(job.id);
          logger.info(`Successfully triggered profile scraping for campaign ${job.campaignId}`);
        } catch (error) {
          await this.jobQueue.markJobAsFailed(job.id, error instanceof Error ? error.message : String(error));
        }
      } else if (jobType === JobType.SEARCH) {
        // Add campaign to the search queue
        try {
          // Call the search API endpoint
          const response = await fetch(`http://localhost:${CONFIG.PORT}/api/campaigns/${job.campaignId}/searchLinkedin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Token': 'internal-scheduler-token' // This would require proper security implementation
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to trigger LinkedIn search: ${errorText}`);
          }

          await this.jobQueue.markJobAsCompleted(job.id);
          logger.info(`Successfully triggered LinkedIn search for campaign ${job.campaignId}`);
        } catch (error) {
          await this.jobQueue.markJobAsFailed(job.id, error instanceof Error ? error.message : String(error));
        }
      }
    } catch (error) {
      logger.error(`Error processing ${jobType} queue: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check for campaigns that need to be queued
   */
  private async checkCampaignStatus(): Promise<void> {
    try {
      // Find campaigns in QUEUED status
      const queuedCampaigns = await Campaign.find({ status: CampaignStatus.QUEUED });

      for (const campaign of queuedCampaigns) {
        // Check if this campaign already has jobs in the queue
        const campaignJobs = await this.jobQueue.getJobsByCampaignId(campaign._id);

        // Check if there are any active jobs (not completed or failed)
        const activeJobs = campaignJobs.filter(job => !job.completedAt && !job.failedAt);

        if (activeJobs.length === 0) {
          // No active jobs, check if we need to add a search or profile scraping job

          // Check if campaign has leads that need to be searched
          const hasUnsearchedLeads = await Lead.exists({
            campaignId: campaign._id,
            isSearched: false
          });

          if (hasUnsearchedLeads) {
            // Add a profile scraping job
            logger.info(`Adding profile scraping job for campaign ${campaign._id}`);
            await this.jobQueue.addJob(
              JobType.PROFILE_SCRAPING,
              campaign._id,
              {},
              campaign.priority as unknown as JobPriority
            );
          } else {
            // Add a search job if no unsearched leads
            const hasAnyLeads = await Lead.exists({ campaignId: campaign._id });

            if (!hasAnyLeads) {
              logger.info(`Adding search job for campaign ${campaign._id}`);
              await this.jobQueue.addJob(
                JobType.SEARCH,
                campaign._id,
                {},
                campaign.priority as unknown as JobPriority
              );
            } else {
              // All leads have been searched, mark campaign as completed
              logger.info(`All leads for campaign ${campaign._id} have been searched`);
              await Campaign.findByIdAndUpdate(campaign._id, {
                status: CampaignStatus.SEARCH_COMPLETED,
                completedAt: new Date()
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Error checking campaign status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check for stalled processing jobs
   */
  private async checkStalledJobs(): Promise<void> {
    try {
      // Get jobs in processing state
      const processingJobs = await this.jobQueue.getQueueJobs(QueueName.PROCESSING);

      const now = Date.now();
      const stalledTimeout = 30 * 60 * 1000; // 30 minutes

      for (const job of processingJobs) {
        if (job.startedAt && now - job.startedAt > stalledTimeout) {
          // Job has been processing for too long, mark as failed
          logger.warn(`Job ${job.id} for campaign ${job.campaignId} has been processing for too long, marking as stalled`);
          await this.jobQueue.markJobAsFailed(job.id, 'Job processing timed out');
        }
      }
    } catch (error) {
      logger.error(`Error checking stalled jobs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check for scheduled campaigns that are due for execution
   */
  private async checkScheduledCampaigns(): Promise<void> {
    try {
      logger.debug('Checking for scheduled campaigns due for execution...');

      // Get all jobs from the search and profile queue
      const searchJobs = await this.jobQueue.getQueueJobs(QueueName.SEARCH);
      const profileJobs = await this.jobQueue.getQueueJobs(QueueName.PROFILE_SCRAPING);

      const now = new Date();
      const allJobs = [...searchJobs, ...profileJobs];

      for (const job of allJobs) {
        // Check if it has a scheduledFor date
        if (job.data && job.data.scheduledFor) {
          const scheduledFor = new Date(job.data.scheduledFor);

          // If the scheduled time has passed, process the job
          if (scheduledFor <= now) {
            logger.info(`Executing scheduled job ${job.id} for campaign ${job.campaignId} (scheduled for ${scheduledFor.toISOString()})`);

            // Mark job as processing
            await this.jobQueue.markJobAsProcessing(job.id);

            // Process job based on type
            if (job.type === JobType.PROFILE_SCRAPING) {
              try {
                // Call the profile scraping API endpoint
                const response = await fetch(`http://localhost:${CONFIG.PORT}/api/campaigns/${job.campaignId}/linkedInProfileScrappingReq`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Token': INTERNAL_API_TOKEN
                  }
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Failed to trigger profile scraping: ${errorText}`);
                }

                await this.jobQueue.markJobAsCompleted(job.id);
                logger.info(`Successfully triggered profile scraping for scheduled campaign ${job.campaignId}`);

                // Check for recurrence
                if (job.data.recurrence && job.data.recurrence !== 'once') {
                  await this.scheduleRecurringJob(job);
                }
              } catch (error) {
                await this.jobQueue.markJobAsFailed(job.id, error instanceof Error ? error.message : String(error));
              }
            } else if (job.type === JobType.SEARCH) {
              try {
                // Call the search API endpoint
                const response = await fetch(`http://localhost:${CONFIG.PORT}/api/campaigns/${job.campaignId}/searchLinkedin`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-Token': INTERNAL_API_TOKEN
                  }
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Failed to trigger LinkedIn search: ${errorText}`);
                }

                await this.jobQueue.markJobAsCompleted(job.id);
                logger.info(`Successfully triggered LinkedIn search for scheduled campaign ${job.campaignId}`);

                // Check for recurrence
                if (job.data.recurrence && job.data.recurrence !== 'once') {
                  await this.scheduleRecurringJob(job);
                }
              } catch (error) {
                await this.jobQueue.markJobAsFailed(job.id, error instanceof Error ? error.message : String(error));
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Error checking scheduled campaigns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Schedule a recurring job based on recurrence pattern
   */
  private async scheduleRecurringJob(job: Job): Promise<void> {
    try {
      if (!job.data || !job.data.recurrence || job.data.recurrence === 'once') {
        return;
      }

      const lastScheduled = new Date(job.data.scheduledFor);
      let nextSchedule: Date | null = null;

      // Calculate next schedule date based on recurrence
      switch (job.data.recurrence) {
        case 'daily':
          nextSchedule = new Date(lastScheduled);
          nextSchedule.setDate(nextSchedule.getDate() + 1);
          break;

        case 'weekly':
          nextSchedule = new Date(lastScheduled);
          nextSchedule.setDate(nextSchedule.getDate() + 7);
          break;

        case 'monthly':
          nextSchedule = new Date(lastScheduled);
          nextSchedule.setMonth(nextSchedule.getMonth() + 1);
          break;
      }

      // Check if we've reached the end date (if specified)
      if (job.data.endDate && nextSchedule) {
        const endDate = new Date(job.data.endDate);
        if (nextSchedule > endDate) {
          logger.info(`Recurring job for campaign ${job.campaignId} has reached its end date`);
          return;
        }
      }

      // Schedule the next occurrence
      if (nextSchedule) {
        // Clone the job data and update the scheduled date
        const newJobData = { ...job.data, scheduledFor: nextSchedule.toISOString() };

        // Add a new job to the queue
        const newJobId = await this.jobQueue.addJob(
          job.type,
          job.campaignId,
          newJobData,
          job.priority
        );

        logger.info(`Scheduled recurring job ${newJobId} for campaign ${job.campaignId} at ${nextSchedule.toISOString()}`);
      }
    } catch (error) {
      logger.error(`Error scheduling recurring job: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add campaign to job queue
   */
  public async queueCampaign(campaignId: string, jobType: JobType, priority: JobPriority = JobPriority.MEDIUM): Promise<string> {
    try {
      return await this.jobQueue.addJob(jobType, campaignId, {}, priority);
    } catch (error) {
      logger.error(`Error queuing campaign ${campaignId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Cancel all jobs for a campaign
   */
  public async cancelCampaignJobs(campaignId: string): Promise<number> {
    try {
      return await this.jobQueue.removeJobsByCampaignId(campaignId);
    } catch (error) {
      logger.error(`Error canceling jobs for campaign ${campaignId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Shutdown the scheduler
   */
  public async shutdown(): Promise<void> {
    try {
      // Cancel all scheduled jobs
      for (const [name, job] of this.scheduledJobs.entries()) {
        job.cancel();
        logger.info(`Canceled scheduled job: ${name}`);
      }

      this.scheduledJobs.clear();
      this.isInitialized = false;

      logger.info('Scheduler service shut down');
    } catch (error) {
      logger.error(`Error shutting down scheduler service: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

export default SchedulerService;
