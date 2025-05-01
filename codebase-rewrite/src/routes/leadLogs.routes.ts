import express, { Router } from 'express';
import { authorizeJwt } from '../middlewares/auth.middleware';

// Create router
const router: Router = express.Router();

// TODO: Implement lead logs controllers once created
// import * as leadLogsController from '../controllers/leadLogs.controller';

/**
 * @route   GET /leadLogs/lead/:leadId
 * @desc    Get all logs for a lead
 * @access  Private
 */
router.get('/lead/:leadId', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get lead logs - To be implemented' });
});

/**
 * @route   GET /leadLogs/:id
 * @desc    Get log entry by ID
 * @access  Private
 */
router.get('/:id', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get log entry by ID - To be implemented' });
});

/**
 * @route   POST /leadLogs
 * @desc    Create a new log entry
 * @access  Private
 */
router.post('/', authorizeJwt, (req, res) => {
  res.status(201).json({ message: 'Create log entry - To be implemented' });
});

/**
 * @route   GET /leadLogs/activity
 * @desc    Get recent activity logs across leads
 * @access  Private
 */
router.get('/activity', authorizeJwt, (req, res) => {
  res.status(200).json({ message: 'Get recent activity - To be implemented' });
});

export default router;