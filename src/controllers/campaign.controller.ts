import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign.model";
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
    searchQuery,
    linkedInAccountId,
    proxyId,
    school,
    company,
    pastCompany,
    schedule,
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

    const newCampaign = new Campaign({
      name,
      searchQuery,
      linkedInAccountId,
      proxyId,
      school,
      company,
      pastCompany,
      schedule,
      isScheduled: !!schedule,
      createdBy: req.user?.id, // Assuming authorizeJwt middleware attached user
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
 * Get all campaigns (paginated, optionally filtered by user)
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

    // Filter by creator user ID
    const query: any = { createdBy: req.user?.id };

    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
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
      .populate("linkedInAccountId", "name")
      .populate("proxyId", "value")
      .populate("resultsArr"); // Populate lead details if needed (can be heavy)

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

  // Prevent status updates through this endpoint
  delete updateData.status;
  delete updateData.isSearched;
  delete updateData.processing;
  delete updateData.resultsArr;
  delete updateData.totalResults;
  delete updateData.lastRun;
  delete updateData.runCount;

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
    const deletedCampaign = await Campaign.findOneAndRemove({
      _id: id,
      createdBy: req.user?.id,
    });
    if (!deletedCampaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }
    // TODO: Consider deleting associated leads or handle cleanup?
    res.status(200).json(successResponse(SuccessMessages.CAMPAIGN_DELETED));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Manually start campaign search phase
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

  if (!initialDriver) {
    // Or get a driver from a pool if applicable
    return next(serverError("WebDriver not available to start campaign."));
  }

  try {
    const campaign = await Campaign.findOne({
      _id: id,
      createdBy: req.user?.id,
    });

    if (!campaign) {
      return next(notFound(ErrorMessages.CAMPAIGN_NOT_FOUND));
    }

    if (campaign.processing) {
      return next(conflict("Campaign is already processing."));
    }
    if (campaign.isSearched) {
      // Optional: Allow re-searching?
      return next(badRequest("Campaign search has already been completed."));
    }

    // Trigger the search asynchronously (don't wait for it to complete here)
    performSearch(initialDriver, campaign).catch((err) => {
      // Log error if the async function fails unexpectedly
      console.error(
        `Background search failed for campaign ${campaign._id}:`,
        err,
      );
    });

    // Respond immediately that the campaign is starting
    res.status(200).json(successResponse("Campaign search initiated."));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Stop campaign (placeholder - requires scraping logic)
 */
export const stopCampaign = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  // TODO: Implement logic to stop an in-progress campaign
  // - Find campaign by ID (check ownership)
  // - Signal the scraping process to stop (e.g., update status, use Redis flag)
  // - Update status to CANCELLED?
  console.log(`Stop requested for campaign ID: ${id}`);
  next(serverError("Stop campaign not yet implemented"));
};

/**
 * Initiate LinkedIn Login Process for a specific account
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
 * Check current LinkedIn Login Status
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
 * Submit CAPTCHA solution
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
 * Submit OTP code
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
