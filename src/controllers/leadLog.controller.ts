import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import LeadLog from "../models/LeadLog.model";
import Lead from "../models/Lead.model"; // To verify lead ownership
import { badRequest, notFound, serverError } from "../helpers/ErrorHandler";
import { dataResponse, paginatedResponse } from "../interfaces/ApiResponse";
import { ErrorMessages } from "../helpers/Constants";
import { IUserDocument } from "../models/User.model";

// Helper to check if user can access the lead (via campaign ownership)
// Duplicated from leadComment.controller - consider moving to a shared helper/service
const canAccessLead = async (
  userId: string,
  leadId: string,
): Promise<boolean> => {
  const lead = await Lead.findById(leadId).populate("campaignId", "createdBy");
  if (!lead || !lead.campaignId) return false;
  return (lead.campaignId as any).createdBy?.toString() === userId;
};

/**
 * Get logs for a specific lead (paginated).
 */
export const getLeadLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { leadId } = req.params;
  const userId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  if (!leadId || !userId || !mongoose.Types.ObjectId.isValid(leadId)) {
    return next(badRequest("Valid Lead ID is required"));
  }

  try {
    // Check if user can access this lead
    if (!(await canAccessLead(userId, leadId))) {
      return next(notFound(ErrorMessages.LEAD_NOT_FOUND));
    }

    const query = { leadId: leadId };
    const logs = await LeadLog.find(query)
      .sort({ createdAt: -1 }) // Show newest first
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstName lastName email"); // Show who performed the action, if applicable

    const total = await LeadLog.countDocuments(query);

    res.status(200).json(
      paginatedResponse("Logs retrieved", logs, {
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
 * Get a single log entry by its ID.
 * (Less common use case, but included for completeness)
 */
export const getLogById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!id || !userId || !mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest("Valid Log ID is required"));
  }

  try {
    const logEntry = await LeadLog.findById(id).populate(
      "userId",
      "firstName lastName email",
    );
    if (!logEntry) {
      return next(notFound("Log entry not found"));
    }

    // Check if user can access the lead this log belongs to
    if (!(await canAccessLead(userId, logEntry.leadId.toString()))) {
      return next(notFound("Log entry not found")); // Treat as not found
    }

    res.status(200).json(dataResponse("Log entry found", logEntry));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Helper function to create a LeadLog entry.
 * Should be called internally by services/controllers performing actions.
 *
 * @param leadId - ID of the lead the log pertains to.
 * @param action - String describing the action (e.g., 'STATUS_UPDATED').
 * @param details - Optional details about the action.
 * @param userId - Optional ID of the user performing the action.
 * @param previousValue - Optional previous value of a changed field.
 * @param newValue - Optional new value of a changed field.
 */
export const createLeadLogEntry = async (
  leadId: string | mongoose.Types.ObjectId,
  action: string,
  details?: string,
  userId?: string | mongoose.Types.ObjectId,
  previousValue?: any,
  newValue?: any,
): Promise<void> => {
  try {
    const logEntry = new LeadLog({
      leadId,
      action,
      details,
      userId,
      previousValue,
      newValue,
      timestamp: new Date(),
    });
    await logEntry.save();
  } catch (error) {
    console.error(
      `Failed to create lead log entry for lead ${leadId}, action ${action}:`,
      error,
    );
    // Decide if this error should be surfaced or just logged
  }
};

// Note: Creating logs is typically handled within other controllers/services
// where the action occurs (e.g., updateLead status change).
