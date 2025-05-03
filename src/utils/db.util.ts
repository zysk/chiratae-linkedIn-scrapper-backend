import mongoose from 'mongoose';
import { config } from '../config/config';
import { Logger } from '../services/logger.service';

const logger = new Logger('Database');

/**
 * Database connection options
 */
const dbOptions: mongoose.ConnectOptions = {
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
  socketTimeoutMS: 45000, // 45 seconds socket timeout
  // Other options can be added as needed
};

/**
 * Connects to MongoDB database
 * @returns Promise that resolves when connection is successful
 */
export const connectDatabase = async (): Promise<mongoose.Connection> => {
  try {
    logger.info(`Connecting to MongoDB at ${maskConnectionString(config.MONGOURI)}...`);
    await mongoose.connect(config.MONGOURI, dbOptions);

    const connection = mongoose.connection;

    // Set up event listeners for connection events
    connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    logger.info('MongoDB connected successfully');
    return connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

/**
 * Closes the database connection
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

/**
 * Masks sensitive information in connection string for logging
 * @param uri MongoDB connection string
 * @returns Masked connection string
 */
const maskConnectionString = (uri: string): string => {
  try {
    // If URI contains authentication info, mask the password
    if (uri.includes('@')) {
      return uri.replace(/\/\/([^:]+):([^@]+)@/, '//********:********@');
    }
    return uri;
  } catch (error) {
    // If any error occurs during masking, return a generic message
    return 'mongodb://<connection-string>';
  }
};

/**
 * Handles unexpected errors in the database connection
 * @param error The error that occurred
 */
export const handleDatabaseError = (error: unknown): void => {
  logger.error('Unhandled database error:', error);
  // Additional error handling logic can be added here
};

// Export mongoose instance to have access to ObjectId, etc.
export { mongoose };