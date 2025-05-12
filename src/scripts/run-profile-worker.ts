import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { CONFIG } from '../utils/config';
import logger from '../utils/logger';
import profileScrapingWorker from '../workers/profileScrapingWorker';

// Load environment variables
dotenv.config();

/**
 * Initialize worker process
 */
async function initializeWorker() {
	try {
		// First connect to MongoDB
		logger.info(`Connecting to MongoDB at ${CONFIG.MONGOURI}`);
		await mongoose.connect(CONFIG.MONGOURI);
		logger.info('Connected to MongoDB successfully');

		// Start the profile scraping worker
		logger.info('Starting profile scraping worker...');
		profileScrapingWorker.start();
		logger.info('Profile scraping worker is now running');

		// Handle process termination
		process.on('SIGINT', handleShutdown);
		process.on('SIGTERM', handleShutdown);

		logger.info('Worker is now running. Press CTRL+C to stop.');
	} catch (error) {
		logger.error(`Failed to initialize worker: ${error instanceof Error ? error.message : String(error)}`);
		process.exit(1);
	}
}

/**
 * Handle graceful shutdown
 */
async function handleShutdown() {
	logger.info('Shutting down worker...');

	try {
		// Stop worker
		profileScrapingWorker.stop();

		// Close MongoDB connection
		await mongoose.connection.close();
		logger.info('Worker shut down successfully');
	} catch (error) {
		logger.error(`Error during worker shutdown: ${error instanceof Error ? error.message : String(error)}`);
	}

	process.exit(0);
}

// Start the worker
initializeWorker();
