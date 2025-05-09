import fs from 'fs';
import path from 'path';
import logger from '../../utils/logger';

/**
 * Service responsible for cleaning up debug screenshots
 */
class ScreenshotCleanupService {
  private static instance: ScreenshotCleanupService;
  private screenshotDir: string;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.screenshotDir = path.join(process.cwd(), 'debug-screenshots');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ScreenshotCleanupService {
    if (!ScreenshotCleanupService.instance) {
      ScreenshotCleanupService.instance = new ScreenshotCleanupService();
    }
    return ScreenshotCleanupService.instance;
  }

  /**
   * Delete all screenshots in the debug-screenshots directory
   * @returns Promise<number> - Number of files deleted
   */
  public async cleanupAllScreenshots(): Promise<number> {
    try {
      if (!fs.existsSync(this.screenshotDir)) {
        logger.info('Screenshot directory does not exist, nothing to clean up.');
        return 0;
      }

      const files = fs.readdirSync(this.screenshotDir);
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.png')) {
          const filePath = path.join(this.screenshotDir, file);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      logger.info(`Successfully cleaned up ${deletedCount} screenshot files.`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error cleaning up screenshots: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Delete screenshots for a specific campaign by matching the ID in filename patterns
   * This is a more targeted approach if you want to clean up only specific campaign's screenshots
   * @param campaignId - ID of the campaign
   * @returns Promise<number> - Number of files deleted
   */
  public async cleanupCampaignScreenshots(campaignId: string): Promise<number> {
    try {
      if (!fs.existsSync(this.screenshotDir)) {
        logger.info('Screenshot directory does not exist, nothing to clean up.');
        return 0;
      }

      const files = fs.readdirSync(this.screenshotDir);
      let deletedCount = 0;

      for (const file of files) {
        if (file.endsWith('.png') && file.includes(campaignId)) {
          const filePath = path.join(this.screenshotDir, file);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      logger.info(`Successfully cleaned up ${deletedCount} screenshot files for campaign ${campaignId}.`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error cleaning up screenshots for campaign ${campaignId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Delete screenshots older than the specified number of days
   * @param days - Delete screenshots older than this many days
   * @returns Promise<number> - Number of files deleted
   */
  public async cleanupOldScreenshots(days: number): Promise<number> {
    try {
      if (!fs.existsSync(this.screenshotDir)) {
        logger.info('Screenshot directory does not exist, nothing to clean up.');
        return 0;
      }

      const files = fs.readdirSync(this.screenshotDir);
      let deletedCount = 0;
      const now = Date.now();
      const cutoffTime = now - (days * 24 * 60 * 60 * 1000);

      for (const file of files) {
        if (file.endsWith('.png')) {
          const filePath = path.join(this.screenshotDir, file);
          const stats = fs.statSync(filePath);

          if (stats.mtimeMs < cutoffTime) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }

      logger.info(`Successfully cleaned up ${deletedCount} screenshot files older than ${days} days.`);
      return deletedCount;
    } catch (error) {
      logger.error(`Error cleaning up old screenshots: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

export default ScreenshotCleanupService.getInstance();
