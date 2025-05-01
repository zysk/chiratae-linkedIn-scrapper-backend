import express, { Router } from 'express';
import { authorizeJwt, isAdmin } from '../middlewares/auth.middleware';

// Create router
const router: Router = express.Router();

// TODO: Implement lead status controllers once created
// import * as leadStatusController from '../controllers/leadStatus.controller';

/**
 * @route   GET /leadStatus
 * @desc    Get all lead statuses
 * @access  Private
 */
router.get('/', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get all lead statuses - To be implemented' });
});

/**
 * @route   GET /leadStatus/:id
 * @desc    Get lead status by ID
 * @access  Private
 */
router.get('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get lead status by ID - To be implemented' });
});

/**
 * @route   POST /leadStatus
 * @desc    Create a new lead status
 * @access  Private/Admin
 */
router.post('/', authorizeJwt, isAdmin, (req, res) => {
  res.status(201).json({ message: 'Create lead status - To be implemented' });
});

/**
 * @route   PUT /leadStatus/:id
 * @desc    Update lead status
 * @access  Private/Admin
 */
router.put('/:id', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Update lead status - To be implemented' });
});

/**
 * @route   DELETE /leadStatus/:id
 * @desc    Delete lead status
 * @access  Private/Admin
 */
router.delete('/:id', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Delete lead status - To be implemented' });
});

export default router;