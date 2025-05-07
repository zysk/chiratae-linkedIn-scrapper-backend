import express from 'express';
import leadController from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route GET /lead/getLeads
 * @desc Get all leads with filtering and pagination
 * @access Private
 */
router.get('/getLeads', authenticate, leadController.getLeads);

/**
 * @route GET /lead/getById/:id
 * @desc Get a lead by ID
 * @access Private
 */
router.get('/getById/:id', authenticate, leadController.getLeadById);

/**
 * @route PATCH /lead/updateById/:id
 * @desc Update a lead by ID
 * @access Private
 */
router.patch('/updateById/:id', authenticate, leadController.updateLeadById);

/**
 * @route DELETE /lead/deleteById/:id
 * @desc Delete a lead by ID
 * @access Private
 */
router.delete('/deleteById/:id', authenticate, leadController.deleteLeadById);

/**
 * @route GET /lead/:leadId/comments
 * @desc Get all comments for a lead
 * @access Private
 */
router.get('/:leadId/comments', authenticate, leadController.getLeadComments);

/**
 * @route POST /lead/:leadId/comments
 * @desc Add a comment to a lead
 * @access Private
 */
router.post('/:leadId/comments', authenticate, leadController.addLeadComment);

/**
 * @route PATCH /lead/comments/:commentId
 * @desc Update a lead comment
 * @access Private
 */
router.patch('/comments/:commentId', authenticate, leadController.updateLeadComment);

/**
 * @route DELETE /lead/comments/:commentId
 * @desc Delete a lead comment
 * @access Private
 */
router.delete('/comments/:commentId', authenticate, leadController.deleteLeadComment);

export default router;
