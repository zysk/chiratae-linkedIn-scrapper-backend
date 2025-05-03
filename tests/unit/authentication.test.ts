import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  generateAccessJwt,
  generateRefreshJwt,
  verifyJwt,
  verifyRefreshJwt,
  TokenPayload,
  RefreshTokenPayload
} from '../../src/helpers/Jwt';
import User, { IUserDocument } from '../../src/models/User.model';
import { config } from '../../src/config/config';
import { rolesObj } from '../../src/helpers/Constants';

// Mock mongoose
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    connect: jest.fn().mockResolvedValue({}),
    model: jest.fn().mockReturnValue({
      findById: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    }),
    Schema: originalModule.Schema,
  };
});

// Mock User model
jest.mock('../../src/models/User.model', () => {
  const mockUserDocument = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    password: '$2a$10$T/s4rULwobvs2veIoJocwefZjq1P2WrRxQ8DsK36vep9cZGRJJEYO', // hashed version of 'password123'
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    isActive: true,
    tokenVersion: 0,
    comparePassword: jest.fn().mockImplementation(function(this: any, candidatePassword: string) {
      return bcrypt.compare(candidatePassword, this.password);
    }),
    save: jest.fn().mockResolvedValue(true)
  };

  return {
    __esModule: true,
    default: {
      findOne: jest.fn().mockResolvedValue(mockUserDocument),
      findById: jest.fn().mockResolvedValue(mockUserDocument),
      findByEmail: jest.fn().mockResolvedValue(mockUserDocument),
    },
    // Mock interfaces for TypeScript
    IUserDocument: {},
  };
});

describe('Authentication System', () => {
  // Setup before tests
  beforeAll(() => {
    // Set test environment variables
    process.env.ACCESS_TOKEN_SECRET = 'test_access_secret';
    process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
  });

  // Clean up after tests
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Password Hashing', () => {
    it('should correctly hash a password', async () => {
      const password = 'password123';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      // Verify the hash is different from the original password
      expect(hash).not.toBe(password);

      // Verify the hash can be correctly verified with the original password
      const isMatch = await bcrypt.compare(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'password123';
      const wrongPassword = 'wrong_password';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      // Verify the wrong password does not match the hash
      const isMatch = await bcrypt.compare(wrongPassword, hash);
      expect(isMatch).toBe(false);
    });

    it('should correctly compare passwords in the User model', async () => {
      const user = await User.findOne({ email: 'test@example.com' }) as IUserDocument;

      // Mock the comparePassword method to use the actual bcrypt.compare
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);

      const isWrongMatch = await user.comparePassword('wrong_password');
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    it('should generate a valid access token', () => {
      const payload: TokenPayload = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: rolesObj.USER
      };

      const token = generateAccessJwt(payload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // Verify token structure (split by dots)
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    it('should generate a valid refresh token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const tokenVersion = 0;

      const token = generateRefreshJwt(userId, tokenVersion);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // Verify token structure
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    it('should correctly verify a valid access token', () => {
      const payload: TokenPayload = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: rolesObj.USER
      };

      const token = generateAccessJwt(payload);
      const decoded = verifyJwt(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.id).toBe(payload.id);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
    });

    it('should correctly verify a valid refresh token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const tokenVersion = 0;

      const token = generateRefreshJwt(userId, tokenVersion);
      const decoded = verifyRefreshJwt(token);

      expect(decoded).toBeTruthy();
      expect(decoded?.userId).toBe(userId);
      expect(decoded?.tokenVersion).toBe(tokenVersion);
    });

    it('should reject an invalid token', () => {
      const invalidToken = 'invalid.token.string';

      const decodedAccess = verifyJwt(invalidToken);
      expect(decodedAccess).toBeNull();

      const decodedRefresh = verifyRefreshJwt(invalidToken);
      expect(decodedRefresh).toBeNull();
    });
  });
});