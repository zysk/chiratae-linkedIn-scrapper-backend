import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to restrict access to admin users only
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if the request has been authenticated and has a user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Check if the user has admin role
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    // If user is admin, continue
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to restrict access to admin or other specified roles
 * @param roles - Array of roles that are allowed to access
 */
export const roleBasedAccess = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if the request has been authenticated and has a user
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Check if the user has one of the allowed roles
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access restricted to ${roles.join(', ')}`,
        });
      }

      // If user has an allowed role, continue
      next();
    } catch (error) {
      next(error);
    }
  };
};
