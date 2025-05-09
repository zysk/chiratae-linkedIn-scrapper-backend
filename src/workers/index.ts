import logger from '../utils/logger';
import profileScrapingWorker from './profileScrapingWorker';

/**
 * Worker Manager
 * Handles starting and stopping all background worker processes
 */
class WorkerManager {
  /**
   * Start all worker processes
   */
  public static startAll(): void {
    logger.info('Starting all background worker processes');

    // Start the profile scraping worker
    profileScrapingWorker.start();

    // Add additional workers here as needed

    logger.info('All background worker processes started');
  }

  /**
   * Stop all worker processes
   */
  public static stopAll(): void {
    logger.info('Stopping all background worker processes');

    // Stop the profile scraping worker
    profileScrapingWorker.stop();

    // Add additional workers here as needed

    logger.info('All background worker processes stopped');
  }
}

export default WorkerManager;
