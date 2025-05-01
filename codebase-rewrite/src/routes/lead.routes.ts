import express, { Router } from 'express';
import { authorizeJwt } from '../middlewares/auth.middleware';
import {
    getLeads,
    getLeadById,
    createManualLead,
    updateLead,
    deleteLead
} from '../controllers/lead.controller';

// Create router
const router: Router = express.Router();

/**
 * @route   GET /lead
 * @desc    Get all leads with optional filtering (campaign, assignedTo, status, rating, search)
 * @access  Private (scoped to user's campaigns)
 */
router.get('/', authorizeJwt, getLeads);

/**
 * @route   GET /lead/:id
 * @desc    Get lead by ID
 * @access  Private (scoped to user's campaigns)
 */
router.get('/:id', authorizeJwt, getLeadById);

/**
 * @route   POST /lead
 * @desc    Create a new lead manually
 * @access  Private (scoped to user's campaigns)
 */
router.post('/', authorizeJwt, createManualLead);

/**
 * @route   PUT /lead/:id
 * @desc    Update lead status, assignment, or rating
 * @access  Private (scoped to user's campaigns)
 */
router.put('/:id', authorizeJwt, updateLead);

/**
 * @route   DELETE /lead/:id
 * @desc    Delete a lead
 * @access  Private (scoped to user's campaigns)
 */
router.delete('/:id', authorizeJwt, deleteLead);

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