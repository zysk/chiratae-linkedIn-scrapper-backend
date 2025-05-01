import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  status?: number;
  code?: number;
}

/**
 * Global error handler middleware
 *
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error details for debugging
  console.error('Error:', err);

  // Set status code
  const statusCode = err.status || 500;

  // Send error response
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    success: false,
    // Include stack trace in development environment
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Create a custom error with status code
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @returns Custom error object
 */
export const createError = (message: string, status: number): CustomError => {
  const error: CustomError = new Error(message);
  error.status = status;
  return error;
};

/**
 * Create a 400 Bad Request error
 *
 * @param message - Error message
 * @returns Custom error object
 */
export const badRequest = (message = 'Bad Request'): CustomError => {
  return createError(message, 400);
};

/**
 * Create a 401 Unauthorized error
 *
 * @param message - Error message
 * @returns Custom error object
 */
export const unauthorized = (message = 'Unauthorized'): CustomError => {
  return createError(message, 401);
};

/**
 * Create a 403 Forbidden error
 *
 * @param message - Error message
 * @returns Custom error object
 */
export const forbidden = (message = 'Forbidden'): CustomError => {
  return createError(message, 403);
};

/**
 * Create a 404 Not Found error
 *
 * @param message - Error message
 * @returns Custom error object
 */
export const notFound = (message = 'Not Found'): CustomError => {
  return createError(message, 404);
};

/**
 * Create a 409 Conflict error
 *
 * @param message - Error message
 * @returns Custom error object
 */
export const conflict = (message = 'Conflict'): CustomError => {
  return createError(message, 409);
};

/**
 * Create a 500 Internal Server Error
 *
 * @param message - Error message
 * @returns Custom error object
 */
export const serverError = (message = 'Internal Server Error'): CustomError => {
  return createError(message, 500);
};