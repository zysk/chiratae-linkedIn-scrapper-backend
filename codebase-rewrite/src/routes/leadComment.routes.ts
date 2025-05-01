import express, { Router } from 'express';
import { authorizeJwt } from '../middlewares/auth.middleware';

// Create router
const router: Router = express.Router();

// TODO: Implement lead comment controllers once created
// import * as leadCommentController from '../controllers/leadComment.controller';

/**
 * @route   GET /leadComments/lead/:leadId
 * @desc    Get all comments for a lead
 * @access  Private
 */
router.get('/lead/:leadId', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get lead comments - To be implemented' });
});

/**
 * @route   GET /leadComments/:id
 * @desc    Get comment by ID
 * @access  Private
 */
router.get('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get comment by ID - To be implemented' });
});

/**
 * @route   POST /leadComments
 * @desc    Create a new comment
 * @access  Private
 */
router.post('/', authorizeJwt, (req, res) => {
  res.status(201).json({ message: 'Create comment - To be implemented' });
});

/**
 * @route   PUT /leadComments/:id
 * @desc    Update comment
 * @access  Private
 */
router.put('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Update comment - To be implemented' });
});

/**
 * @route   DELETE /leadComments/:id
 * @desc    Delete comment
 * @access  Private
 */
router.delete('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Delete comment - To be implemented' });
});

export default router;