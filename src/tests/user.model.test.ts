import mongoose from 'mongoose';
import User, { IUser } from '../models/user.model';
import { rolesObj } from '../utils/constants';

// Mock mongoose and its methods
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');

  return {
    ...originalModule,
    connect: jest.fn(),
    model: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn()
    })
  };
});

// Mock bcryptjs for password hashing
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true)
}));

describe('User Model', () => {
  let userInstance: any;

  beforeEach(() => {
    userInstance = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: rolesObj.USER,
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true)
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Schema Validation', () => {
    it('should validate a valid user', () => {
      const user = new User(userInstance);
      const validationError = user.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should validate email format', () => {
      userInstance.email = 'invalid-email';
      const user = new User(userInstance);
      const validationError = user.validateSync();
      expect(validationError).toBeDefined();
    });

    it('should require a name', () => {
      userInstance.name = '';
      const user = new User(userInstance);
      const validationError = user.validateSync();
      expect(validationError).toBeDefined();
    });

    it('should validate role enum values', () => {
      userInstance.role = 'INVALID_ROLE';
      const user = new User(userInstance);
      const validationError = user.validateSync();
      expect(validationError).toBeDefined();
    });
  });

  describe('User Methods', () => {
    it('should compare password correctly', async () => {
      const user = new User(userInstance);
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });
  });
});

// Note: These tests are basic and would need to be expanded for a real application
// They would also need proper database connection handling for integration tests
