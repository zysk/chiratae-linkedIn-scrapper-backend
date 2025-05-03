import jwt from "jsonwebtoken";
import { config } from "../config/config";
import { Role } from "./Constants";
import { Logger } from "../services/logger.service";

const logger = new Logger('JWT');

/**
 * Interface for token payload
 */
export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
  [key: string]: any;
}

/**
 * Interface for refresh token payload
 */
export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

/**
 * Generate JWT access token
 *
 * @param payload - Token payload
 * @returns Generated JWT token
 */
export const generateAccessJwt = (payload: TokenPayload): string => {
  try {
    // @ts-ignore - Ignoring type checking for this call
    return jwt.sign(payload, config.ACCESS_TOKEN_SECRET, {
      expiresIn: config.ACCESS_TOKEN_LIFE,
    });
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw error;
  }
};

/**
 * Generate refresh token for token refreshing
 *
 * @param userId - User ID
 * @param tokenVersion - Token version for invalidating old refresh tokens
 * @returns Generated refresh token
 */
export const generateRefreshJwt = (userId: string, tokenVersion: number = 0): string => {
  try {
    // @ts-ignore - Ignoring type checking for this call
    return jwt.sign(
      { userId, tokenVersion },
      config.REFRESH_TOKEN_SECRET || config.ACCESS_TOKEN_SECRET,
      {
        expiresIn: config.REFRESH_TOKEN_LIFE || '7d', // Default to 7 days if not specified
      }
    );
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw error;
  }
};

/**
 * Verify JWT token
 *
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyJwt = (token: string): TokenPayload | null => {
  try {
    // @ts-ignore - Ignoring type checking for this call
    const decoded = jwt.verify(
      token,
      config.ACCESS_TOKEN_SECRET,
    ) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 *
 * @param token - Refresh token to verify
 * @returns Decoded refresh token payload or null if invalid
 */
export const verifyRefreshJwt = (token: string): RefreshTokenPayload | null => {
  try {
    // @ts-ignore - Ignoring type checking for this call
    const decoded = jwt.verify(
      token,
      config.REFRESH_TOKEN_SECRET || config.ACCESS_TOKEN_SECRET
    ) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from request Authorization header
 *
 * @param authHeader - Authorization header value
 * @returns Extracted token or null if not found
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1];
};

export default {
  generateAccessJwt,
  generateRefreshJwt,
  verifyJwt,
  verifyRefreshJwt,
  extractTokenFromHeader,
};
