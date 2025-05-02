import express, { Router } from 'express';
import { authorizeJwt } from '../middlewares/auth.middleware';
import {
    getLeadLogs,
    getLogById
} from '../controllers/leadLog.controller';

// Create router
const router: Router = express.Router();

/**
 * @route   GET /leadLogs/lead/:leadId
 * @desc    Get all logs for a lead (paginated)
 * @access  Private (scoped to user's leads)
 */
router.get('/lead/:leadId', authorizeJwt, getLeadLogs);

/**
 * @route   GET /leadLogs/:id
 * @desc    Get log entry by ID
 * @access  Private (scoped to user's leads)
 */
router.get('/:id', authorizeJwt, getLogById);

/**
 * @route   GET /leadLogs/activity
 * @desc    Get recent activity logs across leads
 * @access  Private
 */
router.get('/activity', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get recent activity - To be implemented' });
});

export default router;