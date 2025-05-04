import mongoose from 'mongoose';
import { Worker } from 'worker_threads';
import path from 'path';
import Campaign, { ICampaignDocument } from '../models/Campaign.model';
import { campaignStatusObj } from '../helpers/Constants';
import LinkedInAccountService from './linkedInAccount.service';
import ProxyService from './proxy.service';
import { Logger } from './logger.service';
import { ICampaignStats } from '../interfaces/Campaign.interface';

/**
 * Campaign Execution Service
 *
 * Handles the execution of campaign searches, including scheduling,
 * monitoring, error handling, and resource management.
 */
export class CampaignExecutionService {
  private static instance: CampaignExecutionService;
  private logger: Logger;
  private activeWorkers: Map<string, Worker> = new Map();
  private linkedInAccountService: typeof LinkedInAccountService;
  private proxyService: typeof ProxyService;
  private scheduledTimer: NodeJS.Timeout | null = null;
  private isSchedulerRunning: boolean = false;

  private constructor() {
    this.logger = new Logger('CampaignExecution');
    this.linkedInAccountService = LinkedInAccountService;
    this.proxyService = ProxyService;

    // Initialize scheduled campaign processor
    this.initScheduler();

    // Handle process exit to clean up workers
    process.on('SIGINT', () => this.cleanupOnExit());
    process.on('SIGTERM', () => this.cleanupOnExit());
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CampaignExecutionService {
    if (!CampaignExecutionService.instance) {
      CampaignExecutionService.instance = new CampaignExecutionService();
    }
    return CampaignExecutionService.instance;
  }

  /**
   * Initialize the campaign scheduler
   */
  private initScheduler(): void {
    // Check for scheduled campaigns every minute
    this.scheduledTimer = setInterval(() => {
      this.processScheduledCampaigns().catch(err => {
        this.logger.error(`Error processing scheduled campaigns: ${err.message}`);
      });
    }, 60 * 1000); // 1 minute interval

    this.logger.info('Campaign scheduler initialized');
  }

  /**
   * Process campaigns that are scheduled to run
   */
  private async processScheduledCampaigns(): Promise<void> {
    // Prevent concurrent scheduler execution
    if (this.isSchedulerRunning) {
      return;
    }

    this.isSchedulerRunning = true;

    try {
      // Find campaigns due to run
      const dueCampaigns = await Campaign.findDueCampaigns();

      if (dueCampaigns.length > 0) {
        this.logger.info(`Found ${dueCampaigns.length} scheduled campaigns to run`);

        // Start each due campaign
        for (const campaign of dueCampaigns) {
          // Check if we already have a worker running for this campaign
          if (this.activeWorkers.has(campaign._id.toString())) {
            this.logger.warn(`Campaign ${campaign._id} already has a worker running, skipping`);
            continue;
          }

          // Start campaign execution
          await this.startCampaign(campaign);

          // Update next run time based on schedule
          // For now, we'll set it to run again in 24 hours
          campaign.nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await campaign.save();
        }
      }
    } catch (error: any) {
      this.logger.error(`Error in campaign scheduler: ${error.message}`);
    } finally {
      this.isSchedulerRunning = false;
    }
  }

  /**
   * Start execution of a campaign
   */
  public async startCampaign(campaign: ICampaignDocument): Promise<boolean> {
    const campaignId = campaign._id.toString();

    try {
      // Check if campaign is already running
      if (campaign.processing || this.activeWorkers.has(campaignId)) {
        this.logger.warn(`Campaign ${campaignId} is already processing`);
        return false;
      }

      // Update campaign status
      campaign.status = campaignStatusObj.PROCESSING;
      campaign.processing = true;
      campaign.runCount = (campaign.runCount || 0) + 1;
      campaign.lastRun = new Date();

      // Initialize statistics if needed
      await campaign.updateStats({
        totalResults: 0,
        processedResults: 0,
        successfulScrapes: 0,
        failedScrapes: 0,
        newLeadsGenerated: 0,
        duplicateLeadsSkipped: 0,
        lastPageProcessed: 0,
        pagesRemaining: 0,
        errors: [],
        lastUpdateTime: new Date(),
      });

      // Add execution log entry
      await campaign.addLogEntry('CAMPAIGN_STARTED', 'Campaign execution started');
      await campaign.save();

      // Get a LinkedIn account and proxy for this campaign
      let linkedInAccount = null;
      let proxy = null;

      if (campaign.linkedInAccountId) {
        linkedInAccount = await this.linkedInAccountService.getAccount();
        if (!linkedInAccount) {
          throw new Error('LinkedIn account not found');
        }
      } else {
        // Auto-assign a LinkedIn account if none specified
        linkedInAccount = await this.linkedInAccountService.getAccount();
        if (!linkedInAccount) {
          throw new Error('No available LinkedIn accounts');
        }
        campaign.linkedInAccountId = linkedInAccount._id;
        await campaign.save();
      }

      if (campaign.proxyId) {
        proxy = await this.proxyService.getProxy('linkedin');
        if (!proxy) {
          throw new Error('Proxy not found');
        }
      } else if (linkedInAccount.proxyId) {
        // Use the proxy assigned to the LinkedIn account
        proxy = await this.proxyService.getProxy('linkedin');
      } else {
        // Auto-assign a proxy if none specified
        proxy = await this.proxyService.getProxy('linkedin');
        if (!proxy) {
          throw new Error('No available proxies');
        }
        campaign.proxyId = proxy._id;
        await campaign.save();
      }

      // Create a worker to handle the campaign execution
      // The worker will handle browser automation, scraping, and result processing
      this.startWorker(campaign, linkedInAccount, proxy);

      this.logger.info(`Campaign ${campaignId} started successfully`);
      return true;
    } catch (error: any) {
      // Update campaign status to indicate failure
      campaign.status = campaignStatusObj.FAILED;
      campaign.processing = false;
      await campaign.addLogEntry('CAMPAIGN_START_FAILED', `Failed to start campaign: ${error.message}`, error.message);
      await campaign.save();

      this.logger.error(`Failed to start campaign ${campaignId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Stop an active campaign
   */
  public async stopCampaign(campaignId: string): Promise<boolean> {
    try {
      // Get the campaign
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        this.logger.warn(`Campaign ${campaignId} not found`);
        return false;
      }

      // Check if the campaign is actually running
      if (!campaign.processing) {
        this.logger.warn(`Campaign ${campaignId} is not currently processing`);
        return false;
      }

      // Terminate the worker if it exists
      const worker = this.activeWorkers.get(campaignId);
      if (worker) {
        // Send termination message to worker
        worker.postMessage({ action: 'stop' });

        // Give the worker a chance to clean up
        setTimeout(() => {
          if (this.activeWorkers.has(campaignId)) {
            worker.terminate().catch(err => {
              this.logger.error(`Error terminating worker for campaign ${campaignId}: ${err.message}`);
            });
            this.activeWorkers.delete(campaignId);
          }
        }, 5000); // 5 seconds grace period
      }

      // Update campaign status
      campaign.status = campaignStatusObj.CANCELLED;
      campaign.processing = false;
      await campaign.addLogEntry('CAMPAIGN_STOPPED', 'Campaign stopped manually');
      await campaign.save();

      this.logger.info(`Campaign ${campaignId} stopped successfully`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to stop campaign ${campaignId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Start a worker to handle campaign execution
   */
  private startWorker(campaign: ICampaignDocument, linkedInAccount: any, proxy: any): void {
    const campaignId = campaign._id.toString();

    try {
      // Create a new worker for this campaign
      const worker = new Worker(path.resolve(__dirname, '../workers/campaignWorker.js'), {
        workerData: {
          campaignId: campaignId,
          linkedInAccountId: linkedInAccount._id.toString(),
          proxyId: proxy ? proxy._id.toString() : null,
          searchQuery: campaign.searchQuery,
          filters: campaign.filters || {},
          maxProfilesPerRun: campaign.maxProfilesPerRun || 100,
          maxRunTimeMinutes: campaign.maxRunTimeMinutes || 60,
          requestsPerMinute: campaign.requestsPerMinute || 10,
          delayBetweenProfiles: campaign.delayBetweenProfiles || 3000,
        }
      });

      // Store the worker reference
      this.activeWorkers.set(campaignId, worker);

      // Handle worker messages
      worker.on('message', async (message: any) => {
        try {
          const { type, data } = message;
          let campaign;
          let statsUpdate: Partial<ICampaignStats>;
          let completedCampaign;
          let failedCampaign;

          switch (type) {
            case 'log':
              // Add log entry to campaign
              campaign = await Campaign.findById(campaignId);
              if (campaign) {
                await campaign.addLogEntry(data.event, data.details, data.error);
              }
              break;

            case 'stats':
              // Update campaign statistics
              statsUpdate = data;
              campaign = await Campaign.findById(campaignId);
              if (campaign) {
                await campaign.updateStats(statsUpdate);
              }
              break;

            case 'complete':
              // Campaign completed successfully
              completedCampaign = await Campaign.findById(campaignId);
              if (completedCampaign) {
                completedCampaign.status = campaignStatusObj.COMPLETED;
                completedCampaign.processing = false;
                completedCampaign.isSearched = true;
                await completedCampaign.addLogEntry('CAMPAIGN_COMPLETED', 'Campaign execution completed successfully');
                await completedCampaign.save();
              }

              // Remove the worker from active workers
              this.activeWorkers.delete(campaignId);
              break;

            case 'error':
              // Campaign failed
              failedCampaign = await Campaign.findById(campaignId);
              if (failedCampaign) {
                failedCampaign.status = campaignStatusObj.FAILED;
                failedCampaign.processing = false;
                await failedCampaign.addLogEntry('CAMPAIGN_FAILED', data.message, data.error);
                await failedCampaign.save();
              }

              // Remove the worker from active workers
              this.activeWorkers.delete(campaignId);
              break;
          }
        } catch (error: any) {
          this.logger.error(`Error handling worker message for campaign ${campaignId}: ${error.message}`);
        }
      });

      // Handle worker errors
      worker.on('error', async (error) => {
        this.logger.error(`Worker error for campaign ${campaignId}: ${error.message}`);

        try {
          const campaign = await Campaign.findById(campaignId);
          if (campaign) {
            campaign.status = campaignStatusObj.FAILED;
            campaign.processing = false;
            await campaign.addLogEntry('WORKER_ERROR', `Worker error: ${error.message}`, error.message);
            await campaign.save();
          }
        } catch (err: any) {
          this.logger.error(`Failed to update campaign ${campaignId} after worker error: ${err.message}`);
        }

        // Remove the worker from active workers
        this.activeWorkers.delete(campaignId);
      });

      // Handle worker exit
      worker.on('exit', async (code) => {
        this.logger.info(`Worker for campaign ${campaignId} exited with code ${code}`);

        try {
          // If worker exited abnormally and the campaign is still marked as processing,
          // update the campaign status
          const campaign = await Campaign.findById(campaignId);
          if (campaign && campaign.processing && code !== 0) {
            campaign.status = campaignStatusObj.FAILED;
            campaign.processing = false;
            await campaign.addLogEntry('WORKER_EXIT', `Worker exited unexpectedly with code ${code}`);
            await campaign.save();
          }
        } catch (error: any) {
          this.logger.error(`Failed to update campaign ${campaignId} after worker exit: ${error.message}`);
        }

        // Remove the worker from active workers
        this.activeWorkers.delete(campaignId);
      });

      this.logger.info(`Worker started for campaign ${campaignId}`);
    } catch (error: any) {
      this.logger.error(`Failed to start worker for campaign ${campaignId}: ${error.message}`);

      // Update campaign status to indicate failure
      Campaign.findById(campaignId).then(async campaign => {
        if (campaign) {
          campaign.status = campaignStatusObj.FAILED;
          campaign.processing = false;
          await campaign.addLogEntry('WORKER_START_FAILED', `Failed to start worker: ${error.message}`, error.message);
          await campaign.save();
        }
      }).catch(err => {
        this.logger.error(`Failed to update campaign ${campaignId} after worker start failure: ${err.message}`);
      });

      // Remove the worker from active workers if it was added
      this.activeWorkers.delete(campaignId);
    }
  }

  /**
   * Clean up workers on application exit
   */
  private cleanupOnExit(): void {
    this.logger.info('Cleaning up campaign workers before exit');

    // Clear the scheduler timer
    if (this.scheduledTimer) {
      clearInterval(this.scheduledTimer);
    }

    // Terminate all active workers
    this.activeWorkers.forEach((worker, campaignId) => {
      try {
        worker.terminate();
        this.logger.info(`Terminated worker for campaign ${campaignId}`);
      } catch (error: any) {
        this.logger.error(`Error terminating worker for campaign ${campaignId}: ${error.message}`);
      }
    });

    // Clear the workers map
    this.activeWorkers.clear();
  }

  /**
   * Get active campaign count
   */
  public getActiveCampaignCount(): number {
    return this.activeWorkers.size;
  }

  /**
   * Check if a campaign is currently processing
   */
  public isCampaignProcessing(campaignId: string): boolean {
    return this.activeWorkers.has(campaignId);
  }

  /**
   * Get list of active campaign IDs
   */
  public getActiveCampaignIds(): string[] {
    return Array.from(this.activeWorkers.keys());
  }
}

// Export a singleton instance
export const campaignExecutionService = CampaignExecutionService.getInstance();