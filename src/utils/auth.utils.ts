import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { CONFIG } from './config';

export interface JwtPayload {
  userId: string;
  role: string;
  name?: string;
  email?: string;
  phone?: number;
  [key: string]: any; // For any additional fields
}

/**
 * Generate JWT access token
 * @param payload Data to be encoded in the token
 * @returns Promise with the generated token
 */
export const generateAccessToken = async (payload: JwtPayload): Promise<string> => {
  const options: SignOptions = {
    expiresIn: '1D'
  };

  return jwt.sign(
    payload,
    CONFIG.JWT_ACCESS_TOKEN_SECRET,
    options
  );
};

/**
 * Generate JWT refresh token
 * @param payload Data to be encoded in the token
 * @returns Promise with the generated refresh token
 */
export const generateRefreshToken = async (payload: JwtPayload): Promise<string> => {
  const options: SignOptions = {
    expiresIn: '7D'
  };

  return jwt.sign(
    payload,
    CONFIG.JWT_REFRESH_TOKEN_SECRET,
    options
  );
};

/**
 * Generate JWT token for testing purposes
 * @param userId User ID to include in the token
 * @returns JWT token string
 */
export const generateToken = (userId: string): string => {
  const payload: JwtPayload = {
    userId,
    role: 'ADMIN' // Default to admin for testing
  };

  return jwt.sign(
    payload,
    CONFIG.JWT_ACCESS_TOKEN_SECRET,
    { expiresIn: '1D' }
  );
};

/**
 * Verify JWT token
 * @param token Token to verify
 * @param secret Secret used to verify the token
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string, secret: string): JwtPayload | null => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Hash password for storage
 * @param password Plain text password
 * @returns Promise with hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Error hashing password');
  }
};

/**
 * Compare plain text password with hashed password
 * @param plainPassword Plain text password
 * @param hashedPassword Hashed password from database
 * @returns Promise with boolean indicating if passwords match
 */
export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

/**
 * Parse and validate authorization header
 * @param authHeader Authorization header from request
 * @returns Token string or null if invalid
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split('Bearer ')[1];
};

/**
 * Validate email format
 * @param email Email to validate
 * @returns Boolean indicating if email is valid
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};
