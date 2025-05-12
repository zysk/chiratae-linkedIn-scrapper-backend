import express from 'express';
import leadController from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
	commentIdParamSchema,
	createLeadCommentSchema,
	getLeadsSchema,
	leadIdParamAltSchema,
	leadIdParamSchema,
	updateLeadCommentSchema,
	updateLeadSchema
} from '../utils/validation/lead.validation';

const router = express.Router();

/**
 * @route GET /lead/getLeads
 * @desc Get all leads with filtering and pagination
 * @access Private
 */
router.get('/getLeads', authenticate, validate(getLeadsSchema, 'query'), leadController.getLeads);

/**
 * @route GET /lead/getById/:id
 * @desc Get a lead by ID
 * @access Private
 */
router.get('/getById/:id', authenticate, validate(leadIdParamSchema, 'params'), leadController.getLeadById);

/**
 * @route PATCH /lead/updateById/:id
 * @desc Update a lead by ID
 * @access Private
 */
router.patch('/updateById/:id', authenticate, validate(leadIdParamSchema, 'params'), validate(updateLeadSchema), leadController.updateLeadById);

/**
 * @route DELETE /lead/deleteById/:id
 * @desc Delete a lead by ID
 * @access Private
 */
router.delete('/deleteById/:id', authenticate, validate(leadIdParamSchema, 'params'), leadController.deleteLeadById);

/**
 * @route GET /lead/:leadId/comments
 * @desc Get all comments for a lead
 * @access Private
 */
router.get('/:leadId/comments', authenticate, validate(leadIdParamAltSchema, 'params'), leadController.getLeadComments);

/**
 * @route POST /lead/:leadId/comments
 * @desc Add a comment to a lead
 * @access Private
 */
router.post('/:leadId/comments', authenticate, validate(leadIdParamAltSchema, 'params'), validate(createLeadCommentSchema), leadController.addLeadComment);

/**
 * @route PATCH /lead/comments/:commentId
 * @desc Update a lead comment
 * @access Private
 */
router.patch('/comments/:commentId', authenticate, validate(commentIdParamSchema, 'params'), validate(updateLeadCommentSchema), leadController.updateLeadComment);

/**
 * @route DELETE /lead/comments/:commentId
 * @desc Delete a lead comment
 * @access Private
 */
router.delete('/comments/:commentId', authenticate, validate(commentIdParamSchema, 'params'), leadController.deleteLeadComment);

export default router;
