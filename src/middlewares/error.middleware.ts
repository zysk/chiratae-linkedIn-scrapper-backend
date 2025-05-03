import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError, isAppError, normalizeError } from '../utils/error-types.util';
import { Logger } from '../services/logger.service';
import { config } from '../config/config';

const logger = new Logger('ErrorMiddleware');

/**
 * Interface for the standardized error response
 */
interface IErrorResponse {
  success: false;
  error: {
    message: string;
    code: number;
    stack?: string;
    details?: unknown;
  };
}

/**
 * Handles MongoDB specific errors and converts them to AppError instances
 * @param err MongoDB error
 */
const handleMongoDBError = (err: Error): AppError => {
  if (err instanceof mongoose.Error.ValidationError) {
    return new AppError(`Validation error: ${err.message}`, 400);
  }

  if (err instanceof mongoose.Error.CastError) {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const keyPattern = (err as any).keyPattern ? Object.keys((err as any).keyPattern).join(', ') : 'field';
    return new AppError(`Duplicate value for ${keyPattern}`, 409);
  }

  return new AppError('Database operation failed', 500);
};

/**
 * Main error handling middleware
 */
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Normalize the error to our AppError type
  let normalizedError: AppError;

  if (isAppError(err)) {
    normalizedError = err;
  } else if (err instanceof mongoose.Error) {
    normalizedError = handleMongoDBError(err);
  } else {
    normalizedError = normalizeError(err);
  }

  // Log the error
  if (normalizedError.statusCode >= 500) {
    logger.error('Internal server error:', {
      error: normalizedError,
      stack: normalizedError.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    });
  } else {
    logger.warn(`Client error (${normalizedError.statusCode}):`, {
      message: normalizedError.message,
      path: req.path,
      method: req.method,
      // Only log needed data for debugging
      query: req.query,
      params: req.params,
    });
  }

  // Prepare response
  const errorResponse: IErrorResponse = {
    success: false,
    error: {
      message: normalizedError.message,
      code: normalizedError.statusCode,
    },
  };

  // Include stack trace in development mode
  if (config.NODE_ENV === 'development') {
    errorResponse.error.stack = normalizedError.stack;
  }

  // Include validation errors if available
  if ('errors' in normalizedError && normalizedError.errors) {
    errorResponse.error.details = normalizedError.errors;
  }

  // Send response
  res.status(normalizedError.statusCode).json(errorResponse);
};

/**
 * Middleware to handle 404 errors for routes that don't exist
 */
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export default { errorMiddleware, notFoundMiddleware };