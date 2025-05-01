import express, { Router } from 'express';
import { authorizeJwt } from '../middlewares/auth.middleware';

// Create router
const router: Router = express.Router();

// TODO: Implement lead controllers once created
// import * as leadController from '../controllers/lead.controller';

/**
 * @route   GET /lead
 * @desc    Get all leads with optional filtering
 * @access  Private
 */
router.get('/', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get all leads - To be implemented' });
});

/**
 * @route   GET /lead/:id
 * @desc    Get lead by ID
 * @access  Private
 */
router.get('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get lead by ID - To be implemented' });
});

/**
 * @route   POST /lead
 * @desc    Create a new lead manually
 * @access  Private
 */
router.post('/', authorizeJwt, (req, res) => {
  res.status(201).json({ message: 'Create lead - To be implemented' });
});

/**
 * @route   PUT /lead/:id
 * @desc    Update lead
 * @access  Private
 */
router.put('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Update lead - To be implemented' });
});

/**
 * @route   DELETE /lead/:id
 * @desc    Delete lead
 * @access  Private
 */
router.delete('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Delete lead - To be implemented' });
});

/**
 * @route   PUT /lead/:id/status
 * @desc    Update lead status
 * @access  Private
 */
router.put('/:id/status', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Update lead status - To be implemented' });
});

/**
 * @route   PUT /lead/:id/assign
 * @desc    Assign lead to user
 * @access  Private
 */
router.put('/:id/assign', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Assign lead - To be implemented' });
});

/**
 * @route   GET /lead/campaign/:campaignId
 * @desc    Get leads by campaign ID
 * @access  Private
 */
router.get('/campaign/:campaignId', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get leads by campaign - To be implemented' });
});

export default router;