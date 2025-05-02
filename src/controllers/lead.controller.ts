import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Lead from "../models/Lead.model";
import User from "../models/User.model";
import Campaign from "../models/Campaign.model";
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
} from "../interfaces/ApiResponse";
import {
  ErrorMessages,
  SuccessMessages,
  leadStatusObj,
  ratingObj,
  Role,
} from "../helpers/Constants";
import { createLeadLogEntry } from "./leadLog.controller"; // Import the log creation function
import { sendLeadStatusChangeEmail } from "../services/email.service"; // Import the email service

/**
 * Get leads with filtering and pagination.
 */
export const getLeads = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filters
    const { campaignId, assignedToId, status, rating, searchTerm } = req.query;
    const query: any = {};

    // Filter by campaign if provided and valid
    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId as string)) {
      // Ensure the user has access to this campaign (assuming leads are tied to user via campaign)
      const campaign = await Campaign.findOne({
        _id: campaignId,
        createdBy: req.user?.id,
      });
      if (!campaign) {
        return next(notFound("Campaign not found or access denied"));
      }
      query.campaignId = campaignId;
    } else {
      // If no specific campaign, only show leads from campaigns created by the user
      const userCampaigns = await Campaign.find({
        createdBy: req.user?.id,
      }).select("_id");
      query.campaignId = { $in: userCampaigns.map((c) => c._id) };
    }

    // Filter by assigned user if provided and valid
    if (
      assignedToId &&
      mongoose.Types.ObjectId.isValid(assignedToId as string)
    ) {
      query.leadAssignedToId = assignedToId;
    }

    // Filter by status if provided and valid
    if (
      status &&
      Object.values(leadStatusObj).includes(
        status as (typeof leadStatusObj)[keyof typeof leadStatusObj],
      )
    ) {
      query.status = status;
    }

    // Filter by rating if provided and valid
    if (
      rating &&
      Object.values(ratingObj).includes(
        rating as (typeof ratingObj)[keyof typeof ratingObj],
      )
    ) {
      query.rating = rating;
    }

    // Search term filter (searches name, title, company in profileData)
    if (searchTerm && typeof searchTerm === "string") {
      const searchRegex = new RegExp(searchTerm, "i"); // Case-insensitive regex
      query.$or = [
        { "profileData.name": searchRegex },
        { "profileData.title": searchRegex },
        { "profileData.experience.company": searchRegex }, // Search within experience array
        { "profileData.experience.title": searchRegex }, // Search within experience array
      ];
    }

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("campaignId", "name")
      .populate("leadAssignedToId", "firstName lastName email");

    const total = await Lead.countDocuments(query);

    res.status(200).json(
      paginatedResponse("Leads retrieved", leads, {
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
 * Get a single lead by ID.
 */
export const getLeadById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const lead = await Lead.findById(id)
      .populate("campaignId", "name createdBy") // Populate necessary campaign fields
      .populate("leadAssignedToId", "firstName lastName email");

    if (!lead) {
      return next(notFound(ErrorMessages.LEAD_NOT_FOUND));
    }

    // Authorization Check: Ensure user created the campaign this lead belongs to
    // Need to check the populated campaign's createdBy field
    if (
      lead.campaignId &&
      (lead.campaignId as any).createdBy?.toString() !== req.user?.id
    ) {
      return next(notFound(ErrorMessages.LEAD_NOT_FOUND)); // Treat as not found for security
    }

    res.status(200).json(dataResponse("Lead found", lead));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Manually create a lead (distinct from scraping).
 */
export const createManualLead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const {
    clientId,
    campaignId,
    status,
    rating,
    profileData,
    leadAssignedToId,
  } = req.body;

  if (!clientId || !campaignId) {
    return next(
      badRequest("Client ID (profile URL/ID) and Campaign ID are required"),
    );
  }
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    return next(badRequest("Invalid Campaign ID format"));
  }

  try {
    // Verify campaign exists and belongs to user
    const campaign = await Campaign.findOne({
      _id: campaignId,
      createdBy: req.user?.id,
    });
    if (!campaign) {
      return next(notFound("Campaign not found or access denied"));
    }

    // Check if lead already exists for this profileId
    const existingLead = await Lead.findOne({ clientId });
    if (existingLead) {
      return next(conflict("Lead with this Client ID already exists"));
    }

    const newLead = new Lead({
      clientId,
      campaignId,
      status: status || leadStatusObj.CREATED,
      rating: rating || ratingObj.MEDIUM,
      profileData,
      leadAssignedToId,
      isSearched: !!profileData, // Mark as searched if profile data is provided
      createdBy: req.user?.id,
    });

    await newLead.save();

    // Create a log entry for lead creation
    await createLeadLogEntry(
      newLead._id,
      "LEAD_CREATED",
      "Lead manually created",
      req.user?.id,
    );

    res.status(201).json(dataResponse(SuccessMessages.LEAD_CREATED, newLead));
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    if (error.code === 11000) {
      return next(conflict("Lead with this Client ID already exists"));
    }
    next(serverError(error.message));
  }
};

/**
 * Update lead details (status, assignment, rating).
 */
export const updateLead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  const { status, leadAssignedToId, rating } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  const updateData: any = {};
  if (status && Object.values(leadStatusObj).includes(status)) {
    updateData.status = status;
  }
  if (leadAssignedToId !== undefined) {
    // Allow unassignment by passing null
    if (
      leadAssignedToId !== null &&
      !mongoose.Types.ObjectId.isValid(leadAssignedToId)
    ) {
      return next(badRequest("Invalid Assigned User ID format"));
    }
    // Verify assigned user exists (optional, depends on requirements)
    if (leadAssignedToId !== null) {
      const assignedUser = await User.findById(leadAssignedToId);
      if (!assignedUser) return next(notFound("Assigned user not found"));
    }
    updateData.leadAssignedToId = leadAssignedToId;
  }
  if (rating && Object.values(ratingObj).includes(rating)) {
    updateData.rating = rating;
  }

  // Prevent direct modification of other fields like profileData, campaignId, clientId
  delete updateData.profileData;
  delete updateData.campaignId;
  delete updateData.clientId;
  delete updateData.isSearched;
  delete updateData.createdBy;

  if (Object.keys(updateData).length === 0) {
    return next(badRequest("No valid fields provided for update"));
  }

  updateData.updatedBy = req.user?.id;

  try {
    // Find the lead first to check ownership via campaign
    const lead = await Lead.findById(id).populate("campaignId", "createdBy");
    if (!lead) {
      return next(notFound(ErrorMessages.LEAD_NOT_FOUND));
    }
    if (
      lead.campaignId &&
      (lead.campaignId as any).createdBy?.toString() !== req.user?.id
    ) {
      return next(notFound(ErrorMessages.LEAD_NOT_FOUND)); // Treat as not found
    }

    // Now perform the update
    const updatedLead = await Lead.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("campaignId", "name")
      .populate("leadAssignedToId", "firstName lastName email");

    // Note: updatedLead should not be null here because we found it above

    // Create log entries for each changed field
    if (updateData.status && updateData.status !== lead.status) {
      await createLeadLogEntry(
        id,
        "STATUS_CHANGED",
        `Lead status updated from ${lead.status} to ${updateData.status}`,
        req.user?.id,
        lead.status,
        updateData.status,
      );

      // Send email notification for status change
      sendLeadStatusChangeEmail(id, lead.status, updateData.status).catch(
        (err) => console.error("Failed to send status change email:", err),
      );
    }

    if (
      updateData.leadAssignedToId !== undefined &&
      String(updateData.leadAssignedToId) !== String(lead.leadAssignedToId)
    ) {
      await createLeadLogEntry(
        id,
        "ASSIGNED_USER_CHANGED",
        `Lead assignment updated`,
        req.user?.id,
        lead.leadAssignedToId ? lead.leadAssignedToId.toString() : "None",
        updateData.leadAssignedToId
          ? updateData.leadAssignedToId.toString()
          : "None",
      );
    }

    if (updateData.rating && updateData.rating !== lead.rating) {
      await createLeadLogEntry(
        id,
        "RATING_CHANGED",
        `Lead rating updated from ${lead.rating} to ${updateData.rating}`,
        req.user?.id,
        lead.rating,
        updateData.rating,
      );
    }

    // Send email notification
    await sendLeadStatusChangeEmail(lead, updatedLead);

    res
      .status(200)
      .json(dataResponse(SuccessMessages.LEAD_UPDATED, updatedLead));
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    next(serverError(error.message));
  }
};

/**
 * Delete a lead.
 */
export const deleteLead = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    // Find the lead first to check ownership via campaign
    const lead = await Lead.findById(id).populate("campaignId", "createdBy");
    if (!lead) {
      return next(notFound(ErrorMessages.LEAD_NOT_FOUND));
    }
    if (
      lead.campaignId &&
      (lead.campaignId as any).createdBy?.toString() !== req.user?.id
    ) {
      return next(notFound(ErrorMessages.LEAD_NOT_FOUND)); // Treat as not found
    }

    // Create a log entry before deleting the lead
    await createLeadLogEntry(
      id,
      "LEAD_DELETED",
      `Lead deleted: ${lead.clientId}`,
      req.user?.id,
    );

    // Perform deletion
    await Lead.findByIdAndRemove(id);

    // TODO: Consider cleanup - remove from Campaign.resultsArr? Delete comments/logs?

    res.status(200).json(successResponse(SuccessMessages.LEAD_DELETED));
  } catch (error: any) {
    next(serverError(error.message));
  }
};
