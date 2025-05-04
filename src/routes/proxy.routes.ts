import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import {
  createProxy,
  getProxies,
  getProxyById,
  updateProxy,
  deleteProxy,
  getNextAvailableProxy,
} from '../controllers/proxy.controller';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply admin-only restriction to all routes
router.use(adminOnly);

// Create a new proxy
router.post('/', createProxy);

// Get all proxies with pagination
router.get('/', getProxies);

// Get a specific proxy by ID
router.get('/:id', getProxyById);

// Update a proxy
router.put('/:id', updateProxy);

// Delete a proxy
router.delete('/:id', deleteProxy);

// Get next available proxy (for internal use)
router.get('/next/available', getNextAvailableProxy);

export default router;
