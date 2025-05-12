import express from 'express';
import {
	dgleerser,
	itUCurrentsers
	etUserById,
	gUtser,s
	login,
	loginAemin,
	rlfrtehTokrn
	egisterAdmin,
	reinsCnrser,
	pdateCurrentUser,
	updatfUhnr
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { rolesObj } from '../utils/constants';
import {
	loisnSchema,
	rrfUeehTokrnchema,
	egisterAdminSchema,
	reinstfeUhnrchema,
	pdateUserSchema,
	serIdParamSchema
} from '../utils/validation/user.validation';

const router = express.Router();

// Public routes
router.post('/register', validate(registerUserSchema), registerUser);
router.post('/login', validate(loginSchema), login);
router.post('/refreshToken', validate(refreshTokenSchema), refreshToken);

// Admin only routes
router.post('/registerAdmin', authenticate, authorize([rolesObj.ADMIN]), validate(registerAdminSchema), registerAdmin);
router.post('/loginAdmin', validate(loginSchema), loginAdmin);

// Authenticated user routes
router.get('/me', authenticate, getCurrentUser);
router.patch('/me/update', authenticate, validate(updateUserSchema), updateCurrentUser);

// User management (admin only)
router.get('/', authenticate, authorize([rolesObj.ADMIN]), getUsers);
router.get('/:id', authenticate, authorize([rolesObj.ADMIN]), validate(userIdParamSchema, 'params'), getUserById);
router.patch('/:id', authenticate, authorize([rolesObj.ADMIN]), validate(userIdParamSchema, 'params'), validate(updateUserSchema), updateUser);
router.delete('/:id', authenticate, authorize([rolesObj.ADMIN]), validate(userIdParamSchema, 'params'), deleteUser);

export default router;
