import express, { Router } from 'express';
import { authorizeJwt } from '../middlewares/auth.middleware';

// Create router
const router: Router = express.Router();

// TODO: Implement campaign controllers once created
// import * as campaignController from '../controllers/campaign.controller';

/**
 * @route   GET /campaign
 * @desc    Get all campaigns for user
 * @access  Private
 */
router.get('/', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get all campaigns - To be implemented' });
});

/**
 * @route   GET /campaign/:id
 * @desc    Get campaign by ID
 * @access  Private
 */
router.get('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get campaign by ID - To be implemented' });
});

/**
 * @route   POST /campaign
 * @desc    Create a new campaign
 * @access  Private
 */
router.post('/', authorizeJwt, (req, res) => {
  res.status(201).json({ message: 'Create campaign - To be implemented' });
});

/**
 * @route   PUT /campaign/:id
 * @desc    Update campaign
 * @access  Private
 */
router.put('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Update campaign - To be implemented' });
});

/**
 * @route   DELETE /campaign/:id
 * @desc    Delete campaign
 * @access  Private
 */
router.delete('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Delete campaign - To be implemented' });
});

/**
 * @route   POST /campaign/:id/start
 * @desc    Start campaign execution
 * @access  Private
 */
router.post('/:id/start', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Start campaign - To be implemented' });
});

/**
 * @route   POST /campaign/:id/stop
 * @desc    Stop campaign execution
 * @access  Private
 */
router.post('/:id/stop', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Stop campaign - To be implemented' });
});

export default router;