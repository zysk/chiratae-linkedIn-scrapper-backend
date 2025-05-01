import express, { Router } from 'express';
import { authorizeJwt, isAdmin, isSelfOrAdmin } from '../middlewares/auth.middleware';
import {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  registerAdmin,
  loginAdmin,
  getUserDetailsWithCampaigns,
  setUserRating
} from '../controllers/users.controller';

// Create router
const router: Router = express.Router();

/**
 * @route   GET /users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', authorizeJwt, isAdmin, getAllUsers);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Private (self or admin)
 */
router.get('/:id', authorizeJwt, isSelfOrAdmin('id'), getUserById);

/**
 * @route   POST /users
 * @desc    Create a new user (standard role)
 * @access  Public (or Admin only? - Assuming public for now)
 */
// If admin-only creation is desired, add authorizeJwt, isAdmin middleware
router.post('/', registerUser);

/**
 * @route   PUT /users/:id
 * @desc    Update user
 * @access  Private (self or admin)
 */
router.put('/:id', authorizeJwt, isSelfOrAdmin('id'), updateUser);

/**
 * @route   DELETE /users/:id
 * @desc    Delete user
 * @access  Private/Admin
 */
router.delete('/:id', authorizeJwt, isAdmin, deleteUser);

/**
 * @route   POST /users/login
 * @desc    Authenticate standard user & get token
 * @access  Public
 */
router.post('/login', loginUser);

// --- Admin Specific Routes ---

/**
 * @route   POST /users/admin/register
 * @desc    Register a new admin user
 * @access  Private/Admin (Only existing admins can create new admins)
 */
router.post('/admin/register', authorizeJwt, isAdmin, registerAdmin);

/**
 * @route   POST /users/admin/login
 * @desc    Authenticate admin user & get token
 * @access  Public
 */
router.post('/admin/login', loginAdmin);

// --- Other User Routes ---

/**
 * @route   GET /users/details/:id
 * @desc    Get user details with aggregated campaign data
 * @access  Private (self or admin)
 */
router.get('/details/:id', authorizeJwt, isSelfOrAdmin('id'), getUserDetailsWithCampaigns);

/**
 * @route   PUT /users/rating/calculate
 * @desc    Trigger recalculation of ratings (Admin only)
 * @access  Private/Admin
 */
router.put('/rating/calculate', authorizeJwt, isAdmin, setUserRating);

export default router;