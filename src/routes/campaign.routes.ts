import express from 'express';
import {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  addCampaignToQueue,
  getCampaignResults,
  searchLinkedin,
  linkedInProfileScrappingReq,
  scheduleCampaign,
  scrapeProfiles,
  getScrapeStatus,
  getLeadStatus
} from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createCampaignSchema,
  updateCampaignSchema,
  queueCampaignSchema,
  campaignFilterSchema,
  scheduleCampaignSchema
} from '../utils/validation/campaign.validation';
import { profileScrapeSchema, linkedinSearchSchema, campaignIdParamSchema } from '../utils/validation/linkedin.validation';
import { leadIdParamAltSchema } from '../utils/validation/lead.validation';

const router = express.Router();

// Apply authentication middleware to all campaign routes
router.use(authenticate);

// Campaign CRUD routes
router.route('/')
  .post(validate(createCampaignSchema), createCampaign)     // Create a new campaign
  .get(validate(campaignFilterSchema, 'query'), getCampaigns);       // Get all campaigns with filters

// Single campaign routes
router.route('/:id')
  .get(getCampaignById)     // Get a single campaign by ID
  .put(validate(updateCampaignSchema), updateCampaign)      // Update a campaign
  .delete(deleteCampaign);  // Delete a campaign

// Campaign queue management
router.post('/queue', validate(queueCampaignSchema), addCampaignToQueue);  // Add campaign to execution queue

// Campaign results
router.get('/:id/results', getCampaignResults);  // Get campaign results

// LinkedIn search and scraping endpoints
router.post('/:id/searchLinkedin', validate(campaignIdParamSchema, 'params'), validate(linkedinSearchSchema), searchLinkedin);  // Trigger LinkedIn search
router.post('/linkedInProfileScrappingReq', validate(profileScrapeSchema), linkedInProfileScrappingReq);  // Manual LinkedIn profile scraping
router.post('/:id/scrapeProfiles', scrapeProfiles);  // Queue profiles for scraping
router.get('/:id/scrapeStatus', getScrapeStatus);  // Get profile scraping status

// Campaign scheduling endpoint
router.post('/:id/schedule', validate(scheduleCampaignSchema), scheduleCampaign);  // Schedule a campaign for future execution

// Lead status endpoint
router.route('/leads/:leadId/status')
  .get(validate(leadIdParamAltSchema, 'params'), getLeadStatus);

export default router;
