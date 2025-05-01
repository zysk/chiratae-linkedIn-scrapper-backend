import express, { Router } from 'express';
import { authorizeJwt, isAdmin } from '../middlewares/auth.middleware';

// Create router
const router: Router = express.Router();

// TODO: Implement email settings controllers once created
// import * as emailSettingsController from '../controllers/emailSettings.controller';

/**
 * @route   GET /emailSettings
 * @desc    Get email settings
 * @access  Private/Admin
 */
router.get('/', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Get email settings - To be implemented' });
});

/**
 * @route   POST /emailSettings
 * @desc    Create or update email settings
 * @access  Private/Admin
 */
router.post('/', authorizeJwt, isAdmin, (req, res) => {
  res.status(201).json({ message: 'Create/update email settings - To be implemented' });
});

/**
 * @route   POST /emailSettings/test
 * @desc    Test email configuration
 * @access  Private/Admin
 */
router.post('/test', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Test email settings - To be implemented' });
});

export default router;