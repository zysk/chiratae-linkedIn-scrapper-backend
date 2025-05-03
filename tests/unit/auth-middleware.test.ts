import { Request, Response, NextFunction } from 'express';
import {
  authorizeJwt,
  isAdmin,
  hasRole,
  isSelfOrAdmin
} from '../../src/middlewares/auth.middleware';
import * as jwtHelper from '../../src/helpers/Jwt';
import { rolesObj } from '../../src/helpers/Constants';

// Mock the JWT helper functions
jest.mock('../../src/helpers/Jwt', () => ({
  verifyJwt: jest.fn(),
  extractTokenFromHeader: jest.fn(),
}));

describe('Authentication Middleware', () => {
  // Mock request, response, and next function for testing
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock<NextFunction>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup fresh mock objects
    mockRequest = {
      headers: {},
      params: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  describe('authorizeJwt Middleware', () => {
    it('should call next with unauthorized error when no token is provided', () => {
      // Mock extractTokenFromHeader to return null (no token)
      (jwtHelper.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      // Call the middleware
      authorizeJwt(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Expect next to be called with an error
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0].status).toBe(401);
      expect(nextFunction.mock.calls[0][0].message).toBe('No token provided');
    });

    it('should call next with unauthorized error when token is invalid', () => {
      // Mock extractTokenFromHeader to return a token
      (jwtHelper.extractTokenFromHeader as jest.Mock).mockReturnValue('invalid-token');

      // Mock verifyJwt to return null (invalid token)
      (jwtHelper.verifyJwt as jest.Mock).mockReturnValue(null);

      // Call the middleware
      authorizeJwt(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Expect next to be called with an error
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0].status).toBe(401);
      expect(nextFunction.mock.calls[0][0].message).toBe('Invalid or expired token');
    });

    it('should attach user to request and call next without error when token is valid', () => {
      // Mock user payload
      const userPayload = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: rolesObj.USER,
      };

      // Mock extractTokenFromHeader to return a token
      (jwtHelper.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');

      // Mock verifyJwt to return a valid payload
      (jwtHelper.verifyJwt as jest.Mock).mockReturnValue(userPayload);

      // Call the middleware
      authorizeJwt(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Expect user to be attached and next called without error
      expect(mockRequest.user).toEqual(userPayload);
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });

  describe('isAdmin Middleware', () => {
    it('should call next with unauthorized error when user is not authenticated', () => {
      // Call the middleware with no user
      isAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      // Expect next to be called with an error
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0].status).toBe(401);
      expect(nextFunction.mock.calls[0][0].message).toBe('Authentication required');
    });

    it('should call next with forbidden error when user is not an admin', () => {
      // Set user with non-admin role
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        role: rolesObj.USER,
      };

      // Call the middleware
      isAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      // Expect next to be called with a forbidden error
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0].status).toBe(403);
      expect(nextFunction.mock.calls[0][0].message).toBe('Admin access required');
    });

    it('should call next without error when user is an admin', () => {
      // Set user with admin role
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        role: rolesObj.ADMIN,
      };

      // Call the middleware
      isAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      // Expect next to be called without error
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });

  describe('hasRole Middleware', () => {
    it('should call next with unauthorized error when user is not authenticated', () => {
      // Create middleware instance with allowed roles
      const middleware = hasRole([rolesObj.ADMIN, rolesObj.USER]);

      // Call the middleware with no user
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Expect next to be called with an error
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0].status).toBe(401);
      expect(nextFunction.mock.calls[0][0].message).toBe('Authentication required');
    });

    it('should call next with forbidden error when user does not have required role', () => {
      // Set user with client role
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'client@example.com',
        role: rolesObj.CLIENT,
      };

      // Create middleware instance with admin and user roles only
      const middleware = hasRole([rolesObj.ADMIN, rolesObj.USER]);

      // Call the middleware
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Expect next to be called with a forbidden error
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0].status).toBe(403);
      expect(nextFunction.mock.calls[0][0].message).toBe('Insufficient permissions');
    });

    it('should call next without error when user has one of the required roles', () => {
      // Set user with user role
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        role: rolesObj.USER,
      };

      // Create middleware instance with admin and user roles
      const middleware = hasRole([rolesObj.ADMIN, rolesObj.USER]);

      // Call the middleware
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Expect next to be called without error
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });

  describe('isSelfOrAdmin Middleware', () => {
    it('should call next with unauthorized error when user is not authenticated', () => {
      // Create middleware instance
      const middleware = isSelfOrAdmin('id');

      // Call the middleware with no user
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Expect next to be called with an error
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0].status).toBe(401);
      expect(nextFunction.mock.calls[0][0].message).toBe('Authentication required');
    });

    it('should call next with forbidden error when user is not admin and not accessing their own resource', () => {
      // Set user with user role
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        role: rolesObj.USER,
      };

      // Set different ID in params
      mockRequest.params = { id: '507f1f77bcf86cd799439012' };

      // Create middleware instance
      const middleware = isSelfOrAdmin('id');

      // Call the middleware
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Expect next to be called with a forbidden error
      expect(nextFunction).toHaveBeenCalled();
      expect(nextFunction.mock.calls[0][0].status).toBe(403);
      expect(nextFunction.mock.calls[0][0].message).toBe('Access denied');
    });

    it('should call next without error when user is accessing their own resource', () => {
      // Set user
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        role: rolesObj.USER,
      };

      // Set the same ID in params
      mockRequest.params = { id: '507f1f77bcf86cd799439011' };

      // Create middleware instance
      const middleware = isSelfOrAdmin('id');

      // Call the middleware
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Expect next to be called without error
      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should call next without error when user is an admin regardless of the resource ID', () => {
      // Set user with admin role
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        role: rolesObj.ADMIN,
      };

      // Set different ID in params
      mockRequest.params = { id: '507f1f77bcf86cd799439012' };

      // Create middleware instance
      const middleware = isSelfOrAdmin('id');

      // Call the middleware
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Expect next to be called without error
      expect(nextFunction).toHaveBeenCalledWith();
    });
  });
});