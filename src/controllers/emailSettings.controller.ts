import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import EmailSettings from "../models/EmailSettings.model";
import { badRequest, notFound, serverError } from "../helpers/ErrorHandler";
import { successResponse, dataResponse } from "../interfaces/ApiResponse";
import { ErrorMessages, SuccessMessages } from "../helpers/Constants";
import { encryptPassword, decryptPassword } from "../helpers/Encryption";

/**
 * Get email settings for the current user
 */
export const getEmailSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const settings = await EmailSettings.findOne({ userId: req.user?.id });

    if (!settings) {
      return res
        .status(200)
        .json(dataResponse("No email settings found", null));
    }

    // Return sanitized settings (without the actual password)
    const sanitizedSettings = {
      ...settings.toObject(),
      password: settings.password ? "********" : "", // Hide the actual password
    };

    res
      .status(200)
      .json(dataResponse("Email settings retrieved", sanitizedSettings));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Create or update email settings for the current user
 */
export const updateEmailSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const {
    emailService,
    host,
    port,
    secure,
    username,
    password,
    fromEmail,
    fromName,
    notifications,
  } = req.body;

  // Basic validation
  if (!emailService || !host || !port || !username || !password || !fromEmail) {
    return next(badRequest("Required email settings are missing"));
  }

  try {
    // Encrypt the password
    const encryptedPassword = await encryptPassword(password);

    // Try to find existing settings
    let settings = await EmailSettings.findOne({ userId: req.user?.id });

    if (settings) {
      // Update existing settings
      settings.emailService = emailService;
      settings.host = host;
      settings.port = port;
      settings.secure = secure ?? false;
      settings.username = username;
      settings.password = encryptedPassword;
      settings.fromEmail = fromEmail;
      settings.fromName = fromName || "";

      if (notifications) {
        settings.notifications = {
          onCampaignComplete:
            notifications.onCampaignComplete ??
            settings.notifications.onCampaignComplete,
          onLeadStatusChange:
            notifications.onLeadStatusChange ??
            settings.notifications.onLeadStatusChange,
          onNewComment:
            notifications.onNewComment ?? settings.notifications.onNewComment,
          onError: notifications.onError ?? settings.notifications.onError,
        };
      }

      settings.updatedBy = req.user?.id;
      await settings.save();

      // Return sanitized settings (without the actual password)
      const sanitizedSettings = {
        ...settings.toObject(),
        password: "********", // Hide the actual password
      };

      res
        .status(200)
        .json(
          dataResponse(
            SuccessMessages.EMAIL_SETTINGS_UPDATED,
            sanitizedSettings,
          ),
        );
    } else {
      // Create new settings
      const newSettings = new EmailSettings({
        userId: req.user?.id,
        emailService,
        host,
        port,
        secure: secure ?? false,
        username,
        password: encryptedPassword,
        fromEmail,
        fromName: fromName || "",
        notifications: {
          onCampaignComplete: notifications?.onCampaignComplete ?? true,
          onLeadStatusChange: notifications?.onLeadStatusChange ?? true,
          onNewComment: notifications?.onNewComment ?? false,
          onError: notifications?.onError ?? true,
        },
        createdBy: req.user?.id,
      });

      await newSettings.save();

      // Return sanitized settings (without the actual password)
      const sanitizedSettings = {
        ...newSettings.toObject(),
        password: "********", // Hide the actual password
      };

      res
        .status(201)
        .json(
          dataResponse(
            SuccessMessages.EMAIL_SETTINGS_CREATED,
            sanitizedSettings,
          ),
        );
    }
  } catch (error: any) {
    if (error.name === "ValidationError") {
      return next(badRequest(error.message));
    }
    next(serverError(error.message));
  }
};

/**
 * Test email connection and send a test email
 */
export const testEmailConnection = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const settings = await EmailSettings.findOne({ userId: req.user?.id });

    if (!settings) {
      return next(
        notFound("Email settings not found. Please configure settings first."),
      );
    }

    // Decrypt password for sending the test email
    const decryptedPassword = await decryptPassword(settings.password);

    if (!decryptedPassword) {
      return next(serverError("Could not decrypt email password"));
    }

    // Create a test transporter
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: Number(settings.port),
      secure: settings.secure,
      auth: {
        user: settings.username,
        pass: decryptedPassword,
      },
    });

    // Send a test email
    const testEmail = {
      from: `"${settings.fromName || "LinkedIn Scraper"}" <${settings.fromEmail}>`,
      to: req.user?.email, // Send to the user's email address
      subject: "Test Email from LinkedIn Scraper",
      text: "This is a test email to verify your SMTP configuration. If you received this email, your email settings are working correctly.",
      html:
        '<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">' +
        '<h2 style="color: #0077b5;">Email Configuration Test</h2>' +
        "<p>This is a test email to verify your SMTP configuration.</p>" +
        "<p>If you received this email, your email settings are working correctly.</p>" +
        "<hr>" +
        '<p style="font-size: 12px; color: #777;">LinkedIn Scraper Tool</p>' +
        "</div>",
    };

    await transporter.sendMail(testEmail);

    res
      .status(200)
      .json(
        successResponse(
          "Email test successful! Check your inbox for a test message.",
        ),
      );
  } catch (error: any) {
    next(serverError(`Failed to test email connection: ${error.message}`));
  }
};

/**
 * Delete email settings
 */
export const deleteEmailSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await EmailSettings.findOneAndDelete({
      userId: req.user?.id,
    });

    if (!result) {
      return next(notFound("Email settings not found"));
    }

    res
      .status(200)
      .json(successResponse("Email settings deleted successfully"));
  } catch (error: any) {
    next(serverError(error.message));
  }
};
