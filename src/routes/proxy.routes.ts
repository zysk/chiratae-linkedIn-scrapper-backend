import express, { Router } from 'express';
import { authorizeJwt, isAdmin } from '../middlewares/auth.middleware';
import {
  createProxy,
  getAllProxies,
  getProxyById,
  updateProxy,
  deleteProxy,
  verifyProxy,
  importProxies
} from '../controllers/proxy.controller';

// Create router
const router: Router = express.Router();

/**
 * @route   GET /proxies
 * @desc    Get all proxies
 * @access  Private/Admin
 */
router.get('/', authorizeJwt, isAdmin, getAllProxies);

/**
 * @route   GET /proxies/:id
 * @desc    Get proxy by ID
 * @access  Private/Admin
 */
router.get('/:id', authorizeJwt, isAdmin, getProxyById);

/**
 * @route   POST /proxies
 * @desc    Create a new proxy
 * @access  Private/Admin
 */
router.post('/', authorizeJwt, isAdmin, createProxy);

/**
 * @route   PUT /proxies/:id
 * @desc    Update proxy
 * @access  Private/Admin
 */
router.put('/:id', authorizeJwt, isAdmin, updateProxy);

/**
 * @route   DELETE /proxies/:id
 * @desc    Delete proxy
 * @access  Private/Admin
 */
router.delete('/:id', authorizeJwt, isAdmin, deleteProxy);

/**
 * @route   POST /proxies/:id/verify
 * @desc    Verify proxy connectivity
 * @access  Private/Admin
 */
router.post('/:id/verify', authorizeJwt, isAdmin, verifyProxy);

/**
 * @route   POST /proxies/import
 * @desc    Import multiple proxies
 * @access  Private/Admin
 */
router.post('/import', authorizeJwt, isAdmin, importProxies);

export default router;