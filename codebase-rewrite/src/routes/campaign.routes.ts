import express, { Router } from 'express';
import { authorizeJwt } from '../middlewares/auth.middleware';
import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  startCampaign,
  stopCampaign,
  linkedInLogin,
  checkLinkedInLogin,
  sendLinkedInCaptchaInput,
  verifyOtp
} from '../controllers/campaign.controller';

// Create router
const router: Router = express.Router();

/**
 * @route   GET /campaign
 * @desc    Get all campaigns for the logged-in user
 * @access  Private
 */
router.get('/', authorizeJwt, getAllCampaigns);

/**
 * @route   GET /campaign/:id
 * @desc    Get campaign by ID (owned by logged-in user)
 * @access  Private
 */
router.get('/:id', authorizeJwt, getCampaignById);

/**
 * @route   POST /campaign
 * @desc    Create a new campaign
 * @access  Private
 */
router.post('/', authorizeJwt, createCampaign);

/**
 * @route   PUT /campaign/:id
 * @desc    Update campaign (owned by logged-in user)
 * @access  Private
 */
router.put('/:id', authorizeJwt, updateCampaign);

/**
 * @route   DELETE /campaign/:id
 * @desc    Delete campaign (owned by logged-in user)
 * @access  Private
 */
router.delete('/:id', authorizeJwt, deleteCampaign);

/**
 * @route   POST /campaign/:id/start
 * @desc    Manually start campaign execution (placeholder)
 * @access  Private
 */
router.post('/:id/start', authorizeJwt, startCampaign);

/**
 * @route   POST /campaign/:id/stop
 * @desc    Manually stop campaign execution (placeholder)
 * @access  Private
 */
router.post('/:id/stop', authorizeJwt, stopCampaign);

/**
 * @route   POST /campaign/auth/login
 * @desc    Initiate LinkedIn login for a specified account
 * @access  Private (Requires user to be logged into the app)
 */
router.post('/auth/login', authorizeJwt, linkedInLogin);

/**
 * @route   GET /campaign/auth/status
 * @desc    Check current LinkedIn login status of the shared WebDriver
 * @access  Private
 */
router.get('/auth/status', authorizeJwt, checkLinkedInLogin);

/**
 * @route   POST /campaign/auth/captcha
 * @desc    Submit a CAPTCHA solution during login flow
 * @access  Private
 */
router.post('/auth/captcha', authorizeJwt, sendLinkedInCaptchaInput);

/**
 * @route   POST /campaign/auth/otp
 * @desc    Submit an OTP code during login flow
 * @access  Private
 */
router.post('/auth/otp', authorizeJwt, verifyOtp);

export default router;