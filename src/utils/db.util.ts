import { Connection } from 'mongoose';
import { getMongoConnectionPool, mongoose } from '../services/mongoConnectionPool.service';
import { Logger } from '../services/logger.service';
import { config } from '../config/config';

const logger = new Logger('Database');

/**
 * Connects to MongoDB database using the connection pool
 * @returns Promise that resolves when connection is successful
 */
export const connectDatabase = async (): Promise<Connection> => {
  try {
    logger.info(`Connecting to MongoDB at ${maskConnectionString(config.MONGOURI)}...`);

    // Get the singleton connection pool instance
    const connectionPool = getMongoConnectionPool();

    // Connect to MongoDB using the pool
    const connection = await connectionPool.connect();

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
    // Get the singleton connection pool instance
    const connectionPool = getMongoConnectionPool();

    // Close the connection pool
    await connectionPool.close();

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

/**
 * Get connection metrics for monitoring
 * @returns Current connection metrics
 */
export const getConnectionMetrics = () => {
  const connectionPool = getMongoConnectionPool();
  return connectionPool.getConnectionMetrics();
};

/**
 * Check if the database is connected
 * @returns True if connected, false otherwise
 */
export const isDatabaseConnected = (): boolean => {
  const connectionPool = getMongoConnectionPool();
  return connectionPool.isConnectedToMongoDB();
};

// Export mongoose instance to have access to ObjectId, etc.
export { mongoose };