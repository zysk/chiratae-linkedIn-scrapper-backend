import express, { Router } from 'express';
import { authorizeJwt, isAdmin } from '../middlewares/auth.middleware';

// Create router
const router: Router = express.Router();

// TODO: Implement LinkedIn account controllers once created
// import * as linkedInAccountController from '../controllers/linkedInAccount.controller';

/**
 * @route   GET /linkedInAccount
 * @desc    Get all LinkedIn accounts
 * @access  Private/Admin
 */
router.get('/', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Get all LinkedIn accounts - To be implemented' });
});

/**
 * @route   GET /linkedInAccount/:id
 * @desc    Get LinkedIn account by ID
 * @access  Private/Admin
 */
router.get('/:id', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Get LinkedIn account by ID - To be implemented' });
});

/**
 * @route   POST /linkedInAccount
 * @desc    Create a new LinkedIn account
 * @access  Private/Admin
 */
router.post('/', authorizeJwt, isAdmin, (req, res) => {
  res.status(201).json({ message: 'Create LinkedIn account - To be implemented' });
});

/**
 * @route   PUT /linkedInAccount/:id
 * @desc    Update LinkedIn account
 * @access  Private/Admin
 */
router.put('/:id', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Update LinkedIn account - To be implemented' });
});

/**
 * @route   DELETE /linkedInAccount/:id
 * @desc    Delete LinkedIn account
 * @access  Private/Admin
 */
router.delete('/:id', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Delete LinkedIn account - To be implemented' });
});

/**
 * @route   POST /linkedInAccount/:id/verify
 * @desc    Verify LinkedIn account credentials
 * @access  Private/Admin
 */
router.post('/:id/verify', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Verify LinkedIn account - To be implemented' });
});

export default router;