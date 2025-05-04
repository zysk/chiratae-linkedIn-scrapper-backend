import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import {
  createLinkedInAccount,
  getLinkedInAccounts,
  getLinkedInAccountById,
  updateLinkedInAccount,
  deleteLinkedInAccount,
  getNextAvailableAccount,
} from '../controllers/linkedinAccount.controller';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply admin-only restriction to all routes
router.use(adminOnly);

// Create a new LinkedIn account
router.post('/', createLinkedInAccount);

// Get all LinkedIn accounts with pagination
router.get('/', getLinkedInAccounts);

// Get a specific LinkedIn account by ID
router.get('/:id', getLinkedInAccountById);

// Update a LinkedIn account
router.put('/:id', updateLinkedInAccount);

// Delete a LinkedIn account
router.delete('/:id', deleteLinkedInAccount);

// Get next available LinkedIn account (for internal use)
router.get('/next/available', getNextAvailableAccount);

export default router;
