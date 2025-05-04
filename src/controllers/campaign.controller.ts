import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Campaign, { ICampaignDocument } from "../models/Campaign.model";
import LinkedInAccount from "../models/LinkedInAccount.model";
import Proxy from "../models/Proxy.model";
import {
  badRequest,
  notFound,
  serverError,
  conflict,
} from "../helpers/ErrorHandler";
import {
  successResponse,
  dataResponse,
  paginatedResponse,
  errorResponse,
} from "../interfaces/ApiResponse";
import {
  ErrorMessages,
  SuccessMessages,
  campaignStatusObj,
} from "../helpers/Constants";
import { initialDriver, createWebDriver } from "../app"; // Import WebDriver instance/creator
import {
  performLinkedInLogin,
  submitCaptchaSolution,
  submitOtpCode,
  checkLinkedInLoginStatus,
  LoginStatus,
  LoginResult,
} from "../services/linkedInAuth.service"; // Import the new service
import { performSearch } from "../services/linkedInSearch.service"; // Import the search service
import { ICampaignStats, ILinkedInSearchFilters } from "../interfaces/Campaign.interface";

/**
 * Create a new campaign
 */
export const createCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const {
    name,
    description,
    searchQuery,
    linkedInAccountId,
    proxyId,
    filters,
    schedule,
    priority,
    maxProfilesPerRun,
    maxRunTimeMinutes,
    requestsPerMinute,
    delayBetweenProfiles,
    targetLeadCount,
    targetCompletionDate,
    notifyOnCompletion,
    notifyOnFailure,
    notificationEmail,
  } = req.body;

  if (!name || !searchQuery || !linkedInAccountId) {
    return next(
      badRequest(
        "Campaign name, search query, and LinkedIn account ID are required",
      ),
    );
  }

  if (
    linkedInAccountId &&
    !mongoose.Types.ObjectId.isValid(linkedInAccountId)
  ) {
    return next(badRequest("Invalid LinkedIn Account ID format"));
  }
  if (proxyId && !mongoose.Types.ObjectId.isValid(proxyId)) {
    return next(badRequest("Invalid Proxy ID format"));
  }

  try {
    // Verify LinkedIn account exists
    const account = await LinkedInAccount.findById(linkedInAccountId);
    if (!account) {
      return next(notFound(ErrorMessages.LINKEDIN_ACCOUNT_NOT_FOUND));
    }
    // Verify Proxy exists if provided
    if (proxyId) {
      const proxy = await Proxy.findById(proxyId);
      if (!proxy) {
        return next(notFound(ErrorMessages.PROXY_NOT_FOUND));
      }
    }

    // Convert target completion date string to Date object if provided
    let parsedTargetCompletionDate: Date | undefined = undefined;
    if (targetCompletionDate) {
      const dateObj = new Date(targetCompletionDate);
      if (isNaN(dateObj.getTime())) {
        return next(badRequest("Invalid target completion date format"));
      }
      parsedTargetCompletionDate = dateObj;
    }

    // Create campaign with new fields
    const newCampaign = new Campaign({
      name,
      description,
      searchQuery,
      linkedInAccountId,
      proxyId,
      filters, // Use the filters object instead of individual filters
      schedule,
      isScheduled: !!schedule,
      priority,
      maxProfilesPerRun,
      maxRunTimeMinutes,
      requestsPerMinute,
      delayBetweenProfiles,
      targetLeadCount,
      targetCompletionDate: parsedTargetCompletionDate,
      notifyOnCompletion,
      notifyOnFailure,
      notificationEmail,
      createdBy: req.user?.id,
    });

    await newCampaign.save();
    res
      .status(201)
      .json(dataResponse(SuccessMessages.CAMPAIGN_CREATED, newCampaign));
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    next(serverError(error.message));
  }
};

/**
 * Get all campaigns (paginated, optionally filtered by status, creator, etc.)
 */
export const getAllCampaigns = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query with advanced filtering
    const query: any = {};

    // Filter by creator user ID (default to current user)
    query.createdBy = req.user?.id;

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by processing state
    if (req.query.processing) {
      query.processing = req.query.processing === 'true';
    }

    // Filter by scheduled state
    if (req.query.isScheduled) {
      query.isScheduled = req.query.isScheduled === 'true';
    }

    // Filter by name (partial match)
    if (req.query.name) {
      query.name = { $regex: req.query.name, $options: 'i' };
    }

    // Filter by priority range
    if (req.query.minPriority || req.query.maxPriority) {
      query.priority = {};
      if (req.query.minPriority) {
        query.priority.$gte = parseInt(req.query.minPriority as string);
      }
      if (req.query.maxPriority) {
        query.priority.$lte = parseInt(req.query.maxPriority as string);
      }
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {};
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    // Determine sort order
    const sortField = (req.query.sortBy as string) || 'createdAt';
    const sortDirection = req.query.sortDesc === 'true' ? -1 : 1;
    const sort: any = {};
    sort[sortField] = sortDirection;

    const campaigns = await Campaign.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("linkedInAccountId", "name") // Populate account name
      .populate("proxyId", "value"); // Populate proxy value

    const total = await Campaign.countDocuments(query);

    res.status(200).json(
      paginatedResponse("Campaigns retrieved", campaigns, {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }),
    );
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Get campaign by ID
 */
export const getCampaignById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const campaign = await Campaign.findOne({
      _id: id,
      createdBy: req.user?.id,
    }) // Ensure user owns campaign
      .populate("linkedInAccountId", "name email")
      .populate("proxyId", "value protocol")
      .populate({
        path: "resultsArr",
        options: { limit: 10 }, // Limit lead results to avoid huge payloads
      });

    if (!campaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }
    res.status(200).json(dataResponse("Campaign found", campaign));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Update campaign
 */
export const updateCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  // Prevent critical status updates through this endpoint
  delete updateData.status;
  delete updateData.isSearched;
  delete updateData.processing;
  delete updateData.resultsArr;
  delete updateData.stats;
  delete updateData.executionLogs;
  delete updateData.runCount;
  delete updateData.lastRun;

  // Validate account/proxy IDs if changed
  if (
    updateData.linkedInAccountId &&
    !mongoose.Types.ObjectId.isValid(updateData.linkedInAccountId)
  ) {
    return next(badRequest("Invalid LinkedIn Account ID format"));
  }
  if (
    updateData.proxyId &&
    !mongoose.Types.ObjectId.isValid(updateData.proxyId)
  ) {
    return next(badRequest("Invalid Proxy ID format"));
  }

  // Handle date conversions
  if (updateData.targetCompletionDate) {
    const dateObj = new Date(updateData.targetCompletionDate);
    if (isNaN(dateObj.getTime())) {
      return next(badRequest("Invalid target completion date format"));
    }
    updateData.targetCompletionDate = dateObj;
  }

  updateData.updatedBy = req.user?.id;
  updateData.isScheduled = !!updateData.schedule;

  try {
    // Verify LinkedIn account exists if changed
    if (updateData.linkedInAccountId) {
      const account = await LinkedInAccount.findById(
        updateData.linkedInAccountId,
      );
      if (!account) {
        return next(notFound(ErrorMessages.LINKEDIN_ACCOUNT_NOT_FOUND));
      }
    }
    // Verify Proxy exists if provided/changed
    if (updateData.proxyId) {
      const proxy = await Proxy.findById(updateData.proxyId);
      if (!proxy) {
        return next(notFound(ErrorMessages.PROXY_NOT_FOUND));
      }
    }

    const updatedCampaign = await Campaign.findOneAndUpdate(
      { _id: id, createdBy: req.user?.id }, // Ensure user owns campaign
      updateData,
      { new: true, runValidators: true },
    );

    if (!updatedCampaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }

    res
      .status(200)
      .json(dataResponse(SuccessMessages.CAMPAIGN_UPDATED, updatedCampaign));
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    next(serverError(error.message));
  }
};

/**
 * Delete campaign
 */
export const deleteCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const campaign = await Campaign.findOne({
      _id: id,
      createdBy: req.user?.id,
    }); // Ensure user owns campaign

    if (!campaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }

    // Don't allow deletion of running campaigns
    if (campaign.status === campaignStatusObj.PROCESSING) {
      return next(
        conflict(ErrorMessages.CAMPAIGN_PROCESSING),
      );
    }

    await Campaign.deleteOne({ _id: id });
    res.status(200).json(successResponse(SuccessMessages.CAMPAIGN_DELETED));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Start campaign execution
 */
export const startCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const campaign = await Campaign.findOne({
      _id: id,
      createdBy: req.user?.id,
    }) as ICampaignDocument | null; // Ensure user owns campaign

    if (!campaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }

    // Cannot start already processing campaign
    if (campaign.status === campaignStatusObj.PROCESSING) {
      return next(
        conflict(ErrorMessages.CAMPAIGN_PROCESSING),
      );
    }

    // Update campaign status
    campaign.status = campaignStatusObj.PROCESSING;
    campaign.processing = true;
    campaign.runCount = (campaign.runCount || 0) + 1;
    campaign.lastRun = new Date();

    // Initialize campaign stats if needed
    const statsUpdate: Partial<ICampaignStats> = {
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
    };

    // Call the updateStats method
    await campaign.updateStats(statsUpdate);

    // Add an execution log entry
    await campaign.addLogEntry("CAMPAIGN_STARTED", "Campaign started manually by user");

    await campaign.save();

    // Start the search process asynchronously
    // Normally, this would be handled by a background job/queue processor
    // Here we respond immediately and processing will be done in the background
    res.status(200).json(successResponse(SuccessMessages.CAMPAIGN_STARTED));

    // This would normally be handled by a queue or job processor
    // For now, just log that it would happen
    console.log(`Campaign ${id} would be started by job processor`);
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Stop campaign execution
 */
export const stopCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const campaign = await Campaign.findOne({
      _id: id,
      createdBy: req.user?.id,
    }) as ICampaignDocument | null; // Ensure user owns campaign

    if (!campaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }

    // Can only stop processing campaigns
    if (campaign.status !== campaignStatusObj.PROCESSING) {
      return next(
        badRequest("Campaign is not currently processing"),
      );
    }

    // Update campaign status
    campaign.status = campaignStatusObj.CANCELLED;
    campaign.processing = false;

    // Add a log entry
    await campaign.addLogEntry("CAMPAIGN_STOPPED", "Campaign stopped manually by user");

    await campaign.save();

    res.status(200).json(successResponse(SuccessMessages.CAMPAIGN_STOPPED));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Get campaign execution logs
 */
export const getCampaignLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const campaign = await Campaign.findOne(
      {
        _id: id,
        createdBy: req.user?.id,
      },
      { executionLogs: { $slice: limit } } // Only get the first 'limit' logs
    );

    if (!campaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }

    res.status(200).json(
      dataResponse("Campaign logs retrieved", {
        campaignId: id,
        logs: campaign.executionLogs || [],
      })
    );
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Get campaign statistics
 */
export const getCampaignStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const campaign = await Campaign.findOne(
      {
        _id: id,
        createdBy: req.user?.id,
      },
      {
        name: 1,
        status: 1,
        processing: 1,
        isSearched: 1,
        stats: 1,
        runCount: 1,
        lastRun: 1,
        nextRun: 1,
      }
    );

    if (!campaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }

    res.status(200).json(
      dataResponse("Campaign statistics retrieved", {
        campaignId: id,
        name: campaign.name,
        status: campaign.status,
        processing: campaign.processing,
        isSearched: campaign.isSearched,
        stats: campaign.stats || {},
        runCount: campaign.runCount || 0,
        lastRun: campaign.lastRun,
        nextRun: campaign.nextRun,
      })
    );
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Update campaign search filters
 */
export const updateCampaignFilters = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  const filters: ILinkedInSearchFilters = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const campaign = await Campaign.findOne({
      _id: id,
      createdBy: req.user?.id,
    }) as ICampaignDocument | null;

    if (!campaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }

    // Cannot update filters for a processing campaign
    if (campaign.status === campaignStatusObj.PROCESSING) {
      return next(
        conflict(ErrorMessages.CAMPAIGN_PROCESSING),
      );
    }

    // Update filters
    campaign.filters = filters;
    // Convert string ID to ObjectId
    if (req.user?.id) {
      campaign.updatedBy = new mongoose.Types.ObjectId(req.user.id);
    }

    // Add a log entry
    await campaign.addLogEntry("FILTERS_UPDATED", "Campaign search filters updated");

    await campaign.save();

    res.status(200).json(
      dataResponse("Campaign filters updated", campaign.filters)
    );
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    next(serverError(error.message));
  }
};

/**
 * Reset campaign to allow for new execution
 */
export const resetCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  const { clearResults } = req.body; // Option to clear collected results

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const campaign = await Campaign.findOne({
      _id: id,
      createdBy: req.user?.id,
    }) as ICampaignDocument | null;

    if (!campaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }

    // Cannot reset a processing campaign
    if (campaign.status === campaignStatusObj.PROCESSING) {
      return next(
        conflict(ErrorMessages.CAMPAIGN_PROCESSING),
      );
    }

    // Reset campaign status
    campaign.status = campaignStatusObj.CREATED;
    campaign.processing = false;
    campaign.isSearched = false;

    // Clear results if requested
    if (clearResults) {
      campaign.resultsArr = [];
    }

    // Initialize fresh stats
    const statsUpdate: Partial<ICampaignStats> = {
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
    };

    await campaign.updateStats(statsUpdate);

    // Add a log entry
    await campaign.addLogEntry(
      "CAMPAIGN_RESET",
      `Campaign reset to allow for new execution. Results ${clearResults ? 'cleared' : 'preserved'}.`
    );

    await campaign.save();

    res.status(200).json(
      dataResponse("Campaign reset successfully", { campaignId: id, status: campaign.status })
    );
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Bulk update campaign priorities
 */
export const updateCampaignPriorities = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { priorities } = req.body;

  if (!priorities || !Array.isArray(priorities)) {
    return next(badRequest("Priorities array is required"));
  }

  try {
    const updates: Array<{id: string, priority: number}> = [];
    const errors: Array<{id: string | undefined, error: string}> = [];

    for (const item of priorities) {
      if (!item.id || !mongoose.Types.ObjectId.isValid(item.id)) {
        errors.push({ id: item.id, error: "Invalid ID format" });
        continue;
      }

      if (typeof item.priority !== 'number' || item.priority < 1 || item.priority > 10) {
        errors.push({ id: item.id, error: "Priority must be a number between 1 and 10" });
        continue;
      }

      try {
        const result = await Campaign.updateOne(
          { _id: item.id, createdBy: req.user?.id },
          { $set: { priority: item.priority, updatedBy: req.user?.id } }
        );

        if (result.matchedCount === 0) {
          errors.push({ id: item.id, error: "Campaign not found or unauthorized" });
        } else {
          updates.push({ id: item.id, priority: item.priority });
        }
      } catch (err: any) {
        errors.push({ id: item.id, error: err.message });
      }
    }

    res.status(200).json({
      status: "success",
      message: "Campaign priorities updated",
      data: {
        updated: updates,
        errors: errors,
      },
    });
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Initialize LinkedIn login for a specific account
 */
export const linkedInLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { linkedInAccountId } = req.body;

  if (
    !linkedInAccountId ||
    !mongoose.Types.ObjectId.isValid(linkedInAccountId)
  ) {
    return next(badRequest("Valid LinkedIn Account ID is required"));
  }

  if (!initialDriver) {
    // Check if the shared driver is available
    return next(
      serverError("WebDriver not initialized. Cannot perform login."),
    );
  }

  try {
    // Note: This uses the shared driver. For concurrent logins, a pool or separate drivers might be needed.
    const result: LoginResult = await performLinkedInLogin(
      initialDriver,
      linkedInAccountId,
    );
    res.status(200).json(dataResponse(result.message, result));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Check current LinkedIn login status
 */
export const checkLinkedInLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!initialDriver) {
    return next(serverError("WebDriver not initialized."));
  }
  try {
    const isLoggedIn = await checkLinkedInLoginStatus(initialDriver);
    res.status(200).json(
      dataResponse(isLoggedIn ? "Logged In" : "Not Logged In", {
        isLoggedIn,
      }),
    );
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Submit CAPTCHA solution during login flow
 */
export const sendLinkedInCaptchaInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { solution } = req.body;
  if (!solution) {
    return next(badRequest("CAPTCHA solution is required"));
  }
  if (!initialDriver) {
    return next(serverError("WebDriver not initialized."));
  }
  try {
    const success = await submitCaptchaSolution(initialDriver, solution);
    if (success) {
      // After submitting, immediately check status again
      const isLoggedIn = await checkLinkedInLoginStatus(initialDriver);
      res.status(200).json(
        dataResponse("CAPTCHA submitted. Re-check login status.", {
          submitted: true,
          isLoggedIn,
        }),
      );
    } else {
      res.status(400).json(errorResponse("Failed to submit CAPTCHA solution."));
    }
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Submit OTP code during login flow
 */
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { otpCode } = req.body;
  if (!otpCode) {
    return next(badRequest("OTP code is required"));
  }
  if (!initialDriver) {
    return next(serverError("WebDriver not initialized."));
  }
  try {
    const success = await submitOtpCode(initialDriver, otpCode);
    if (success) {
      // After submitting, immediately check status again
      const isLoggedIn = await checkLinkedInLoginStatus(initialDriver);
      res.status(200).json(
        dataResponse("OTP submitted. Re-check login status.", {
          submitted: true,
          isLoggedIn,
        }),
      );
    } else {
      res.status(400).json(errorResponse("Failed to submit OTP code."));
    }
  } catch (error: any) {
    next(serverError(error.message));
  }
};
