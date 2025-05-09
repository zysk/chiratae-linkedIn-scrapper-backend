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
  scheduleCampaign
} from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Apply authentication middleware to all campaign routes
router.use(authenticate);

// Campaign CRUD routes
router.route('/')
  .post(createCampaign)     // Create a new campaign
  .get(getCampaigns);       // Get all campaigns with filters

// Single campaign routes
router.route('/:id')
  .get(getCampaignById)     // Get a single campaign by ID
  .put(updateCampaign)      // Update a campaign
  .delete(deleteCampaign);  // Delete a campaign

// Campaign queue management
router.post('/queue', addCampaignToQueue);  // Add campaign to execution queue

// Campaign results
router.get('/:id/results', getCampaignResults);  // Get campaign results

// LinkedIn search and scraping endpoints
router.post('/:id/searchLinkedin', searchLinkedin);  // Trigger LinkedIn search
router.post('/:id/linkedInProfileScrappingReq', linkedInProfileScrappingReq);  // Trigger LinkedIn profile scraping

// Campaign scheduling endpoint
router.post('/:id/schedule', scheduleCampaign);  // Schedule a campaign for future execution

export default router;
