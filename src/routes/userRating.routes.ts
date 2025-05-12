import express from 'express';
import { getUserRatings, rateUser } from '../controllers/userRating.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Rate a user
router.post('/', rateUser);

// Get ratings for a user
router.get('/:userId', getUserRatings);

export default router;
