import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createProxy,
  getProxies,
  getProxyById,
  updateProxy,
  deleteProxy,
  getNextAvailableProxy,
} from '../controllers/proxy.controller';
import {
  createProxySchema,
  updateProxySchema,
  proxyIdParamSchema,
  listProxiesSchema
} from '../utils/validation/proxy.validation';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply admin-only restriction to all routes
router.use(adminOnly);

// Create a new proxy
router.post('/', validate(createProxySchema), createProxy);

// Get all proxies with pagination
router.get('/', validate(listProxiesSchema, 'query'), getProxies);

// Get a specific proxy by ID
router.get('/:id', validate(proxyIdParamSchema, 'params'), getProxyById);

// Update a proxy
router.put('/:id', validate(proxyIdParamSchema, 'params'), validate(updateProxySchema), updateProxy);

// Delete a proxy
router.delete('/:id', validate(proxyIdParamSchema, 'params'), deleteProxy);

// Get next available proxy (for internal use)
router.get('/next/available', getNextAvailableProxy);

export default router;
