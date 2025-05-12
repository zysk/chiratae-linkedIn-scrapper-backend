import { ObjectId } from 'mongodb';
import logger from '../../utils/logger';
import RedisService from './RedisService';

/**
 * Types of jobs in the queue
 */
export enum JobType {
  PROFILE_SCRAPING = 'profile_scraping',
  SEARCH = 'search'
}

/**
 * Job priority levels
 */
export enum JobPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Job queue names
 */
export enum QueueName {
  PROFILE_SCRAPING = 'linkedin:profile:queue',
  SEARCH = 'linkedin:search:queue',
  PROCESSING = 'linkedin:processing',
  COMPLETED = 'linkedin:completed',
  FAILED = 'linkedin:failed'
}

/**
 * Structure of a job in the queue
 */
export interface Job {
  id: string;                 // Unique job ID
  type: JobType;              // Job type
  campaignId: string;         // MongoDB ID of the campaign
  priority: JobPriority;      // Job priority
  data: Record<string, any>;  // Additional job data
  createdAt: number;          // Timestamp when job was created
  startedAt?: number;         // Timestamp when job started processing
  completedAt?: number;       // Timestamp when job was completed
  failedAt?: number;          // Timestamp when job failed
  error?: string;             // Error message if job failed
  retryCount: number;         // Number of retries
  maxRetries: number;         // Maximum number of retries
}

// Additional optional properties for scheduled jobs
export interface ScheduledJobData {
  scheduledFor: string;       // ISO timestamp for scheduled execution
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly'; // Recurrence pattern
  endDate?: string;           // ISO timestamp for end of recurrence
}

/**
 * Service for managing job queues using Redis
 */
class JobQueueService {
  private static instance: JobQueueService;
  private redis: RedisService;

  /**
   * Private constructor - use getInstance()
   */
  private constructor() {
    this.redis = RedisService.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): JobQueueService {
    if (!JobQueueService.instance) {
      JobQueueService.instance = new JobQueueService();
    }
    return JobQueueService.instance;
  }

  /**
   * Add a job to the queue
   */
  public async addJob(
    type: JobType,
    campaignId: string | ObjectId,
    data: Record<string, any> = {},
    priority: JobPriority = JobPriority.MEDIUM,
    maxRetries: number = 3
  ): Promise<string> {
    const campaignIdString = campaignId.toString();

    // Create a job ID
    const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Create job object
    const job: Job = {
      id: jobId,
      type,
      campaignId: campaignIdString,
      priority,
      data,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries
    };

    try {
      // Determine the queue based on job type
      const queueName = type === JobType.PROFILE_SCRAPING
        ? QueueName.PROFILE_SCRAPING
        : QueueName.SEARCH;

      // Add job to the queue
      // Using a sorted set with priority and creation time as score
      const priorityScore = this.getPriorityScore(priority);
      const score = priorityScore * 1000000 + job.createdAt;

      // Store job data in Redis
      await this.redis.set(`job:${jobId}`, JSON.stringify(job));

      // Add job to the queue sorted set
      const client = await this.redis.getClient();
      await client.zAdd(queueName, { score, value: jobId });

      logger.info(`Added job ${jobId} to queue ${queueName} with priority ${priority}`);

      return jobId;
    } catch (error) {
      logger.error(`Failed to add job to queue: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Mark a job as in progress
   */
  public async markJobAsProcessing(jobId: string): Promise<void> {
    try {
      // Get job data
      const jobData = await this.getJob(jobId);
      if (!jobData) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Update job status
      jobData.startedAt = Date.now();

      // Store updated job data
      await this.redis.set(`job:${jobId}`, JSON.stringify(jobData));

      // Move job from queue to processing set
      const client = await this.redis.getClient();
      const queueName = jobData.type === JobType.PROFILE_SCRAPING
        ? QueueName.PROFILE_SCRAPING
        : QueueName.SEARCH;

      await client.zRem(queueName, jobId);
      await client.zAdd(QueueName.PROCESSING, { score: Date.now(), value: jobId });

      logger.info(`Marked job ${jobId} as processing`);
    } catch (error) {
      logger.error(`Failed to mark job as processing: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Mark a job as completed
   */
  public async markJobAsCompleted(jobId: string): Promise<void> {
    try {
      // Get job data
      const jobData = await this.getJob(jobId);
      if (!jobData) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Update job status
      jobData.completedAt = Date.now();

      // Store updated job data
      await this.redis.set(`job:${jobId}`, JSON.stringify(jobData), 86400); // Keep for 24 hours

      // Move job from processing to completed set
      const client = await this.redis.getClient();
      await client.zRem(QueueName.PROCESSING, jobId);
      await client.zAdd(QueueName.COMPLETED, { score: Date.now(), value: jobId });

      logger.info(`Marked job ${jobId} as completed`);
    } catch (error) {
      logger.error(`Failed to mark job as completed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Mark a job as failed
   */
  public async markJobAsFailed(jobId: string, error: string): Promise<void> {
    try {
      // Get job data
      const jobData = await this.getJob(jobId);
      if (!jobData) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Update job status
      jobData.failedAt = Date.now();
      jobData.error = error;
      jobData.retryCount++;

      // Store updated job data
      await this.redis.set(`job:${jobId}`, JSON.stringify(jobData), 86400); // Keep for 24 hours

      const client = await this.redis.getClient();

      // If max retries not reached, add back to queue with retry delay
      if (jobData.retryCount < jobData.maxRetries) {
        const queueName = jobData.type === JobType.PROFILE_SCRAPING
          ? QueueName.PROFILE_SCRAPING
          : QueueName.SEARCH;

        // Calculate priority score with delay based on retry count
        const priorityScore = this.getPriorityScore(jobData.priority);
        const retryDelay = Math.pow(2, jobData.retryCount) * 60000; // Exponential backoff
        const score = priorityScore * 1000000 + Date.now() + retryDelay;

        // Remove from processing and add back to queue
        await client.zRem(QueueName.PROCESSING, jobId);
        await client.zAdd(queueName, { score, value: jobId });

        logger.info(`Job ${jobId} failed, scheduled for retry ${jobData.retryCount}/${jobData.maxRetries}`);
      } else {
        // Move job from processing to failed set
        await client.zRem(QueueName.PROCESSING, jobId);
        await client.zAdd(QueueName.FAILED, { score: Date.now(), value: jobId });

        logger.warn(`Job ${jobId} failed permanently after ${jobData.retryCount} retries: ${error}`);
      }
    } catch (error) {
      logger.error(`Failed to mark job as failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get the next job from the queue
   */
  public async getNextJob(type: JobType): Promise<Job | null> {
    try {
      const queueName = type === JobType.PROFILE_SCRAPING
        ? QueueName.PROFILE_SCRAPING
        : QueueName.SEARCH;

      const client = await this.redis.getClient();

      // Get the job with the highest priority (lowest score) that's due for processing
      const jobs = await client.zRangeWithScores(queueName, 0, 0);

      if (jobs.length === 0) {
        return null;
      }

      const jobId = jobs[0].value;
      const job = await this.getJob(jobId);

      return job;
    } catch (error) {
      logger.error(`Failed to get next job: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get a job by ID
   */
  public async getJob(jobId: string): Promise<Job | null> {
    try {
      const jobDataString = await this.redis.get(`job:${jobId}`);
      if (!jobDataString) {
        return null;
      }

      return JSON.parse(jobDataString) as Job;
    } catch (error) {
      logger.error(`Failed to get job ${jobId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get all jobs in a queue
   */
  public async getQueueJobs(queueName: QueueName, limit = 100, offset = 0): Promise<Job[]> {
    try {
      const client = await this.redis.getClient();

      // Get job IDs from the queue
      const jobIds = await client.zRange(queueName, offset, offset + limit - 1);

      // Get job data for each ID
      const jobs: Job[] = [];

      for (const jobId of jobIds) {
        const job = await this.getJob(jobId);
        if (job) {
          jobs.push(job);
        }
      }

      return jobs;
    } catch (error) {
      logger.error(`Failed to get queue jobs: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get jobs by campaign ID
   */
  public async getJobsByCampaignId(campaignId: string | ObjectId): Promise<Job[]> {
    try {
      const campaignIdString = campaignId.toString();
      const client = await this.redis.getClient();

      // Get all queues
      const allQueues = [
        QueueName.PROFILE_SCRAPING,
        QueueName.SEARCH,
        QueueName.PROCESSING,
        QueueName.COMPLETED,
        QueueName.FAILED
      ];

      const jobs: Job[] = [];

      // Search each queue for jobs with matching campaign ID
      for (const queue of allQueues) {
        const jobIds = await client.zRange(queue, 0, -1);

        for (const jobId of jobIds) {
          const job = await this.getJob(jobId);

          if (job && job.campaignId === campaignIdString) {
            jobs.push(job);
          }
        }
      }

      return jobs;
    } catch (error) {
      logger.error(`Failed to get jobs by campaign ID: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Remove all jobs for a campaign
   */
  public async removeJobsByCampaignId(campaignId: string | ObjectId): Promise<number> {
    try {
      const jobs = await this.getJobsByCampaignId(campaignId);
      let removed = 0;

      const client = await this.redis.getClient();

      for (const job of jobs) {
        // Remove from all possible queues
        await client.zRem(QueueName.PROFILE_SCRAPING, job.id);
        await client.zRem(QueueName.SEARCH, job.id);
        await client.zRem(QueueName.PROCESSING, job.id);
        await client.zRem(QueueName.COMPLETED, job.id);
        await client.zRem(QueueName.FAILED, job.id);

        // Remove job data
        await this.redis.del(`job:${job.id}`);

        removed++;
      }

      logger.info(`Removed ${removed} jobs for campaign ${campaignId}`);
      return removed;
    } catch (error) {
      logger.error(`Failed to remove jobs by campaign ID: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get the number of jobs in a queue
   */
  public async getQueueSize(queueName: QueueName): Promise<number> {
    try {
      const client = await this.redis.getClient();
      return await client.zCard(queueName);
    } catch (error) {
      logger.error(`Failed to get queue size: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get the priority score from priority enum
   */
  private getPriorityScore(priority: JobPriority): number {
    switch (priority) {
      case JobPriority.HIGH: return 1;
      case JobPriority.MEDIUM: return 2;
      default: return 3; // JobPriority.LOW
    }
  }

  /**
   * Requeue a job with a delay
   * @param jobId The job ID to requeue
   * @param delayMs Delay in milliseconds before the job is eligible to be processed
   * @returns Promise<boolean> True if job was requeued successfully
   */
  public async requeueJob(jobId: string, delayMs: number = 0): Promise<boolean> {
    try {
      // Get job data
      const jobData = await this.getJob(jobId);
      if (!jobData) {
        throw new Error(`Job ${jobId} not found`);
      }

      const client = await this.redis.getClient();

      // Determine the queue based on job type
      const queueName = jobData.type === JobType.PROFILE_SCRAPING
        ? QueueName.PROFILE_SCRAPING
        : QueueName.SEARCH;

      // Calculate score with delay
      const priorityScore = this.getPriorityScore(jobData.priority);
      const score = priorityScore * 1000000 + Date.now() + delayMs;

      // Remove from any existing queues (if present)
      await client.zRem(QueueName.PROCESSING, jobId);
      await client.zRem(QueueName.PROFILE_SCRAPING, jobId);
      await client.zRem(QueueName.SEARCH, jobId);

      // Add to the appropriate queue with the new score
      await client.zAdd(queueName, { score, value: jobId });

      logger.info(`Requeued job ${jobId} with delay of ${delayMs}ms`);
      return true;
    } catch (error) {
      logger.error(`Failed to requeue job ${jobId}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

export default JobQueueService;
