import { Request, Response, NextFunction } from 'express';
import Campaign, { CampaignStatus, ICampaign } from '../models/campaign.model';
import LinkedInAccount from '../models/linkedinAccount.model';
import Proxy from '../models/proxy.model';
import mongoose from 'mongoose';
import { ApiError } from '../utils/error.utils';
import { IAuthRequest } from '../middleware/auth.middleware';
import {
  createCampaignSchema,
  updateCampaignSchema,
  queueCampaignSchema,
  campaignFilterSchema
} from '../utils/validation/campaign.validation';

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

    // Check if proxy exists and is active
    const proxy = await Proxy.findById(value.proxyId);
    if (!proxy) {
      throw new ApiError('Proxy not found', 404);
    }
    if (!proxy.isActive) {
      throw new ApiError('Proxy is not active', 400);
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
