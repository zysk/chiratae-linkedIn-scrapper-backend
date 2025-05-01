/**
 * Base API response interface
 */
export interface ApiResponse {
  success: boolean;
  message: string;
}

/**
 * API response with data
 */
export interface ApiDataResponse<T> extends ApiResponse {
  data: T;
}

/**
 * API response with error
 */
export interface ApiErrorResponse extends ApiResponse {
  error?: {
    code?: number;
    details?: string;
    stack?: string;
  };
}

/**
 * API response with pagination
 */
export interface ApiPaginatedResponse<T> extends ApiDataResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Standard API success response
 *
 * @param message - Success message
 * @returns API success response
 */
export const successResponse = (message: string): ApiResponse => {
  return {
    success: true,
    message
  };
};

/**
 * Standard API data response
 *
 * @param message - Success message
 * @param data - Response data
 * @returns API data response
 */
export const dataResponse = <T>(message: string, data: T): ApiDataResponse<T> => {
  return {
    success: true,
    message,
    data
  };
};

/**
 * Standard API error response
 *
 * @param message - Error message
 * @param errorDetails - Additional error details
 * @returns API error response
 */
export const errorResponse = (
  message: string,
  errorDetails?: {
    code?: number;
    details?: string;
    stack?: string;
  }
): ApiErrorResponse => {
  return {
    success: false,
    message,
    ...(errorDetails && { error: errorDetails })
  };
};

/**
 * Standard API paginated response
 *
 * @param message - Success message
 * @param data - Array of data items
 * @param pagination - Pagination details
 * @returns API paginated response
 */
export const paginatedResponse = <T>(
  message: string,
  data: T[],
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  }
): ApiPaginatedResponse<T> => {
  return {
    success: true,
    message,
    data,
    pagination
  };
};