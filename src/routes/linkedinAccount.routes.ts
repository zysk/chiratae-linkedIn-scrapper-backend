import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createLinkedInAccount,
  getLinkedInAccounts,
  getLinkedInAccountById,
  updateLinkedInAccount,
  deleteLinkedInAccount,
  getNextAvailableAccount,
} from '../controllers/linkedinAccount.controller';
import {
  createLinkedinAccountSchema,
  updateLinkedinAccountSchema,
  linkedinAccountIdParamSchema,
  listLinkedinAccountsSchema
} from '../utils/validation/linkedinAccount.validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply admin-only restriction to all routes
router.use(adminOnly);

// Create a new LinkedIn account
router.post('/', validate(createLinkedinAccountSchema), createLinkedInAccount);

// Get all LinkedIn accounts with pagination
router.get('/', validate(listLinkedinAccountsSchema, 'query'), getLinkedInAccounts);

// Get a specific LinkedIn account by ID
router.get('/:id', validate(linkedinAccountIdParamSchema, 'params'), getLinkedInAccountById);

// Update a LinkedIn account
router.put('/:id', validate(linkedinAccountIdParamSchema, 'params'), validate(updateLinkedinAccountSchema), updateLinkedInAccount);

// Delete a LinkedIn account
router.delete('/:id', validate(linkedinAccountIdParamSchema, 'params'), deleteLinkedInAccount);

// Get next available LinkedIn account (for internal use)
router.get('/next/available', getNextAvailableAccount);

export default router;
