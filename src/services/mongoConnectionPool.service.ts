import mongoose, { Connection, ConnectOptions } from 'mongoose';
import { EventEmitter } from 'events';
import { config } from '../config/config';
import { Logger } from './logger.service';

/**
 * MongoDB Connection Pool Manager
 *
 * A singleton service that handles creation and management of MongoDB connections.
 * It implements connection pooling, monitoring, and automatic reconnection.
 */
export class MongoConnectionPoolManager extends EventEmitter {
  private static instance: MongoConnectionPoolManager;
  private logger: Logger;
  private isConnected: boolean = false;
  private connectionPool: Connection | null = null;
  private connectionAttempts: number = 0;
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly RETRY_INTERVAL_MS = 5000;
  private connectionMonitorInterval: NodeJS.Timeout | null = null;
  private connectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    availableConnections: 0,
    createdAt: new Date(),
    lastError: null as Error | null,
    lastReconnectAttempt: null as Date | null,
  };

  /**
   * Connection options with sensible defaults that can be overridden via environment variables
   */
  private dbOptions: ConnectOptions = {
    maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10', 10),
    minPoolSize: parseInt(process.env.MONGO_MIN_POOL_SIZE || '2', 10),
    connectTimeoutMS: parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS || '30000', 10),
    socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT_MS || '45000', 10),
    serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || '30000', 10),
    heartbeatFrequencyMS: parseInt(process.env.MONGO_HEARTBEAT_FREQUENCY_MS || '10000', 10),
    autoIndex: config.NODE_ENV === 'development', // Build indexes in development, not in production
    autoCreate: config.NODE_ENV === 'development', // Auto-create collections in development
  };

  /**
   * Private constructor to enforce singleton pattern
   * Initialize the connection pool manager
   */
  private constructor() {
    super();
    this.logger = new Logger('MongoConnectionPool');
    this.logger.info('MongoDB Connection Pool Manager initialized');
    this.logger.info(`Pool configuration: minSize=${this.dbOptions.minPoolSize}, maxSize=${this.dbOptions.maxPoolSize}`);
  }

  /**
   * Get the singleton instance of the connection pool manager
   * @returns MongoConnectionPoolManager instance
   */
  public static getInstance(): MongoConnectionPoolManager {
    if (!MongoConnectionPoolManager.instance) {
      MongoConnectionPoolManager.instance = new MongoConnectionPoolManager();
    }
    return MongoConnectionPoolManager.instance;
  }

  /**
   * Connect to MongoDB with retry logic
   * @returns Promise resolving to the mongoose connection
   */
  public async connect(): Promise<Connection> {
    if (this.isConnected && this.connectionPool) {
      this.logger.debug('Reusing existing MongoDB connection');
      return this.connectionPool;
    }

    try {
      this.logger.info(`Connecting to MongoDB at ${this.maskConnectionString(config.MONGOURI)}...`);

      // Connect to MongoDB
      await mongoose.connect(config.MONGOURI, this.dbOptions);

      this.connectionPool = mongoose.connection;
      this.isConnected = true;
      this.connectionAttempts = 0;

      // Set up connection event handlers
      this.setupConnectionEventHandlers();

      // Start monitoring the connection
      this.startConnectionMonitoring();

      this.logger.info('MongoDB connection established successfully');
      this.updateConnectionMetrics();

      return this.connectionPool;
    } catch (error) {
      this.connectionMetrics.lastError = error as Error;
      this.logger.error('Failed to connect to MongoDB:', error);

      // Implement retry logic
      if (this.connectionAttempts < this.MAX_RETRY_ATTEMPTS) {
        this.connectionAttempts++;
        this.connectionMetrics.lastReconnectAttempt = new Date();

        this.logger.info(`Retrying connection (attempt ${this.connectionAttempts}/${this.MAX_RETRY_ATTEMPTS}) in ${this.RETRY_INTERVAL_MS}ms...`);

        // Wait and try again
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              const connection = await this.connect();
              resolve(connection);
            } catch (retryError) {
              reject(retryError);
            }
          }, this.RETRY_INTERVAL_MS);
        });
      }

      // Max retries exceeded
      this.emit('connectionFailed', error);
      throw error;
    }
  }

  /**
   * Setup event handlers for the MongoDB connection
   */
  private setupConnectionEventHandlers(): void {
    if (!this.connectionPool) return;

    this.connectionPool.on('error', (err) => {
      this.logger.error('MongoDB connection error:', err);
      this.connectionMetrics.lastError = err;
      this.isConnected = false;
      this.emit('error', err);
    });

    this.connectionPool.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected. Will attempt to reconnect automatically.');
      this.isConnected = false;
      this.emit('disconnected');
      // Mongoose will attempt to reconnect automatically
    });

    this.connectionPool.on('reconnected', () => {
      this.logger.info('MongoDB reconnected successfully');
      this.isConnected = true;
      this.emit('reconnected');
    });

    this.connectionPool.on('connected', () => {
      this.logger.info('MongoDB connected');
      this.isConnected = true;
      this.emit('connected');
    });

    this.connectionPool.on('reconnectFailed', () => {
      this.logger.error('MongoDB reconnection failed after maximum attempts');
      this.isConnected = false;
      this.emit('reconnectFailed');
    });

    this.connectionPool.on('fullsetup', () => {
      this.logger.info('MongoDB replica set fully connected');
    });
  }

  /**
   * Start monitoring the connection health and metrics
   */
  private startConnectionMonitoring(): void {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
    }

    // Check connection health every minute
    this.connectionMonitorInterval = setInterval(() => {
      this.checkConnectionHealth();
      this.updateConnectionMetrics();
    }, 60000); // 1 minute
  }

  /**
   * Check the health of the MongoDB connection
   */
  private async checkConnectionHealth(): Promise<void> {
    if (!this.connectionPool || !this.connectionPool.db) return;

    try {
      // Simple ping to check if connection is alive
      const adminDb = this.connectionPool.db.admin();
      if (adminDb) {
        await adminDb.ping();

        if (!this.isConnected) {
          this.logger.info('Connection health check: reconnected');
          this.isConnected = true;
          this.emit('connected');
        }
      }
    } catch (error) {
      this.logger.error('Connection health check failed:', error);
      this.connectionMetrics.lastError = error as Error;

      if (this.isConnected) {
        this.isConnected = false;
        this.emit('disconnected');
      }
    }
  }

  /**
   * Update connection metrics for monitoring
   */
  private updateConnectionMetrics(): void {
    if (!this.connectionPool) return;

    try {
      // Update metrics based on the connection pool
      this.connectionMetrics.activeConnections = mongoose.connections.length;

      // For more detailed metrics, we would need to access the MongoDB driver's pool
      // This is a simplified version
      this.connectionMetrics.totalConnections = mongoose.connections.length;

      // Emit metrics event for any monitoring service to consume
      this.emit('metrics', this.connectionMetrics);
    } catch (error) {
      this.logger.error('Failed to update connection metrics:', error);
    }
  }

  /**
   * Get the current connection metrics
   * @returns Current connection metrics
   */
  public getConnectionMetrics() {
    return { ...this.connectionMetrics };
  }

  /**
   * Close the MongoDB connection
   * @returns Promise that resolves when the connection is closed
   */
  public async close(): Promise<void> {
    try {
      // Stop the monitoring interval
      if (this.connectionMonitorInterval) {
        clearInterval(this.connectionMonitorInterval);
        this.connectionMonitorInterval = null;
      }

      if (this.connectionPool) {
        this.logger.info('Closing MongoDB connection...');
        await mongoose.connection.close();
        this.connectionPool = null;
        this.isConnected = false;
        this.logger.info('MongoDB connection closed successfully');
      }
    } catch (error) {
      this.logger.error('Error closing MongoDB connection:', error);
      throw error;
    }
  }

  /**
   * Masks sensitive information in connection string for logging
   * @param uri MongoDB connection string
   * @returns Masked connection string
   */
  private maskConnectionString(uri: string): string {
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
  }

  /**
   * Get the current MongoDB connection
   * @returns Current connection or null if not connected
   */
  public getConnection(): Connection | null {
    return this.connectionPool;
  }

  /**
   * Check if connected to MongoDB
   * @returns True if connected, false otherwise
   */
  public isConnectedToMongoDB(): boolean {
    return this.isConnected && this.connectionPool !== null;
  }
}

// Export a function to get the singleton instance
export const getMongoConnectionPool = (): MongoConnectionPoolManager => {
  return MongoConnectionPoolManager.getInstance();
};

// Export mongoose for use in models
export { mongoose };