import express from 'express';
import {
  registerUser,
  login,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  registerAdmin,
  loginAdmin,
  getCurrentUser,
  updateCurrentUser,
  refreshToken
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/auth.middleware';
import { rolesObj } from '../utils/constants';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', login);
router.post('/refreshToken', refreshToken);

// Admin only routes
router.post('/registerAdmin', authenticate, authorize([rolesObj.ADMIN]), registerAdmin);
router.post('/loginAdmin', loginAdmin);

// Authenticated user routes
router.get('/me', authenticate, getCurrentUser);
router.patch('/me/update', authenticate, updateCurrentUser);

// User management (admin only)
router.get('/', authenticate, authorize([rolesObj.ADMIN]), getUsers);
router.get('/:id', authenticate, authorize([rolesObj.ADMIN]), getUserById);
router.patch('/:id', authenticate, authorize([rolesObj.ADMIN]), updateUser);
router.delete('/:id', authenticate, authorize([rolesObj.ADMIN]), deleteUser);

export default router;
