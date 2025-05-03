/**
 * Custom error types for better error handling
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);

    // Set prototype explicitly for better instanceof behavior
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, unknown>;

  constructor(message: string, errors: Record<string, unknown> = {}) {
    super(message, 400);
    this.errors = errors;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error for authentication failures
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);

    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error for authorization failures
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);

    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Error for resource not found
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', id?: string | number) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;

    super(message, 404);

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error for duplicate resources
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);

    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error for service unavailability or external service failures
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable') {
    super(message, 503);

    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Error for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, false);

    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Determines if an error is an instance of AppError
 * @param error The error to check
 */
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

/**
 * Converts unknown errors to AppError instances
 * @param error Any error object
 */
export const normalizeError = (error: unknown): AppError => {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500, false);
  }

  return new AppError(String(error), 500, false);
};