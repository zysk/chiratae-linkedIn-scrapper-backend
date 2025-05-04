import request from 'supertest';
import mongoose from 'mongoose';
import User from '../models/user.model';
import { hashPassword } from '../utils/auth.utils';
import { rolesObj } from '../utils/constants';
import { createServer } from '../server';

// Get the app but don't start listening (for testing)
const app = createServer();
const PORT = process.env.PORT || 4000; // Update to match the server port

describe('Authentication Endpoints', () => {
  let testUserId: string;
  let testUserEmail = 'testauth@example.com';
  let testUserPassword = 'password123';
  let accessToken: string;
  let refreshToken: string;

  // Connect to the test database before tests
  beforeAll(async () => {
    // Use a separate test database
    const dbUrl = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/chiratae-scraper-test';
    await mongoose.connect(dbUrl);

    // Clear users collection before tests
    await User.deleteMany({});
  });

  // Disconnect after tests
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Test registration
  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: testUserEmail,
          password: testUserPassword,
          phone: 1234567890
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');

      // Verify user was created in the database
      const user = await User.findOne({ email: testUserEmail });
      expect(user).toBeTruthy();
      expect(user?.name).toBe('Test User');
      expect(user?.role).toBe(rolesObj.USER);
      expect(user?.isActive).toBe(true);

      // Save user ID for later tests
      if (user) {
        testUserId = user._id.toString();
      }
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Duplicate User',
          email: testUserEmail,
          password: 'anotherpassword',
          phone: 9876543210
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // Test login
  describe('POST /api/users/login', () => {
    it('should login a user and return tokens', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: testUserEmail,
          password: testUserPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('name', 'Test User');
      expect(res.body.user).toHaveProperty('email', testUserEmail);

      // Save tokens for subsequent tests
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: testUserEmail,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test token refresh
  describe('POST /api/users/refreshToken', () => {
    it('should refresh the access token', async () => {
      const res = await request(app)
        .post('/api/users/refreshToken')
        .send({
          refreshToken: refreshToken
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();

      // Update tokens for subsequent tests
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should reject with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/users/refreshToken')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test authenticated routes
  describe('GET /api/users/me', () => {
    it('should return the current user profile', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', testUserId);
      expect(res.body.data).toHaveProperty('name', 'Test User');
      expect(res.body.data).toHaveProperty('email', testUserEmail);
    });

    it('should reject requests without authentication', async () => {
      const res = await request(app)
        .get('/api/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test profile updates
  describe('PATCH /api/users/me/update', () => {
    it('should update the current user profile', async () => {
      const res = await request(app)
        .patch('/api/users/me/update')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Test User',
          phone: 5551234567
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Updated Test User');
      expect(res.body.data).toHaveProperty('phone', 5551234567);
    });
  });

  // Test unauthorized access to admin routes
  describe('Admin Routes Access Control', () => {
    it('should deny regular users access to admin routes', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
