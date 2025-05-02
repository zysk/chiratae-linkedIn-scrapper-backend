import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
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
} from "../interfaces/ApiResponse";
import { ErrorMessages, SuccessMessages } from "../helpers/Constants";

/**
 * Create a new proxy
 */
export const createProxy = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { value } = req.body;

  if (!value) {
    return next(badRequest("Proxy value (address) is required"));
  }

  try {
    const newProxy = new Proxy({
      value,
      createdBy: req.user?.id, // Assuming authorizeJwt middleware attached user
    });

    await newProxy.save();
    res.status(201).json(dataResponse(SuccessMessages.PROXY_CREATED, newProxy));
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    if (error.code === 11000) {
      // Handle duplicate proxy value
      return next(conflict("Proxy with this value already exists"));
    }
    next(serverError(error.message));
  }
};

/**
 * Get all proxies (paginated)
 */
export const getAllProxies = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const proxies = await Proxy.find().skip(skip).limit(limit);
    const total = await Proxy.countDocuments();

    res.status(200).json(
      paginatedResponse("Proxies retrieved", proxies, {
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
 * Get proxy by ID
 */
export const getProxyById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const proxy = await Proxy.findById(id);
    if (!proxy) {
      return next(notFound(ErrorMessages.PROXY_NOT_FOUND));
    }
    res.status(200).json(dataResponse("Proxy found", proxy));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Update proxy
 */
export const updateProxy = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  // Ensure value is provided if updating
  if (!updateData.value) {
    return next(badRequest("Proxy value cannot be empty"));
  }

  updateData.updatedBy = req.user?.id;

  try {
    const updatedProxy = await Proxy.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProxy) {
      return next(notFound(ErrorMessages.PROXY_NOT_FOUND));
    }

    res
      .status(200)
      .json(dataResponse(SuccessMessages.PROXY_UPDATED, updatedProxy));
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    if (error.code === 11000) {
      // Handle duplicate proxy value
      return next(conflict("Proxy with this value already exists"));
    }
    next(serverError(error.message));
  }
};

/**
 * Delete proxy
 */
export const deleteProxy = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    const deletedProxy = await Proxy.findByIdAndRemove(id);
    if (!deletedProxy) {
      return next(notFound(ErrorMessages.PROXY_NOT_FOUND));
    }
    res.status(200).json(successResponse(SuccessMessages.PROXY_DELETED));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Verify proxy (placeholder)
 */
export const verifyProxy = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;
  // TODO: Implement proxy verification logic
  // (e.g., try making a request through the proxy)
  console.log(`Verification requested for proxy ID: ${id}`);
  next(serverError("Proxy verification not yet implemented"));
};

/**
 * Import proxies (placeholder)
 */
export const importProxies = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // TODO: Implement logic to parse and bulk insert proxies (e.g., from CSV/text)
  console.log("Proxy import requested");
  next(serverError("Proxy import not yet implemented"));
};
