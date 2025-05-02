import express, { Router } from "express";
import { authorizeJwt, isAdmin } from "../middlewares/auth.middleware";
import {
  getEmailSettings,
  updateEmailSettings,
  testEmailConnection,
  deleteEmailSettings,
} from "../controllers/emailSettings.controller";

// Create router
const router: Router = express.Router();

/**
 * @route   GET /emailSettings
 * @desc    Get email settings for current user
 * @access  Private (admin)
 */
router.get("/", authorizeJwt, isAdmin, getEmailSettings);

/**
 * @route   POST /emailSettings
 * @desc    Create or update email settings
 * @access  Private (admin)
 */
router.post("/", authorizeJwt, isAdmin, updateEmailSettings);

/**
 * @route   POST /emailSettings/test
 * @desc    Test email connection
 * @access  Private (admin)
 */
router.post("/test", authorizeJwt, isAdmin, testEmailConnection);

/**
 * @route   DELETE /emailSettings
 * @desc    Delete email settings
 * @access  Private (admin)
 */
router.delete("/", authorizeJwt, isAdmin, deleteEmailSettings);

export default router;
