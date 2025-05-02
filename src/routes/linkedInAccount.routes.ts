import express, { Router } from "express";
import { authorizeJwt, isAdmin } from "../middlewares/auth.middleware";
import {
  createLinkedInAccount,
  getAllLinkedInAccounts,
  getLinkedInAccountById,
  updateLinkedInAccount,
  deleteLinkedInAccount,
  verifyLinkedInAccount,
} from "../controllers/linkedInAccount.controller";

// Create router
const router: Router = express.Router();

/**
 * @route   GET /linkedInAccount
 * @desc    Get all LinkedIn accounts
 * @access  Private/Admin
 */
router.get("/", authorizeJwt, isAdmin, getAllLinkedInAccounts);

/**
 * @route   GET /linkedInAccount/:id
 * @desc    Get LinkedIn account by ID
 * @access  Private/Admin
 */
router.get("/:id", authorizeJwt, isAdmin, getLinkedInAccountById);

/**
 * @route   POST /linkedInAccount
 * @desc    Create a new LinkedIn account
 * @access  Private/Admin
 */
router.post("/", authorizeJwt, isAdmin, createLinkedInAccount);

/**
 * @route   PUT /linkedInAccount/:id
 * @desc    Update LinkedIn account
 * @access  Private/Admin
 */
router.put("/:id", authorizeJwt, isAdmin, updateLinkedInAccount);

/**
 * @route   DELETE /linkedInAccount/:id
 * @desc    Delete LinkedIn account
 * @access  Private/Admin
 */
router.delete("/:id", authorizeJwt, isAdmin, deleteLinkedInAccount);

/**
 * @route   POST /linkedInAccount/:id/verify
 * @desc    Verify LinkedIn account credentials
 * @access  Private/Admin
 */
router.post("/:id/verify", authorizeJwt, isAdmin, verifyLinkedInAccount);

export default router;
