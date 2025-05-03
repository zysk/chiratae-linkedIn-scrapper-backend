import { Response } from 'express';

/**
 * Interface for successful API response
 */
export interface ISuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * Interface for paginated API response
 */
export interface IPaginatedResponse<T = unknown> extends ISuccessResponse<T[]> {
  meta: {
    totalCount: number;
    pageCount: number;
    currentPage: number;
    perPage: number;
  };
}

/**
 * Utility for sending standardized API responses
 */
export class ApiResponse {
  /**
   * Sends a success response
   *
   * @param res Express response object
   * @param data Response data
   * @param message Optional success message
   * @param statusCode HTTP status code (default: 200)
   * @param meta Optional metadata
   */
  public static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode = 200,
    meta?: Record<string, unknown>
  ): Response {
    const response: ISuccessResponse<T> = {
      success: true,
      data,
    };

    if (message) {
      response.message = message;
    }

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Sends a paginated response
   *
   * @param res Express response object
   * @param data Array of items for the current page
   * @param totalCount Total number of items across all pages
   * @param currentPage Current page number
   * @param perPage Number of items per page
   * @param message Optional success message
   * @param statusCode HTTP status code (default: 200)
   * @param additionalMeta Optional additional metadata
   */
  public static paginated<T>(
    res: Response,
    data: T[],
    totalCount: number,
    currentPage: number,
    perPage: number,
    message?: string,
    statusCode = 200,
    additionalMeta?: Record<string, unknown>
  ): Response {
    const pageCount = Math.ceil(totalCount / perPage);

    const response: IPaginatedResponse<T> = {
      success: true,
      data,
      meta: {
        totalCount,
        pageCount,
        currentPage,
        perPage,
        ...additionalMeta,
      },
    };

    if (message) {
      response.message = message;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Sends a created response (201)
   *
   * @param res Express response object
   * @param data Created resource data
   * @param message Optional success message
   */
  public static created<T>(
    res: Response,
    data: T,
    message = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * Sends a no content response (204)
   *
   * @param res Express response object
   */
  public static noContent(res: Response): Response {
    return res.status(204).end();
  }
}

export default ApiResponse;