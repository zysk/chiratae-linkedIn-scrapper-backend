import { Request, Response, NextFunction } from 'express';
import Campaign, { CampaignStatus, ICampaign, CampaignPriority, CampaignRecurrence } from '../models/campaign.model';
import LinkedInAccount from '../models/linkedinAccount.model';
import Proxy, { IProxy } from '../models/proxy.model';
import Lead from '../models/lead.model';
import mongoose from 'mongoose';
import { ApiError } from '../utils/error.utils';
import { IAuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';
import {
  createCampaignSchema,
  updateCampaignSchema,
  queueCampaignSchema,
  campaignFilterSchema,
  scheduleCampaignSchema
} from '../utils/validation/campaign.validation';
import { By } from 'selenium-webdriver';
import SeleniumService from '../services/selenium/SeleniumService';
import LinkedInAuthService, { LoginResult } from '../services/linkedin/LinkedInAuthService';
import JobQueueService, { JobType, JobPriority, QueueName } from '../services/redis/JobQueueService';
import LinkedInSearchService from '../services/linkedin/LinkedInSearchService';
import { LinkedInProfileScraper } from '../services/linkedin/LinkedInProfileScraper';
import ScreenshotCleanupService from '../services/utils/ScreenshotCleanupService';
import LeadProcessingService from '../services/linkedin/LeadProcessingService';
import { rolesObj } from '../utils/constants';
import { profileScrapeSchema } from '../utils/validation/linkedin.validation';
import { ILinkedInAccount } from '../models/linkedinAccount.model';

// Simple proxy config interface for the login function
interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

/**
 * Create a new campaign
 * @route POST /api/campaigns
 * @access Private
 */
export const createCampaign = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = createCampaignSchema.validate(req.body);
    if (error) {
      throw new ApiError(error.message, 400);
    }

    // Check if LinkedIn account exists and is active
    const linkedinAccount = await LinkedInAccount.findById(value.linkedinAccountId);
    if (!linkedinAccount) {
      throw new ApiError('LinkedIn account not found', 404);
    }
    if (!linkedinAccount.isActive) {
      throw new ApiError('LinkedIn account is not active', 400);
    }

    // Check if proxy exists and is active (only if proxyId is provided)
    if (value.proxyId) {
      const proxy = await Proxy.findById(value.proxyId);
      if (!proxy) {
        throw new ApiError('Proxy not found', 404);
      }
      if (!proxy.isActive) {
        throw new ApiError('Proxy is not active', 400);
      }
    }

    // Create campaign with user ID as creator
    const campaign = new Campaign({
      ...value,
      createdBy: req.user?.userId
    });

    await campaign.save();

    // Populate creator details
    await campaign.populate({
      path: 'createdBy',
      select: '_id name email'
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all campaigns with filtering
 * @route GET /api/campaigns
 * @access Private
 */
export const getCampaigns = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate query parameters
    const { error, value } = campaignFilterSchema.validate(req.query);
    if (error) {
      throw new ApiError(error.message, 400);
    }

    const { status, page = 1, limit = 10 } = value;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      createdBy: req.user?.userId
    };

    if (status) {
      query.status = status;
    }

    // Execute query with pagination
    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate({
          path: 'createdBy',
          select: '_id name email'
        })
        .populate({
          path: 'linkedinAccountId',
          select: '_id username email'
        })
        .populate({
          path: 'proxyId',
          select: '_id name host port'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Campaign.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: 'Campaigns retrieved successfully',
      data: campaigns,
      pagination: {
        total,
        page,
        pages: totalPages,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single campaign by ID
 * @route GET /api/campaigns/:id
 * @access Private
 */
export const getCampaignById = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid campaign ID format', 400);
    }

    // Find campaign and check ownership
    const campaign = await Campaign.findById(id)
      .populate({
        path: 'createdBy',
        select: '_id name email'
      })
      .populate({
        path: 'linkedinAccountId',
        select: '_id username email'
      })
      .populate({
        path: 'proxyId',
        select: '_id name host port'
      });

    if (!campaign) {
      throw new ApiError('Campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== 'ADMIN' && campaign.createdBy._id.toString() !== req.user?.userId) {
      throw new ApiError('Not authorized to access this campaign', 403);
    }

    res.status(200).json({
      success: true,
      message: 'Campaign retrieved successfully',
      data: campaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a campaign
 * @route PUT /api/campaigns/:id
 * @access Private
 */
export const updateCampaign = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid campaign ID format', 400);
    }

    // Validate request body
    const { error, value } = updateCampaignSchema.validate(req.body);
    if (error) {
      throw new ApiError(error.message, 400);
    }

    // Find campaign and check ownership
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new ApiError('Campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== 'ADMIN' && campaign.createdBy.toString() !== req.user?.userId) {
      throw new ApiError('Not authorized to update this campaign', 403);
    }

    // Don't allow updates for non-created campaigns
    if (campaign.status !== CampaignStatus.CREATED) {
      throw new ApiError('Cannot update campaign that is already queued, running, or completed', 400);
    }

    // If linkedinAccountId is provided, check if account exists
    if (value.linkedinAccountId) {
      const linkedinAccount = await LinkedInAccount.findById(value.linkedinAccountId);
      if (!linkedinAccount) {
        throw new ApiError('LinkedIn account not found', 404);
      }
      if (!linkedinAccount.isActive) {
        throw new ApiError('LinkedIn account is not active', 400);
      }
    }

    // If proxyId is provided, check if proxy exists
    if (value.proxyId) {
      const proxy = await Proxy.findById(value.proxyId);
      if (!proxy) {
        throw new ApiError('Proxy not found', 404);
      }
      if (!proxy.isActive) {
        throw new ApiError('Proxy is not active', 400);
      }
    }

    // Update campaign
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate({
      path: 'createdBy',
      select: '_id name email'
    }).populate({
      path: 'linkedinAccountId',
      select: '_id username email'
    }).populate({
      path: 'proxyId',
      select: '_id name host port'
    });

    res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: updatedCampaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a campaign
 * @route DELETE /api/campaigns/:id
 * @access Private
 */
export const deleteCampaign = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid campaign ID format', 400);
    }

    // Find campaign and check ownership
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new ApiError('Campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== 'ADMIN' && campaign.createdBy.toString() !== req.user?.userId) {
      throw new ApiError('Not authorized to delete this campaign', 403);
    }

    // Don't allow deletion of running campaigns
    if (campaign.status === CampaignStatus.RUNNING) {
      throw new ApiError('Cannot delete a running campaign', 400);
    }

    // Delete campaign
    await Campaign.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a campaign to the queue
 * @route POST /api/campaigns/queue
 * @access Private
 */
export const addCampaignToQueue = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = queueCampaignSchema.validate(req.body);
    if (error) {
      throw new ApiError(error.message, 400);
    }

    const { campaignId, priority = 'medium' } = value;

    // Find campaign and check ownership
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new ApiError('Campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== 'ADMIN' && campaign.createdBy.toString() !== req.user?.userId) {
      throw new ApiError('Not authorized to queue this campaign', 403);
    }

    // Check if campaign can be queued
    if (campaign.status !== CampaignStatus.CREATED && campaign.status !== CampaignStatus.PAUSED) {
      throw new ApiError(`Cannot queue campaign with status ${campaign.status}`, 400);
    }

    // Update campaign status to QUEUED
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaignId,
      {
        $set: {
          status: CampaignStatus.QUEUED,
          queuedAt: new Date(),
          priority
        }
      },
      { new: true, runValidators: true }
    ).populate({
      path: 'createdBy',
      select: '_id name email'
    }).populate({
      path: 'linkedinAccountId',
      select: '_id username email'
    }).populate({
      path: 'proxyId',
      select: '_id name host port'
    });

    res.status(200).json({
      success: true,
      message: 'Campaign added to queue successfully',
      data: updatedCampaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get campaign results
 * @route GET /api/campaigns/:id/results
 * @access Private
 */
export const getCampaignResults = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid campaign ID format', 400);
    }

    // Find campaign and check ownership
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new ApiError('Campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== 'ADMIN' && campaign.createdBy.toString() !== req.user?.userId) {
      throw new ApiError('Not authorized to access this campaign', 403);
    }

    // Get campaign results with pagination
    const skip = (pageNumber - 1) * limitNumber;
    const results = campaign.results.slice(skip, skip + limitNumber);
    const total = campaign.results.length;
    const totalPages = Math.ceil(total / limitNumber);

    res.status(200).json({
      success: true,
      message: 'Campaign results retrieved successfully',
      data: results,
      pagination: {
        total,
        page: pageNumber,
        pages: totalPages,
        limit: limitNumber
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger LinkedIn search for a campaign
 * @route POST /api/campaigns/:id/searchLinkedin
 * @access Private
 */
export const searchLinkedin = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate campaign data from body
    const {
      proxyHost, proxyPort, proxyUsername, proxyPassword,
      // Extract other search parameters if needed
      ...searchParams
    } = req.body;

    // Find campaign with populated data
    const campaign = await Campaign.findById(id)
      .populate('linkedinAccountId')
      .populate('proxyId');

    if (!campaign) {
      throw new ApiError('Campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== rolesObj.ADMIN && campaign.createdBy.toString() !== req.user?._id?.toString()) {
      throw new ApiError('Not authorized to access this campaign', 403);
    }

    // Update campaign status to running
    await Campaign.findByIdAndUpdate(id, {
      status: CampaignStatus.RUNNING,
      startedAt: new Date()
    });

    // Start the search process in background
    (async () => {
      try {
        logger.info(`Starting LinkedIn search for campaign ${id}`);

        // Get LinkedIn account credentials with proper password decryption
        const linkedinAccount = campaign.linkedinAccountId as any;
        const password = linkedinAccount.getPassword(); // Get decrypted password

        if (!password) {
          throw new ApiError('Failed to retrieve LinkedIn account password', 500);
        }

        // Initialize auth and search services
        const authService = LinkedInAuthService;
        const searchService = LinkedInSearchService;

        // Prepare proxy configuration
        let proxyConfig = null;

        if (proxyHost && proxyPort) {
          // If proxy details provided in request, create a new proxy object
          try {
            // Create a simple proxy object with the required properties
            const tempProxy: any = {
              host: proxyHost,
              port: proxyPort,
              username: proxyUsername,
              getPassword: () => proxyPassword
            };

            proxyConfig = tempProxy;
          } catch (proxyError) {
            logger.error(`Error creating proxy: ${proxyError instanceof Error ? proxyError.message : String(proxyError)}`);
          }
        } else if (campaign.proxyId) {
          // If campaign has a proxy, use it directly
          proxyConfig = campaign.proxyId;
        }

        // Log in to LinkedIn and get the driver
        const loginResult = await authService.login(
          {
            username: linkedinAccount.username,
            email: linkedinAccount.email || linkedinAccount.username
          } as any, // Create minimal account object
          password,
          proxyConfig
        );

        if (!loginResult.success) {
          throw new Error(`LinkedIn login failed: ${loginResult.message}`);
        }

        try {
          // Fix the keywords typing issue by using the first array element or falling back to searchQuery
          const keywordsString = Array.isArray(campaign.keywords) && campaign.keywords.length > 0
            ? campaign.keywords[0]
            : (campaign.searchQuery || "");

          // Perform the search using the campaign parameters
          const searchResults = await searchService.search(
            loginResult.driver!,
            {
              keywords: keywordsString,
              filters: {
                locations: campaign.location ? [campaign.location] : undefined,
                companies: campaign.company ? [campaign.company] : undefined,
                pastCompanies: campaign.pastCompany ? [campaign.pastCompany] : undefined,
                industries: campaign.industry ? [campaign.industry] : undefined,
                connectionDegree: campaign.connectionDegree ? [campaign.connectionDegree] : undefined
              },
              maxResults: campaign.maxResults || 50,
              campaignId: id
            }
          );

          logger.info(`Search completed with ${searchResults.length} results for campaign ${id}`);

          // Save the search results as leads
          let savedLeadsCount = 0;
          for (const result of searchResults) {
            try {
              const { profileId, profileUrl, name } = result;

              // Check if this profile already exists
              const existingLead = await Lead.findOne({
                campaignId: id,
                clientId: profileId
              });

              if (!existingLead) {
                await Lead.create({
                  campaignId: id,
                  clientId: profileId,
                  link: profileUrl,
                  name: name,
                  isSearched: false
                });
                savedLeadsCount++;
              }
            } catch (saveError) {
              logger.error(`Error saving lead: ${saveError instanceof Error ? saveError.message : String(saveError)}`);
              // Continue with the next result
            }
          }

          logger.info(`Saved ${savedLeadsCount} new leads for campaign ${id}`);

          // Update campaign status to search completed
          await Campaign.findByIdAndUpdate(id, {
            $inc: {
              'stats.profilesFound': savedLeadsCount
            },
            status: CampaignStatus.SEARCH_COMPLETED
          });

          // Queue up profile scraping jobs for the new leads
          const leadProcessingService = LeadProcessingService;

          // Determine priority based on campaign priority
          let jobPriority = JobPriority.MEDIUM;
          if (campaign.priority === 'high') {
            jobPriority = JobPriority.HIGH;
          } else if (campaign.priority === 'low') {
            jobPriority = JobPriority.LOW;
          }

          // Queue the leads for profile scraping
          const queuedJobsCount = await leadProcessingService.queueCampaignLeads(id, jobPriority);
          logger.info(`Queued ${queuedJobsCount} leads for profile scraping for campaign ${id}`);

        } catch (searchError) {
          logger.error(`Error during search: ${searchError instanceof Error ? searchError.message : String(searchError)}`);
          throw searchError;
        } finally {
          // Always close the browser when done if it's still open
          if (loginResult.driver) {
            try {
              await SeleniumService.quitDriver(loginResult.driver);
              logger.info('WebDriver quit successfully');
            } catch (driverError) {
              logger.error(`Error closing WebDriver: ${driverError instanceof Error ? driverError.message : String(driverError)}`);
            }
          }
        }
      } catch (error) {
        logger.error(`Error in background LinkedIn search for campaign ${id}: ${error instanceof Error ? error.message : String(error)}`);

        // Update campaign status to failed
        await Campaign.findByIdAndUpdate(id, {
          status: CampaignStatus.FAILED,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    })();

    res.status(200).json({
      success: true,
      message: 'LinkedIn search triggered successfully. Processing in the background.',
      data: {
        campaignId: id,
        status: 'running'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger LinkedIn profile scraping for a specific campaign
 * @route POST /api/campaigns/:id/scrapeProfiles
 * @access Private
 */
export const scrapeProfiles = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid campaign ID format', 400);
    }

    // Find campaign
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new ApiError('Campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== rolesObj.ADMIN && campaign.createdBy.toString() !== req.user?._id?.toString()) {
      throw new ApiError('Not authorized to access this campaign', 403);
    }

    // Determine priority based on campaign priority or request body
    let jobPriority = JobPriority.MEDIUM;
    if (campaign.priority === 'high') {
      jobPriority = JobPriority.HIGH;
    } else if (campaign.priority === 'low') {
      jobPriority = JobPriority.LOW;
    }

    // If priority is specified in the request body, use that instead
    if (req.body.priority) {
      if (req.body.priority === 'high') {
        jobPriority = JobPriority.HIGH;
      } else if (req.body.priority === 'low') {
        jobPriority = JobPriority.LOW;
      }
    }

    // Queue up the profile scraping jobs
    const leadProcessingService = LeadProcessingService;
    const queuedJobsCount = await leadProcessingService.queueCampaignLeads(id, jobPriority);

    if (queuedJobsCount === 0) {
      res.status(200).json({
        success: true,
        message: 'No leads to scrape for this campaign.',
        data: {
          campaignId: id,
          queuedJobs: 0
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Queued ${queuedJobsCount} leads for profile scraping.`,
      data: {
        campaignId: id,
        queuedJobs: queuedJobsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually scrape a LinkedIn profile and return the data
 * @route POST /api/campaigns/linkedInProfileScrappingReq
 * @access Private
 */
export const linkedInProfileScrappingReq = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate the request body using Joi schema
    const { error, value } = profileScrapeSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        status: false,
        error: error.message
      });
      return;
    }

    const { profileUrl, campaignId } = value;
    logger.info(`Processing LinkedIn profile scraping request for URL: ${profileUrl}${campaignId ? ` in campaign ${campaignId}` : ''}`);

    // Get the LinkedInProfileScraper instance
    const scraper = LinkedInProfileScraper.getInstance();

    try {
      // Call scrapeProfile with the appropriate parameters
      // If campaignId is provided, use the WebDriverManager
      if (campaignId) {
        // Get the campaign with populated LinkedIn account and proxy
        const campaign = await Campaign.findById(campaignId)
          .populate<{ linkedinAccountId: ILinkedInAccount }>('linkedinAccountId')
          .populate<{ proxyId: IProxy }>('proxyId');

        if (!campaign || !campaign.linkedinAccountId) {
          throw new Error(`Campaign ${campaignId} not found or has no LinkedIn account configured`);
        }

        // Get the LinkedIn account password from environment or secure storage
        const password = process.env.LINKEDIN_PASSWORD; // TODO: Replace with secure password retrieval
        if (!password) {
          throw new Error('LinkedIn account password not configured');
        }

        const profileData = await scraper.scrapeProfile(
          profileUrl,
          campaignId,
          campaign.linkedinAccountId,
          password,
          campaign.proxyId
        );

        if (!profileData) {
          throw new Error(`Failed to extract profile data for ${profileUrl}`);
        }

        // Return the scraped profile data
        res.status(200).json({
          status: true,
          data: profileData
        });
      } else {
        // For direct scraping without campaign context, throw error
        throw new Error('Campaign ID is required for profile scraping');
      }
    } catch (scrapeError) {
      logger.error(`LinkedIn profile scraping error: ${scrapeError instanceof Error ? scrapeError.message : String(scrapeError)}`);

      res.status(400).json({
        status: false,
        error: scrapeError instanceof Error ? scrapeError.message : `Failed to scrape profile: ${profileUrl}`
      });
    }
  } catch (error) {
    logger.error(`LinkedIn profile scraping error: ${error instanceof Error ? error.message : String(error)}`);

    next(error);
  }
};

/**
 * Get profile scraping job status for a campaign
 * @route GET /api/campaigns/:id/scrapeStatus
 * @access Private
 */
export const getScrapeStatus = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid campaign ID format', 400);
    }

    // Find campaign
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new ApiError('Campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== rolesObj.ADMIN && campaign.createdBy.toString() !== req.user?._id?.toString()) {
      throw new ApiError('Not authorized to access this campaign', 403);
    }

    // Get job queue service
    const jobQueue = JobQueueService.getInstance();

    // Get jobs for this campaign
    const jobs = await jobQueue.getJobsByCampaignId(id);

    // Filter for profile scraping jobs
    const profileJobs = jobs.filter(job => job.type === JobType.PROFILE_SCRAPING);

    // Count jobs by status
    const completed = profileJobs.filter(job => job.completedAt).length;
    const failed = profileJobs.filter(job => job.failedAt).length;
    const pending = profileJobs.filter(job => !job.completedAt && !job.failedAt && !job.startedAt).length;
    const processing = profileJobs.filter(job => job.startedAt && !job.completedAt && !job.failedAt).length;
    const total = profileJobs.length;

    // Get lead counts
    const totalLeads = await Lead.countDocuments({ campaignId: id });
    const scrapedLeads = await Lead.countDocuments({ campaignId: id, isSearched: true });
    const remainingLeads = await Lead.countDocuments({ campaignId: id, isSearched: false });

    res.status(200).json({
      success: true,
      data: {
        campaignId: id,
        status: campaign.status,
        jobs: {
          total,
          completed,
          failed,
          pending,
          processing
        },
        leads: {
          total: totalLeads,
          scraped: scrapedLeads,
          remaining: remainingLeads
        },
        progress: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule a campaign for future execution
 * @route POST /api/campaigns/:id/schedule
 * @access Private
 */
export const scheduleCampaign = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid campaign ID format', 400);
    }

    // Validate request body
    const { error, value } = scheduleCampaignSchema.validate(req.body);
    if (error) {
      throw new ApiError(error.message, 400);
    }

    const { scheduleDate, jobType, priority = 'medium', recurrence = 'once', endDate = null } = value;

    // Ensure schedule date is in the future
    const scheduleDateObj = new Date(scheduleDate);
    if (scheduleDateObj <= new Date()) {
      throw new ApiError('Schedule date must be in the future', 400);
    }

    // If recurrence is not 'once', validate endDate
    if (recurrence !== 'once' && !endDate) {
      throw new ApiError('End date is required for recurring schedules', 400);
    }

    // If endDate is provided, ensure it's after scheduleDate
    let endDateObj = null;
    if (endDate) {
      endDateObj = new Date(endDate);
      if (endDateObj <= scheduleDateObj) {
        throw new ApiError('End date must be after the schedule date', 400);
      }
    }

    // Find campaign
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      throw new ApiError('Campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== 'ADMIN' && campaign.createdBy.toString() !== req.user?.userId) {
      throw new ApiError('Not authorized to schedule this campaign', 403);
    }

    // Check campaign status - can only schedule CREATED or PAUSED campaigns
    if (campaign.status !== CampaignStatus.CREATED && campaign.status !== CampaignStatus.PAUSED) {
      throw new ApiError(`Cannot schedule campaign with status ${campaign.status}`, 400);
    }

    // Schedule the campaign using the job queue service
    const jobQueueService = JobQueueService.getInstance();

    // Convert job type string to enum
    const jobTypeEnum = jobType === 'search' ? JobType.SEARCH : JobType.PROFILE_SCRAPING;

    // Convert priority string to enum
    let jobPriority = JobPriority.MEDIUM;
    if (priority === 'high') {
      jobPriority = JobPriority.HIGH;
    } else if (priority === 'low') {
      jobPriority = JobPriority.LOW;
    }

    // Convert recurrence string to enum
    let campaignRecurrence = CampaignRecurrence.ONCE;
    if (recurrence === 'daily') {
      campaignRecurrence = CampaignRecurrence.DAILY;
    } else if (recurrence === 'weekly') {
      campaignRecurrence = CampaignRecurrence.WEEKLY;
    } else if (recurrence === 'monthly') {
      campaignRecurrence = CampaignRecurrence.MONTHLY;
    }

    // Add job to queue with future execution date in the data
    const jobId = await jobQueueService.addJob(
      jobTypeEnum,
      id,
      {
        scheduledFor: scheduleDateObj.toISOString(),
        recurrence,
        endDate: endDateObj ? endDateObj.toISOString() : null
      },
      jobPriority
    );

    // Convert priority string to campaign priority enum
    let campaignPriority = CampaignPriority.MEDIUM;
    if (priority === 'high') {
      campaignPriority = CampaignPriority.HIGH;
    } else if (priority === 'low') {
      campaignPriority = CampaignPriority.LOW;
    }

    // Update campaign status to QUEUED
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      id,
      {
        $set: {
          status: CampaignStatus.QUEUED,
          queuedAt: new Date(),
          priority: campaignPriority,
          scheduledFor: scheduleDateObj,
          recurrence: campaignRecurrence,
          scheduleEndDate: endDateObj
        }
      },
      { new: true, runValidators: true }
    ).populate({
      path: 'createdBy',
      select: '_id name email'
    }).populate({
      path: 'linkedinAccountId',
      select: '_id username email'
    }).populate({
      path: 'proxyId',
      select: '_id name host port'
    });

    logger.info(`Campaign ${id} scheduled for ${scheduleDateObj.toISOString()} with job ID ${jobId} and recurrence: ${recurrence}`);

    res.status(200).json({
      success: true,
      message: 'Campaign scheduled successfully',
      data: {
        campaign: updatedCampaign,
        scheduledFor: scheduleDateObj,
        recurrence,
        endDate: endDateObj,
        jobId,
        jobType
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get processing status of a specific lead
 * @route GET /api/campaigns/leads/:leadId/status
 * @access Private
 */
export const getLeadStatus = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { leadId } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      throw new ApiError('Invalid lead ID format', 400);
    }

    // Find lead
    const lead = await Lead.findById(leadId);

    if (!lead) {
      throw new ApiError('Lead not found', 404);
    }

    // Find the campaign to check ownership
    const campaign = await Campaign.findById(lead.campaignId);

    if (!campaign) {
      throw new ApiError('Associated campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== rolesObj.ADMIN && campaign.createdBy.toString() !== req.user?._id?.toString()) {
      throw new ApiError('Not authorized to access this lead', 403);
    }

    // Prepare response data
    const responseData = {
      leadId: lead._id,
      campaignId: lead.campaignId,
      status: lead.status,
      clientId: lead.clientId,
      name: lead.name,
      link: lead.link,
      isSearched: lead.isSearched,
      processingStatus: lead.processingStatus || 'unknown',
      lastProcessingAttempt: lead.lastProcessingAttempt,
      processingAttempts: lead.processingAttempts || 0,
      processingErrors: lead.processingErrors || []
    };

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};
