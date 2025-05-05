import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import Campaign, { CampaignStatus } from '../models/campaign.model';
import User from '../models/user.model';
import LinkedInAccount from '../models/linkedinAccount.model';
import Proxy from '../models/proxy.model';
import { generateToken } from '../utils/auth.utils';

let mongoServer: MongoMemoryServer;

// Mock data for testing
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123!',
  role: 'ADMIN'
};

const testLinkedInAccount = {
  username: 'linkedin_test',
  email: 'linkedin@example.com',
  password: 'securePassword123!'
};

const testProxy = {
  name: 'Test Proxy',
  host: '192.168.1.1',
  port: 8080,
  username: 'proxyuser',
  password: 'proxypass'
};

const testCampaign = {
  name: 'Test Campaign',
  searchQuery: 'Software Engineer',
  school: 'MIT',
  company: 'Google',
  pastCompany: 'Amazon',
  location: 'San Francisco',
  keywords: ['JavaScript', 'React', 'Node.js']
};

// Global variables to store generated IDs
let userId: string;
let userToken: string;
let linkedInAccountId: string;
let proxyId: string;
let campaignId: string;

// Setup and teardown functions
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Helper function to clean database between tests
const cleanDatabase = async () => {
  await User.deleteMany({});
  await LinkedInAccount.deleteMany({});
  await Proxy.deleteMany({});
  await Campaign.deleteMany({});
};

describe('Campaign API', () => {
  // Setup test data before each test
  beforeEach(async () => {
    await cleanDatabase();

    // Create a test user
    const userResponse = await request(app)
      .post('/api/users/register')
      .send(testUser);

    userId = userResponse.body.data._id;
    userToken = generateToken(userId);

    // Create a test LinkedIn account
    const linkedInAccountResponse = await request(app)
      .post('/api/linkedin-accounts')
      .set('Authorization', `Bearer ${userToken}`)
      .send(testLinkedInAccount);

    linkedInAccountId = linkedInAccountResponse.body.data._id;

    // Create a test proxy
    const proxyResponse = await request(app)
      .post('/api/proxies')
      .set('Authorization', `Bearer ${userToken}`)
      .send(testProxy);

    proxyId = proxyResponse.body.data._id;
  });

  describe('POST /api/campaigns', () => {
    test('should create a new campaign', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...testCampaign,
          linkedInAccountId,
          proxyId
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(testCampaign.name);
      expect(response.body.data.searchQuery).toBe(testCampaign.searchQuery);
      expect(response.body.data.status).toBe(CampaignStatus.CREATED);

      // Store the campaign ID for later tests
      campaignId = response.body.data._id;
    });

    test('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Incomplete Campaign'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .send({
          ...testCampaign,
          linkedInAccountId,
          proxyId
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/campaigns', () => {
    beforeEach(async () => {
      // Create a test campaign
      const campaignData = {
        ...testCampaign,
        linkedInAccountId,
        proxyId,
        createdBy: userId
      };

      const campaign = new Campaign(campaignData);
      await campaign.save();
      campaignId = campaign._id.toString();
    });

    test('should get all campaigns', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('should filter campaigns by status', async () => {
      const response = await request(app)
        .get(`/api/campaigns?status=${CampaignStatus.CREATED}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every((campaign: any) => campaign.status === CampaignStatus.CREATED)).toBe(true);
    });
  });

  describe('GET /api/campaigns/:id', () => {
    beforeEach(async () => {
      // Create a test campaign
      const campaignData = {
        ...testCampaign,
        linkedInAccountId,
        proxyId,
        createdBy: userId
      };

      const campaign = new Campaign(campaignData);
      await campaign.save();
      campaignId = campaign._id.toString();
    });

    test('should get a campaign by ID', async () => {
      const response = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(campaignId);
      expect(response.body.data.name).toBe(testCampaign.name);
    });

    test('should return 404 for non-existent campaign ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/campaigns/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/campaigns/:id', () => {
    beforeEach(async () => {
      // Create a test campaign
      const campaignData = {
        ...testCampaign,
        linkedInAccountId,
        proxyId,
        createdBy: userId
      };

      const campaign = new Campaign(campaignData);
      await campaign.save();
      campaignId = campaign._id.toString();
    });

    test('should update a campaign', async () => {
      const updatedData = {
        name: 'Updated Campaign Name',
        searchQuery: 'Updated Search Query'
      };

      const response = await request(app)
        .put(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatedData.name);
      expect(response.body.data.searchQuery).toBe(updatedData.searchQuery);
      // Ensure other fields remain unchanged
      expect(response.body.data.school).toBe(testCampaign.school);
    });
  });

  describe('DELETE /api/campaigns/:id', () => {
    beforeEach(async () => {
      // Create a test campaign
      const campaignData = {
        ...testCampaign,
        linkedInAccountId,
        proxyId,
        createdBy: userId
      };

      const campaign = new Campaign(campaignData);
      await campaign.save();
      campaignId = campaign._id.toString();
    });

    test('should delete a campaign', async () => {
      const response = await request(app)
        .delete(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(204);

      // Verify campaign is deleted
      const checkResponse = await request(app)
        .get(`/api/campaigns/${campaignId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(checkResponse.status).toBe(404);
    });
  });

  describe('POST /api/campaigns/queue', () => {
    beforeEach(async () => {
      // Create a test campaign
      const campaignData = {
        ...testCampaign,
        linkedInAccountId,
        proxyId,
        createdBy: userId
      };

      const campaign = new Campaign(campaignData);
      await campaign.save();
      campaignId = campaign._id.toString();
    });

    test('should add a campaign to execution queue', async () => {
      const scheduleDate = new Date();
      scheduleDate.setDate(scheduleDate.getDate() + 1); // Tomorrow

      const response = await request(app)
        .post('/api/campaigns/queue')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          campaignId,
          scheduledFor: scheduleDate.toISOString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduledFor).toBeTruthy();
    });

    test('should return 404 for non-existent campaign ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post('/api/campaigns/queue')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          campaignId: fakeId
        });

      expect(response.status).toBe(404);
    });
  });
});
