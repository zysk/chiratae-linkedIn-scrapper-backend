import { Request, Response, NextFunction } from 'express';
import Campaign, { CampaignStatus, ICampaign, CampaignPriority, CampaignRecurrence } from '../models/campaign.model';
import LinkedInAccount from '../models/linkedinAccount.model';
import Proxy from '../models/proxy.model';
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
import JobQueueService, { JobType, JobPriority } from '../services/redis/JobQueueService';
import LinkedInSearchService from '../services/linkedin/LinkedInSearchService';
import { LinkedInProfileScraper } from '../services/linkedin/LinkedInProfileScraper';
import ScreenshotCleanupService from '../services/utils/ScreenshotCleanupService';

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

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError('Invalid campaign ID format', 400);
    }

    // Find campaign with populated data
    const campaign = await Campaign.findById(id)
      .populate('linkedinAccountId')
      .populate('proxyId');

    if (!campaign) {
      throw new ApiError('Campaign not found', 404);
    }

    // Check ownership (unless admin)
    if (req.user?.role !== 'ADMIN' && campaign.createdBy.toString() !== req.user?.userId) {
      throw new ApiError('Not authorized to trigger search for this campaign', 403);
    }

    // Check campaign status
    if (campaign.status !== CampaignStatus.QUEUED) {
      throw new ApiError('Campaign must be in QUEUED status to trigger search', 400);
    }

    // Check if we have valid account and proxy
    if (!campaign.linkedinAccountId) {
      throw new ApiError('Campaign has no LinkedIn account assigned', 400);
    }

    // Proxy is now optional
    // Update campaign status to processing
    await Campaign.findByIdAndUpdate(id, {
      status: CampaignStatus.RUNNING,
      startedAt: new Date()
    });

    // Trigger the search in background
    (async () => {
      try {
        logger.info(`Starting LinkedIn search for campaign ${id}`);

        // Get necessary data for search
        const linkedinAccount = await LinkedInAccount.findById(campaign.linkedinAccountId);
        const proxy = campaign.proxyId ? await Proxy.findById(campaign.proxyId) : null;

        if (!linkedinAccount || !linkedinAccount.isActive) {
          throw new Error('LinkedIn account not found or inactive');
        }

        // Only check proxy if it's provided
        if (campaign.proxyId && (!proxy || !proxy.isActive)) {
          throw new Error('Proxy not found or inactive');
        }

        // Get password
        const password = linkedinAccount.getPassword ? linkedinAccount.getPassword() : '';
        if (!password) {
          throw new Error('Could not retrieve LinkedIn account password');
        }

        // Login to LinkedIn
        logger.info(`Attempting to login with LinkedIn account: ${linkedinAccount.username}`);
        const loginResult = await LinkedInAuthService.login(linkedinAccount, password, proxy || undefined);

        if (!loginResult.success || !loginResult.driver) {
          throw new Error(`LinkedIn login failed: ${loginResult.message}`);
        }

        // Prepare search parameters
        const campaignFilters = campaign.get('filters') || {};
        const searchParams = {
          keywords: campaign.get('searchQuery') || '',
          filters: {
            locations: campaignFilters.locations || [],
            jobTitles: campaignFilters.jobTitles || [],
            companies: campaignFilters.companies || [],
            industries: campaignFilters.industries || [],
            connectionDegree: campaignFilters.connectionDegree || [],
            pastCompanies: campaignFilters.pastCompanies || []
          },
          maxResults: campaign.get('maxResults') || 100,
          campaignId: id
        };

        logger.info(`Starting search with parameters: ${JSON.stringify(searchParams)}`);

        // Execute the search
        try {
          const profiles = await LinkedInSearchService.search(loginResult.driver, searchParams);

          logger.info(`Search completed. Found ${profiles.length} profiles.`);

          // Update campaign stats (approximate, exact count will be done in background process)
          await Campaign.findByIdAndUpdate(id, {
            $inc: { 'stats.profilesFound': profiles.length },
            status: CampaignStatus.SEARCH_COMPLETED
          });

          // Clean up screenshots after search is completed
          try {
            await ScreenshotCleanupService.cleanupCampaignScreenshots(id);
            logger.info(`Cleaned up screenshots for campaign ${id} after search completion`);
          } catch (cleanupError) {
            logger.error(`Error cleaning up screenshots for campaign ${id}: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
          }

        } finally {
          // Always close the browser when done
          if (loginResult.driver) {
            await SeleniumService.quitDriver(loginResult.driver);
            logger.info('WebDriver quit successfully');
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
        status: 'processing'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger LinkedIn profile scraping for a campaign
 * @route POST /api/campaigns/:id/linkedInProfileScrappingReq
 * @access Private
 */
export const linkedInProfileScrappingReq = async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileUrl } = req.body;

    if (!profileUrl) {
      res.status(400).json({
        status: false,
        error: 'LinkedIn profile URL is required'
      });
      return;
    }

    logger.info(`Processing LinkedIn profile scraping request for URL: ${profileUrl}`);

    // Get the LinkedInProfileScraper instance
    const scraper = LinkedInProfileScraper.getInstance();

    // Call scrapeProfile with the URL only - driver initialization is now handled internally
    const profileData = await scraper.scrapeProfile(profileUrl);

    if (!profileData) {
      res.status(400).json({
        status: false,
        error: `Failed to extract profile data for ${profileUrl}`
      });
      return;
    }

    // Return the scraped profile data
    res.status(200).json({
      status: true,
      data: profileData
    });

  } catch (error) {
    logger.error(`LinkedIn profile scraping error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({
      status: false,
      error: error instanceof Error ? error.message : 'Failed to scrape LinkedIn profile'
    });
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
