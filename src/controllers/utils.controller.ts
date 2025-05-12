import { NextFunction, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { IAuthRequest } from '../middleware/auth.middleware';
import ScreenshotCleanupService from '../services/utils/ScreenshotCleanupService';
import { ApiError } from '../utils/error.utils';
import logger from '../utils/logger';

/**
 * Controller for utility operations
 */
export const utilsController = {
  /**
   * Clean up all screenshots
   */
  cleanupAllScreenshots: async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Cleaning up all screenshots');
      const deletedCount = await ScreenshotCleanupService.cleanupAllScreenshots();

      res.status(200).json({
        success: true,
        message: `Successfully cleaned up ${deletedCount} screenshot files`,
        data: { deletedCount }
      });
    } catch (error) {
      next(new ApiError(`Error cleaning up screenshots: ${error instanceof Error ? error.message : String(error)}`, 500));
    }
  },

  /**
   * Clean up screenshots for a specific campaign
   */
  cleanupCampaignScreenshots: async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { campaignId } = req.params;

      if (!campaignId || !isValidObjectId(campaignId)) {
        throw new ApiError('Valid campaign ID is required', 400);
      }

      logger.info(`Cleaning up screenshots for campaign: ${campaignId}`);
      const deletedCount = await ScreenshotCleanupService.cleanupCampaignScreenshots(campaignId);

      res.status(200).json({
        success: true,
        message: `Successfully cleaned up ${deletedCount} screenshot files for campaign ${campaignId}`,
        data: { deletedCount }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : new ApiError(`Error cleaning up campaign screenshots: ${error instanceof Error ? error.message : String(error)}`, 500));
    }
  },

  /**
   * Clean up screenshots older than specified days
   */
  cleanupOldScreenshots: async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string) || 1;

      if (days <= 0) {
        throw new ApiError('Days parameter must be a positive number', 400);
      }

      logger.info(`Cleaning up screenshots older than ${days} days`);
      const deletedCount = await ScreenshotCleanupService.cleanupOldScreenshots(days);

      res.status(200).json({
        success: true,
        message: `Successfully cleaned up ${deletedCount} screenshot files older than ${days} days`,
        data: { deletedCount }
      });
    } catch (error) {
      next(error instanceof ApiError ? error : new ApiError(`Error cleaning up old screenshots: ${error instanceof Error ? error.message : String(error)}`, 500));
    }
  }
};
