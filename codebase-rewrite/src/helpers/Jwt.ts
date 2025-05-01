import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { Role } from './Constants';

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
 * Generate JWT access token
 *
 * @param payload - Token payload
 * @returns Generated JWT token
 */
export const generateAccessJwt = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.ACCESS_TOKEN_SECRET, {
    expiresIn: config.ACCESS_TOKEN_LIFE
  });
};

/**
 * Verify JWT token
 *
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyJwt = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as TokenPayload;
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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

export default {
  generateAccessJwt,
  verifyJwt,
  extractTokenFromHeader
};