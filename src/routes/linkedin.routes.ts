import { Router } from 'express';
import linkedInController from '../controllers/linkedin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  testLoginSchema,
  searchProfilesSchema,
  getNextAccountSchema,
  getNextProxySchema
} from '../utils/validation/linkedinSearch.validation';

const router = Router();

/**
 * @route POST /api/linkedin/test-login
 * @desc Test a LinkedIn account login
 * @access Admin only
 */
router.post('/test-login', [authenticate, adminOnly], validate(testLoginSchema), linkedInController.testLogin);

/**
 * @route POST /api/linkedin/search
 * @desc Search LinkedIn profiles
 * @access Authenticated
 */
router.post('/search', authenticate, validate(searchProfilesSchema), linkedInController.searchProfiles);

/**
 * @route GET /api/linkedin/accounts/next
 * @desc Get the next available LinkedIn account
 * @access Admin only
 */
router.get('/accounts/next', [authenticate, adminOnly], validate(getNextAccountSchema, 'query'), linkedInController.getNextAccount);

/**
 * @route GET /api/linkedin/proxies/next
 * @desc Get the next available proxy
 * @access Admin only
 */
router.get('/proxies/next', [authenticate, adminOnly], validate(getNextProxySchema, 'query'), linkedInController.getNextProxy);

export default router;
