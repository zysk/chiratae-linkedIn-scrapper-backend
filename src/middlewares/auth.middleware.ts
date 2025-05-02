import { Request, Response, NextFunction } from 'express';
import { verifyJwt, extractTokenFromHeader, TokenPayload } from '../helpers/Jwt';
import { unauthorized, forbidden } from '../helpers/ErrorHandler';
import { Role, rolesObj } from '../helpers/Constants';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authorizeJwt = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      next(unauthorized('No token provided'));
      return;
    }

    // Verify token
    const decodedToken = verifyJwt(token);

    if (!decodedToken) {
      next(unauthorized('Invalid or expired token'));
      return;
    }

    // Attach user to request
    req.user = decodedToken;
    next();
  } catch (error) {
    next(unauthorized('Authentication failed'));
  }
};

/**
 * Middleware to check if user has admin role
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      next(unauthorized('Authentication required'));
      return;
    }

    if (req.user.role !== rolesObj.ADMIN) {
      next(forbidden('Admin access required'));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has specified role
 */
export const hasRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        next(unauthorized('Authentication required'));
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        next(forbidden('Insufficient permissions'));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is accessing their own resource or is an admin
 */
export const isSelfOrAdmin = (paramIdField: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        next(unauthorized('Authentication required'));
        return;
      }

      const requestedId = req.params[paramIdField];

      // Allow if user is admin or accessing their own resource
      if (req.user.role === rolesObj.ADMIN || req.user.id === requestedId) {
        next();
        return;
      }

      next(forbidden('Access denied'));
    } catch (error) {
      next(error);
    }
  };
};