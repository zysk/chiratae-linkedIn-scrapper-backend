import express, { Router } from 'express';
import { authorizeJwt } from '../middlewares/auth.middleware';
import {
  getEmailSettings,
  updateEmailSettings,
  testEmailConnection,
  deleteEmailSettings
} from '../controllers/emailSettings.controller';

// Create router
const router: Router = express.Router();

/**
 * @route   GET /emailSettings
 * @desc    Get email settings for current user
 * @access  Private
 */
router.get('/', authorizeJwt, getEmailSettings);

/**
 * @route   POST /emailSettings
 * @desc    Create or update email settings
 * @access  Private
 */
router.post('/', authorizeJwt, updateEmailSettings);

/**
 * @route   POST /emailSettings/test
 * @desc    Test email connection
 * @access  Private
 */
router.post('/test', authorizeJwt, testEmailConnection);

/**
 * @route   DELETE /emailSettings
 * @desc    Delete email settings
 * @access  Private
 */
router.delete('/', authorizeJwt, deleteEmailSettings);

export default router;