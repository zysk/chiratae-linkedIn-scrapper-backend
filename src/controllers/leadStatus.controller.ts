import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import LeadStatusDef from "../models/LeadStatusDef.model";
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
import { ErrorMessages, SuccessMessages } from "../helpers/Constants";

/**
 * Create a new lead status definition
 */
export const createLeadStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { name, color, description, sortOrder } = req.body;

  if (!name) {
    return next(badRequest("Status name is required"));
  }

  try {
    const newStatus = new LeadStatusDef({
      name,
      color: color || "#808080", // Default to gray if no color specified
      description,
      sortOrder: sortOrder || 0,
      createdBy: req.user?.id,
    });

    await newStatus.save();
    res
      .status(201)
      .json(dataResponse(SuccessMessages.LEAD_STATUS_CREATED, newStatus));
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    if (error.code === 11000) {
      // Handle duplicate name
      return next(conflict("Status with this name already exists"));
    }
    next(serverError(error.message));
  }
};

/**
 * Get all lead status definitions
 */
export const getAllLeadStatuses = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const statuses = await LeadStatusDef.find()
      .sort({ sortOrder: 1, name: 1 }) // Sort by sortOrder then name
      .populate("createdBy", "firstName lastName");

    res.status(200).json(dataResponse("Lead statuses retrieved", statuses));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Get lead status definition by ID
 */
export const getLeadStatusById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const status = await LeadStatusDef.findById(id).populate(
      "createdBy",
      "firstName lastName",
    );

    if (!status) {
      return next(notFound("Lead status not found"));
    }

    res.status(200).json(dataResponse("Lead status found", status));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Update lead status definition
 */
export const updateLeadStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  const { name, color, description, sortOrder } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const updateData: any = {};
    if (name) updateData.name = name;
    if (color) updateData.color = color;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    updateData.updatedBy = req.user?.id;

    if (Object.keys(updateData).length === 1 && updateData.updatedBy) {
      return next(badRequest("No update data provided"));
    }

    const updatedStatus = await LeadStatusDef.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    )
      .populate("createdBy", "firstName lastName")
      .populate("updatedBy", "firstName lastName");

    if (!updatedStatus) {
      return next(notFound("Lead status not found"));
    }

    res
      .status(200)
      .json(dataResponse(SuccessMessages.LEAD_STATUS_UPDATED, updatedStatus));
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    if (error.code === 11000) {
      return next(conflict("Status with this name already exists"));
    }
    next(serverError(error.message));
  }
};

/**
 * Delete lead status definition
 */
export const deleteLeadStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    // First, find the status to get its name
    const statusToDelete = await LeadStatusDef.findById(id);
    if (!statusToDelete) {
      return next(notFound("Lead status not found"));
    }

    // Check if this status is in use by any leads
    const Lead = mongoose.model("Lead");
    const leadCount = await Lead.countDocuments({
      status: statusToDelete.name,
    });

    if (leadCount > 0) {
      return next(
        conflict(
          `Cannot delete this status as it is currently used by ${leadCount} lead(s). Please reassign these leads to a different status first.`,
        ),
      );
    }

    // If not in use, proceed with deletion
    const deletedStatus = await LeadStatusDef.findByIdAndRemove(id);

    res.status(200).json(successResponse(SuccessMessages.LEAD_STATUS_DELETED));
  } catch (error: any) {
    next(serverError(error.message));
  }
};
