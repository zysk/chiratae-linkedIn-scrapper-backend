import { Router } from 'express';
import { utilsController } from '../controllers/utils.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Routes require authentication and admin privileges for safety
router.post('/screenshots/cleanup', authenticate, authorize(['ADMIN']), utilsController.cleanupAllScreenshots);
router.post('/screenshots/cleanup/campaign/:campaignId', authenticate, authorize(['ADMIN']), utilsController.cleanupCampaignScreenshots);
router.post('/screenshots/cleanup/old', authenticate, authorize(['ADMIN']), utilsController.cleanupOldScreenshots);

export default router;
