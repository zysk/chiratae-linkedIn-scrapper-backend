import { Request, Response, NextFunction } from "express";
import { ApiError, normalizeError } from "./TypeUtils";
import { Logger } from "../services/logger.service";

const logger = new Logger("ErrorHandler");

/**
 * Global error handler middleware
 *
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Normalize error to consistent format
  const normalizedError = normalizeError(err);

  // Log error details with context
  logger.error(`${req.method} ${req.path} - ${normalizedError.message}`, {
    error: normalizedError,
    stack: normalizedError.stack,
    requestId: req.headers["x-request-id"] || "unknown",
    url: req.originalUrl,
    query: req.query,
    body: req.body
      ? typeof req.body === "object"
        ? JSON.stringify(req.body)
        : req.body
      : undefined,
    ip: req.ip,
  });

  // Set status code
  const statusCode = normalizedError.status || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    status: "error",
    message: normalizedError.message || "Internal Server Error",
    code: normalizedError.code || statusCode,
  });
};

// Common HTTP errors
export const badRequest = (message = "Bad Request"): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = 400;
  return error;
};

export const unauthorized = (message = "Unauthorized"): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = 401;
  return error;
};

export const forbidden = (message = "Forbidden"): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = 403;
  return error;
};

export const notFound = (message = "Not Found"): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = 404;
  return error;
};

export const conflict = (message = "Conflict"): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = 409;
  return error;
};

export const serverError = (message = "Internal Server Error"): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = 500;
  return error;
};

// Create specific error class for Selenium-related errors
export class SeleniumError extends Error implements ApiError {
  status: number;
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "SeleniumError";
    this.status = 500;
    this.code = code || "SELENIUM_ERROR";
  }
}

// Create error for LinkedIn detection issues
export class LinkedInDetectionError extends Error implements ApiError {
  status: number;
  code?: string;

  constructor(message: string) {
    super(message || "LinkedIn has detected the automation");
    this.name = "LinkedInDetectionError";
    this.status = 503; // Service Unavailable
    this.code = "LINKEDIN_DETECTION";
  }
}
