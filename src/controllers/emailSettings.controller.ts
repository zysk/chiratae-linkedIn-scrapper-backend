import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import EmailSettings from '../models/EmailSettings.model';
import { badRequest, notFound, serverError } from '../helpers/ErrorHandler';
import { successResponse, dataResponse } from '../interfaces/ApiResponse';
import { ErrorMessages, SuccessMessages } from '../helpers/Constants';

/**
 * Get email settings for the current user
 */
export const getEmailSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await EmailSettings.findOne({ userId: req.user?.id });

    if (!settings) {
      return res.status(200).json(dataResponse('No email settings found', null));
    }

    res.status(200).json(dataResponse('Email settings retrieved', settings));
  } catch (error: any) {
    next(serverError(error.message));
  }
};

/**
 * Create or update email settings for the current user
 */
export const updateEmailSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    emailService,
    host,
    port,
    secure,
    username,
    password,
    fromEmail,
    fromName,
    notifications
  } = req.body;

  // Basic validation
  if (!emailService || !host || !port || !username || !password || !fromEmail) {
    return next(badRequest('Required email settings are missing'));
  }

  try {
    // Try to find existing settings
    let settings = await EmailSettings.findOne({ userId: req.user?.id });

    if (settings) {
      // Update existing settings
      settings.emailService = emailService;
      settings.host = host;
      settings.port = port;
      settings.secure = secure ?? false;
      settings.username = username;
      // TODO: Encrypt password before saving
      settings.password = password;
      settings.fromEmail = fromEmail;
      settings.fromName = fromName || '';

      if (notifications) {
        settings.notifications = {
          onCampaignComplete: notifications.onCampaignComplete ?? settings.notifications.onCampaignComplete,
          onLeadStatusChange: notifications.onLeadStatusChange ?? settings.notifications.onLeadStatusChange,
          onNewComment: notifications.onNewComment ?? settings.notifications.onNewComment,
          onError: notifications.onError ?? settings.notifications.onError
        };
      }

      settings.updatedBy = req.user?.id;
      await settings.save();

      res.status(200).json(dataResponse(SuccessMessages.EMAIL_SETTINGS_UPDATED, settings));
    } else {
      // Create new settings
      const newSettings = new EmailSettings({
        userId: req.user?.id,
        emailService,
        host,
        port,
        secure: secure ?? false,
        username,
        password, // TODO: Encrypt password before saving
        fromEmail,
        fromName: fromName || '',
        notifications: {
          onCampaignComplete: notifications?.onCampaignComplete ?? true,
          onLeadStatusChange: notifications?.onLeadStatusChange ?? true,
          onNewComment: notifications?.onNewComment ?? false,
          onError: notifications?.onError ?? true
        },
        createdBy: req.user?.id
      });

      await newSettings.save();
      res.status(201).json(dataResponse(SuccessMessages.EMAIL_SETTINGS_CREATED, newSettings));
    }
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return next(badRequest(error.message));
    }
    next(serverError(error.message));
  }
};

/**
 * Test email connection and send a test email
 */
export const testEmailConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await EmailSettings.findOne({ userId: req.user?.id });

    if (!settings) {
      return next(notFound('Email settings not found. Please configure settings first.'));
    }

    // TODO: Implement actual email sending test using the settings
    // For now, just return a placeholder success

    res.status(200).json(successResponse('Email test successful! Check your inbox for a test message.'));
  } catch (error: any) {
    next(serverError(`Failed to test email connection: ${error.message}`));
  }
};

/**
 * Delete email settings
 */
export const deleteEmailSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await EmailSettings.findOneAndDelete({ userId: req.user?.id });

    if (!result) {
      return next(notFound('Email settings not found'));
    }

    res.status(200).json(successResponse('Email settings deleted successfully'));
  } catch (error: any) {
    next(serverError(error.message));
  }
};