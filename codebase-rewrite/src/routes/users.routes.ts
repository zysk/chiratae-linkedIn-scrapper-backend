import express, { Router } from 'express';
import { authorizeJwt, isAdmin, isSelfOrAdmin } from '../middlewares/auth.middleware';

// Create router
const router: Router = express.Router();

// TODO: Implement user controllers once created
// import * as userController from '../controllers/users.controller';

/**
 * @route   GET /users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Get all users - To be implemented' });
});

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Private (self or admin)
 */
router.get('/:id', authorizeJwt, isSelfOrAdmin(), (req, res) => {
  res.status(200).json({ message: 'Get user by ID - To be implemented' });
});

/**
 * @route   POST /users
 * @desc    Create a new user (admin only)
 * @access  Private/Admin
 */
router.post('/', authorizeJwt, isAdmin, (req, res) => {
  res.status(201).json({ message: 'Create user - To be implemented' });
});

/**
 * @route   PUT /users/:id
 * @desc    Update user
 * @access  Private (self or admin)
 */
router.put('/:id', authorizeJwt, isSelfOrAdmin(), (req, res) => {
  res.status(200).json({ message: 'Update user - To be implemented' });
});

/**
 * @route   DELETE /users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', authorizeJwt, isAdmin, (req, res) => {
  res.status(200).json({ message: 'Delete user - To be implemented' });
});

/**
 * @route   POST /users/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post('/login', (req, res) => {
  res.status(200).json({ message: 'Login user - To be implemented' });
});

export default router;