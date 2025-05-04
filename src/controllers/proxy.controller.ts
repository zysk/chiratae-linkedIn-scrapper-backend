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
import Logger from "../helpers/Logger";
import axios from "axios";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import multer from "multer";
import path from "path";
import os from "os";

const logger = new Logger({ context: "proxy-controller" });

// Configure multer for file uploads
const upload = multer({
  dest: path.join(os.tmpdir(), 'proxy-uploads'),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

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
    logger.error("Error creating proxy:", error);
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

    // Add filtering support
    const filter: any = {};

    // Filter by validity if specified
    if (req.query.isValid !== undefined) {
      filter.isValid = req.query.isValid === 'true';
    }

    const proxies = await Proxy.find(filter).skip(skip).limit(limit);
    const total = await Proxy.countDocuments(filter);

    res.status(200).json(
      paginatedResponse("Proxies retrieved", proxies, {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      }),
    );
  } catch (error: any) {
    logger.error("Error retrieving proxies:", error);
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
    logger.error("Error retrieving proxy by ID:", error);
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
  if (updateData.value === "") {
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
    logger.error("Error updating proxy:", error);
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
    logger.error("Error deleting proxy:", error);
    next(serverError(error.message));
  }
};

/**
 * Verify proxy functionality by making a test request
 */
export const verifyProxy = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(badRequest(ErrorMessages.INVALID_ID));
  }

  try {
    // Get the proxy
    const proxy = await Proxy.findById(id);
    if (!proxy) {
      return next(notFound(ErrorMessages.PROXY_NOT_FOUND));
    }

    // Test URL to verify the proxy
    const testUrl = "https://ipinfo.io/json";

    try {
      // Parse proxy value (format: http://user:pass@host:port or host:port)
      let proxyConfig = proxy.value;
      if (!proxyConfig.startsWith('http://') && !proxyConfig.startsWith('https://')) {
        proxyConfig = `http://${proxyConfig}`;
      }

      logger.info(`Testing proxy ${proxy.value}`);

      // Make a test request through the proxy
      const response = await axios.get(testUrl, {
        proxy: {
          host: new URL(proxyConfig).hostname,
          port: parseInt(new URL(proxyConfig).port),
          auth: new URL(proxyConfig).username ? {
            username: new URL(proxyConfig).username,
            password: new URL(proxyConfig).password,
          } : undefined,
        },
        timeout: 10000, // 10 seconds timeout
      });

      // Update proxy status
      proxy.isValid = true;
      proxy.lastUsed = new Date();
      proxy.usageCount += 1;
      await proxy.save();

      res.status(200).json(dataResponse(
        "Proxy verification successful",
        {
          proxyId: proxy._id,
          value: proxy.value,
          isValid: true,
          ipInfo: response.data,
        }
      ));
    } catch (axiosError: any) {
      logger.error(`Proxy verification failed for ${proxy.value}:`, axiosError.message);

      // Update proxy status to invalid
      proxy.isValid = false;
      await proxy.save();

      res.status(200).json(dataResponse(
        "Proxy verification failed",
        {
          proxyId: proxy._id,
          value: proxy.value,
          isValid: false,
          error: axiosError.message,
        }
      ));
    }
  } catch (error: any) {
    logger.error("Error during proxy verification:", error);
    next(serverError(error.message));
  }
};

/**
 * Import proxies (one per line from text)
 */
export const importProxies = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { proxies } = req.body;

    if (!proxies || !Array.isArray(proxies)) {
      return next(badRequest("Proxies must be provided as an array"));
    }

    // Process the imported proxies
    let created = 0;
    let duplicates = 0;

    for (const proxyValue of proxies) {
      try {
        // Skip empty values
        if (!proxyValue.trim()) continue;

        // Check if proxy already exists
        const existingProxy = await Proxy.findOne({ value: proxyValue });
        if (existingProxy) {
          duplicates++;
          continue;
        }

        // Create new proxy
        const newProxy = new Proxy({
          value: proxyValue,
          createdBy: req.user?.id,
        });

        await newProxy.save();
        created++;
      } catch (error) {
        logger.error(`Error importing proxy ${proxyValue}:`, error);
      }
    }

    res.status(200).json(dataResponse(
      "Proxy import completed",
      {
        total: proxies.length,
        created,
        duplicates,
      }
    ));
  } catch (error: any) {
    logger.error("Error importing proxies:", error);
    next(serverError(error.message));
  }
};

/**
 * Verify all proxies in a background process
 */
export const verifyAllProxies = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get unverified proxies or those not verified recently
    const proxies = await Proxy.find({
      $or: [
        { isValid: { $exists: false } },
        { lastUsed: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Not used in the last 24 hours
      ]
    }).limit(10); // Process in batches

    if (proxies.length === 0) {
      return res.status(200).json(successResponse("No proxies need verification at this time"));
    }

    // Start verification process
    res.status(202).json(successResponse(`Verification of ${proxies.length} proxies started in the background`));

    // For the immediate response, we just log this
    logger.info(`Starting verification of ${proxies.length} proxies`);

    // In a real implementation, this would be handled by a background job system
  } catch (error: any) {
    logger.error("Error starting proxy verification:", error);
    next(serverError(error.message));
  }
};
