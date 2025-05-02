import express, { Router } from "express";
import { authorizeJwt, isAdmin } from "../middlewares/auth.middleware";
import {
  createLeadStatus,
  getAllLeadStatuses,
  getLeadStatusById,
  updateLeadStatus,
  deleteLeadStatus,
} from "../controllers/leadStatus.controller";

// Create router
const router: Router = express.Router();

/**
 * @route   GET /leadStatus
 * @desc    Get all lead status definitions
 * @access  Private
 */
router.get("/", authorizeJwt, getAllLeadStatuses);

/**
 * @route   GET /leadStatus/:id
 * @desc    Get lead status definition by ID
 * @access  Private
 */
router.get("/:id", authorizeJwt, getLeadStatusById);

/**
 * @route   POST /leadStatus
 * @desc    Create a new lead status definition
 * @access  Private (admin)
 */
router.post("/", authorizeJwt, isAdmin, createLeadStatus);

/**
 * @route   PUT /leadStatus/:id
 * @desc    Update lead status definition
 * @access  Private (admin)
 */
router.put("/:id", authorizeJwt, isAdmin, updateLeadStatus);

/**
 * @route   DELETE /leadStatus/:id
 * @desc    Delete lead status definition
 * @access  Private (admin)
 */
router.delete("/:id", authorizeJwt, isAdmin, deleteLeadStatus);

export default router;
