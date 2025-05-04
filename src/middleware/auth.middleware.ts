import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../utils/auth.utils';
import { CONFIG } from '../utils/config';
import User from '../models/user.model';
import { ApiError } from './errorHandler';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      userObj?: any;
    }
  }
}

/**
 * Authentication middleware to verify JWT token
 * This middleware will verify the token and populate req.user with user info
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new ApiError('Authentication required. Please log in.', 401);
    }

    // Verify the token
    const decoded = verifyToken(token, CONFIG.JWT_ACCESS_TOKEN_SECRET);

    if (!decoded) {
      throw new ApiError('Invalid or expired token. Please log in again.', 401);
    }

    // Set the user in req object
    req.user = decoded;

    // Fetch user from database to ensure they exist and are active
    if (decoded.userId) {
      const userObj = await User.findById(decoded.userId);

      if (!userObj) {
        throw new ApiError('User not found.', 401);
      }

      if (!userObj.isActive) {
        throw new ApiError('Your account is inactive. Please contact an administrator.', 403);
      }

      req.userObj = userObj;
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError('Authentication failed', 401));
    }
  }
};

/**
 * Optional authentication middleware
 * This will attempt to authenticate the user but will not fail if no token is provided
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return next();
    }

    // Verify the token
    const decoded = verifyToken(token, CONFIG.JWT_ACCESS_TOKEN_SECRET);

    if (!decoded) {
      return next();
    }

    // Set the user in req object
    req.user = decoded;

    // Fetch user from database
    if (decoded.userId) {
      const userObj = await User.findById(decoded.userId);
      if (userObj) {
        req.userObj = userObj;
      }
    }

    next();
  } catch (error) {
    // Just continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param roles Array of allowed roles
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('You do not have permission to access this resource', 403)
      );
    }

    next();
  };
};
