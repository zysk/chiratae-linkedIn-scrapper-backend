import { ApiError } from '../middleware/errorHandler';

/**
 * Extension of ApiError class with additional utility methods for common error scenarios
 */
export { ApiError };

/**
 * Create an application error with custom message and status code
 * @param message Error message
 * @param statusCode HTTP status code
 * @returns AppError instance
 */
export const createError = (message: string, statusCode: number): ApiError => {
  return new ApiError(message, statusCode);
};

/**
 * Create a validation error
 * @param message Validation error message
 * @returns AppError instance with 400 status code
 */
export const createValidationError = (message: string): ApiError => {
  return new ApiError(message, 400);
};

/**
 * Create a not found error
 * @param resource Name of the resource that was not found
 * @returns AppError instance with 404 status code
 */
export const createNotFoundError = (resource: string): ApiError => {
  return new ApiError(`${resource} not found`, 404);
};

/**
 * Create an unauthorized error
 * @param message Custom message for the unauthorized error
 * @returns AppError instance with 401 status code
 */
export const createUnauthorizedError = (message: string = 'Unauthorized'): ApiError => {
  return new ApiError(message, 401);
};

/**
 * Create a forbidden error
 * @param message Custom message for the forbidden error
 * @returns AppError instance with 403 status code
 */
export const createForbiddenError = (message: string = 'Forbidden'): ApiError => {
  return new ApiError(message, 403);
};

/**
 * Create a server error
 * @param message Custom message for the server error
 * @returns AppError instance with 500 status code
 */
export const createServerError = (message: string = 'Internal server error'): ApiError => {
  return new ApiError(message, 500);
};

/**
 * Create a conflict error
 * @param message Custom message for the conflict error
 * @returns AppError instance with 409 status code
 */
export const createConflictError = (message: string): ApiError => {
  return new ApiError(message, 409);
};