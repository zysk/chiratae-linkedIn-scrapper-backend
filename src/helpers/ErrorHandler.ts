import { Request, Response } from "express";
import Logger from "./Logger";
import { ApiError, normalizeError } from "./TypeUtils";

const logger = new Logger({ context: "error-handler" });

/**
 * Global error handler middleware
 *
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
): void => {
  // Normalize error to consistent format
  const normalizedError = normalizeError(err);

  // Log error details with context
  logger.error(`${req.method} ${req.path} - ${normalizedError.message}`, {
    error: normalizedError,
    stack: normalizedError.stack,
    requestId: req.headers["x-request-id"] || "unknown",
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
