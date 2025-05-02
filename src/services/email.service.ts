import nodemailer, { Transporter } from "nodemailer";
import { IEmailSettings } from "../interfaces/EmailSettings.interface";
import EmailSettings from "../models/EmailSettings.model";
import User from "../models/User.model";
import mongoose from "mongoose";
import Lead from "../models/Lead.model";
import Campaign from "../models/Campaign.model";
import { LeadComment } from "../models/LeadComment.model";
import config from "../config/config";
import Logger from "../helpers/Logger";

// Create a dedicated logger for email service
const logger = new Logger({ context: "email-service" });

// Cache transporter instances by userId to avoid recreating them frequently
const transporterCache: Map<
  string,
  { transporter: Transporter; timestamp: number }
> = new Map();
// Transporter cache TTL - 1 hour
const TRANSPORTER_CACHE_TTL = 60 * 60 * 1000;

/**
 * Creates a nodemailer transporter for the user based on their email settings
 * @param userId - The user ID to get email settings for
 * @returns Transporter instance or null if settings not found
 */
export const createTransporter = async (
  userId: string | mongoose.Types.ObjectId,
): Promise<Transporter | null> => {
  const id = userId.toString();

  // Check cache first
  const cached = transporterCache.get(id);
  if (cached && Date.now() - cached.timestamp < TRANSPORTER_CACHE_TTL) {
    return cached.transporter;
  }

  try {
    // Get user's email settings
    const settings = await EmailSettings.findOne({ userId: id });
    if (!settings) {
      logger.warn(`No email settings found for user ${id}`);
      return null;
    }

    // Create transporter based on email service
    let transporter: Transporter;

    if (settings.emailService === "gmail") {
      // Gmail OAuth2 (recommended for Gmail)
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: settings.username,
          pass: settings.password, // Should be an app password, not the account password
        },
      });
    } else if (settings.emailService === "smtp") {
      // Generic SMTP
      transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        auth: {
          user: settings.username,
          pass: settings.password,
        },
      });
    } else {
      logger.warn(`Unsupported email service: ${settings.emailService}`);
      return null;
    }

    // Cache the transporter
    transporterCache.set(id, {
      transporter,
      timestamp: Date.now(),
    });

    return transporter;
  } catch (error) {
    logger.error("Error creating email transporter:", error);
    return null;
  }
};

/**
 * Send an email notification
 * @param userId - User ID to send the email from
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email body HTML
 * @returns True if sent successfully
 */
export const sendEmail = async (
  userId: string | mongoose.Types.ObjectId,
  to: string,
  subject: string,
  html: string,
): Promise<boolean> => {
  try {
    const transporter = await createTransporter(userId);
    if (!transporter) {
      return false;
    }

    // Get user's email settings
    const settings = await EmailSettings.findOne({ userId });
    if (!settings) {
      return false;
    }

    const info = await transporter.sendMail({
      from: `"${settings.fromName || "LinkedIn Scraper"}" <${settings.fromEmail}>`,
      to,
      subject,
      html,
    });

    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error("Error sending email:", error);
    return false;
  }
};

/**
 * Send a campaign completion notification
 * @param campaignId - The campaign ID
 * @param leadsCount - Number of leads scraped
 */
export const sendCampaignCompletionEmail = async (
  campaignId: string | mongoose.Types.ObjectId,
  leadsCount: number,
): Promise<boolean> => {
  try {
    // Get campaign and owner
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return false;

    const userId = campaign.createdBy;
    if (!userId) return false;

    // Check if user has notifications enabled
    const settings = await EmailSettings.findOne({ userId });
    if (!settings || !settings.notifications.onCampaignComplete) {
      return false;
    }

    // Get user email
    const user = await User.findById(userId);
    if (!user || !user.email) return false;

    const html = `
      <h2>Campaign Completed</h2>
      <p>Your LinkedIn campaign "${campaign.name}" has completed.</p>
      <p><strong>Results:</strong> ${leadsCount} leads were found and scraped.</p>
      <p>You can view and manage these leads in your dashboard.</p>
      <p>Thanks for using LinkedIn Scraper!</p>
    `;

    return await sendEmail(
      userId,
      user.email,
      `Campaign Complete: ${campaign.name}`,
      html,
    );
  } catch (error) {
    logger.error("Error sending campaign completion email:", error);
    return false;
  }
};

/**
 * Send a notification when a lead status changes
 * @param leadId - The lead ID
 * @param oldStatus - Previous status
 * @param newStatus - New status
 */
export const sendLeadStatusChangeEmail = async (
  leadId: string | mongoose.Types.ObjectId,
  oldStatus: string,
  newStatus: string,
): Promise<boolean> => {
  try {
    // Get lead, campaign, and owner
    const lead = await Lead.findById(leadId).populate("campaignId");
    if (!lead || !lead.campaignId) return false;

    const campaign = lead.campaignId as any; // Cast to access createdBy
    const userId = campaign.createdBy;
    if (!userId) return false;

    // Check if user has notifications enabled
    const settings = await EmailSettings.findOne({ userId });
    if (!settings || !settings.notifications.onLeadStatusChange) {
      return false;
    }

    // Get user email
    const user = await User.findById(userId);
    if (!user || !user.email) return false;

    const leadName = lead.profileData?.name || lead.clientId;

    const html = `
      <h2>Lead Status Changed</h2>
      <p>A lead's status has been updated in your campaign "${campaign.name}".</p>
      <p><strong>Lead:</strong> ${leadName}</p>
      <p><strong>Old Status:</strong> ${oldStatus}</p>
      <p><strong>New Status:</strong> ${newStatus}</p>
      <p>You can view and manage this lead in your dashboard.</p>
    `;

    return await sendEmail(
      userId,
      user.email,
      `Lead Status Changed: ${leadName}`,
      html,
    );
  } catch (error) {
    logger.error("Error sending lead status change email:", error);
    return false;
  }
};

/**
 * Send a notification when a new comment is added to a lead
 * @param commentId - The comment ID
 */
export const sendNewCommentEmail = async (
  commentId: string | mongoose.Types.ObjectId,
): Promise<boolean> => {
  try {
    // Get comment, lead, and other related data
    const comment = await LeadComment.findById(commentId)
      .populate({
        path: "leadId",
        populate: { path: "campaignId" },
      })
      .populate("userId", "firstName lastName email");

    if (!comment || !comment.leadId) return false;

    const lead = comment.leadId as any;
    if (!lead.campaignId) return false;

    const campaign = lead.campaignId as any;
    const campaignOwnerId = campaign.createdBy;
    if (!campaignOwnerId) return false;

    // Check if campaign owner has notifications enabled
    const settings = await EmailSettings.findOne({ userId: campaignOwnerId });
    if (!settings || !settings.notifications.onNewComment) {
      return false;
    }

    // Get campaign owner email
    const campaignOwner = await User.findById(campaignOwnerId);
    if (!campaignOwner || !campaignOwner.email) return false;

    // If the comment was made by the campaign owner, don't send notification
    if (
      comment.userId &&
      comment.userId._id.toString() === campaignOwnerId.toString()
    ) {
      return false;
    }

    const commenter = comment.userId as any;
    const leadName = lead.profileData?.name || lead.clientId;

    const html = `
      <h2>New Comment on Lead</h2>
      <p>A new comment has been added to a lead in your campaign "${campaign.name}".</p>
      <p><strong>Lead:</strong> ${leadName}</p>
      <p><strong>Commenter:</strong> ${commenter?.firstName || ""} ${commenter?.lastName || ""}</p>
      <p><strong>Comment:</strong> "${comment.comment}"</p>
      <p>You can view and respond to this comment in your dashboard.</p>
    `;

    return await sendEmail(
      campaignOwnerId,
      campaignOwner.email,
      `New Comment on Lead: ${leadName}`,
      html,
    );
  } catch (error) {
    logger.error("Error sending new comment email:", error);
    return false;
  }
};

/**
 * Send an error notification
 * @param userId - User to notify
 * @param errorTitle - Error title
 * @param errorDetails - Error details
 */
export const sendErrorEmail = async (
  userId: string | mongoose.Types.ObjectId,
  errorTitle: string,
  errorDetails: string,
): Promise<boolean> => {
  try {
    // Check if user has notifications enabled
    const settings = await EmailSettings.findOne({ userId });
    if (!settings || !settings.notifications.onError) {
      return false;
    }

    // Get user email
    const user = await User.findById(userId);
    if (!user || !user.email) return false;

    const html = `
      <h2>Error Alert</h2>
      <p>An error occurred in your LinkedIn Scraper account.</p>
      <p><strong>Error:</strong> ${errorTitle}</p>
      <p><strong>Details:</strong> ${errorDetails}</p>
      <p>Please check your dashboard for more information.</p>
    `;

    return await sendEmail(
      userId,
      user.email,
      `Error Alert: ${errorTitle}`,
      html,
    );
  } catch (error) {
    logger.error("Error sending error notification email:", error);
    return false;
  }
};

export default {
  createTransporter,
  sendEmail,
  sendCampaignCompletionEmail,
  sendLeadStatusChangeEmail,
  sendNewCommentEmail,
  sendErrorEmail,
};
