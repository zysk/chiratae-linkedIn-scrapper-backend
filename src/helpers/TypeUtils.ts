/**
 * Type utility functions and type definitions to improve type safety.
 */

import { RequestHandler, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

/**
 * Type for custom error objects with status code
 */
export interface ApiError extends Error {
  status?: number;
  code?: number;
}

/**
 * Generic Record type with string keys and unknown values
 * Use this instead of any for objects with unknown structure
 */
export type GenericRecord = Record<string, unknown>;

/**
 * Type for handling parameters from request that may come as string or an array of strings
 */
export type StringOrStringArray = string | string[];

/**
 * Converts a parameter that might be a string, array of strings, or undefined
 * into a consistent string array format
 */
export const normalizeStringArray = (param?: StringOrStringArray): string[] => {
  if (!param) return [];
  return Array.isArray(param) ? param : [param];
};

/**
 * Safely parse JSON without throwing
 * @param str - String to parse
 * @param fallback - Fallback value if parsing fails
 */
export const safeJsonParse = <T>(str: string, fallback: T): T => {
  try {
    return JSON.parse(str) as T;
  } catch (e) {
    return fallback;
  }
};

/**
 * Type guard to check if a value is a MongooseError
 */
export const isMongooseError = (err: unknown): err is mongoose.Error => {
  return (
    err instanceof Error && "name" in err && err.name.startsWith("Mongoose")
  );
};

/**
 * Type guard to check if an error is a MongoDB duplicate key error
 */
export const isDuplicateKeyError = (err: unknown): boolean => {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
};

/**
 * Type safe express async handler that properly catches and forwards errors
 */
export const asyncHandler = <
  P = Record<string, unknown>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
>(
  fn: (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response,
    next: NextFunction,
  ) => Promise<void>,
): RequestHandler<P, ResBody, ReqBody, ReqQuery> => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Safely cast string ID to MongoDB ObjectId or null
 */
export const toObjectId = (id: string): mongoose.Types.ObjectId | null => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (e) {
    return null;
  }
};

/**
 * Type guard to check if a value is a non-null object
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

/**
 * Safely transform the error to a consistent format
 */
export const normalizeError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    return error as ApiError;
  }

  if (isObject(error) && "message" in error) {
    const apiError = new Error(error.message as string) as ApiError;
    if ("status" in error && typeof error.status === "number") {
      apiError.status = error.status;
    }
    if ("code" in error && typeof error.code === "number") {
      apiError.code = error.code;
    }
    return apiError;
  }

  return new Error(String(error)) as ApiError;
};
