import express, { Router } from "express";
import { authorizeJwt } from "../middlewares/auth.middleware";
import {
  addLeadComment,
  getLeadComments,
  getCommentById,
  updateLeadComment,
  deleteLeadComment,
} from "../controllers/leadComment.controller";

// Create router
const router: Router = express.Router();

/**
 * @route   GET /leadComments/lead/:leadId
 * @desc    Get all comments for a lead (paginated)
 * @access  Private (scoped to user's leads)
 */
router.get("/lead/:leadId", authorizeJwt, getLeadComments);

/**
 * @route   GET /leadComments/:id
 * @desc    Get comment by ID
 * @access  Private (scoped to user's leads)
 */
router.get("/:id", authorizeJwt, getCommentById);

/**
 * @route   POST /leadComments
 * @desc    Add a comment to a lead
 * @access  Private (scoped to user's leads)
 */
router.post("/", authorizeJwt, addLeadComment);

/**
 * @route   PUT /leadComments/:id
 * @desc    Update a comment (user must own comment)
 * @access  Private
 */
router.put("/:id", authorizeJwt, updateLeadComment);

/**
 * @route   DELETE /leadComments/:id
 * @desc    Delete a comment (user must own comment)
 * @access  Private
 */
router.delete("/:id", authorizeJwt, deleteLeadComment);

export default router;
