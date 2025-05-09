import { createClient, RedisClientType } from 'redis';
import { CONFIG } from '../../utils/config';
import logger from '../../utils/logger';

/**
 * Class to handle Redis client connection and operations
 */
class RedisService {
  private static instance: RedisService;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  /**
   * Private constructor - use getInstance()
   */
  private constructor() {
    this.initializeClient();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Initialize Redis client
   */
  private async initializeClient(): Promise<void> {
    try {
      this.client = createClient({
        url: CONFIG.REDIS_URL
      });

      // Set up event handlers
      this.client.on('connect', () => {
        logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error(`Redis client error: ${err}`);
        this.isConnected = false;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      logger.error(`Failed to initialize Redis client: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get Redis client
   */
  public async getClient(): Promise<RedisClientType> {
    if (!this.client || !this.isConnected) {
      await this.initializeClient();
    }

    if (!this.client) {
      throw new Error('Redis client initialization failed');
    }

    return this.client;
  }

  /**
   * Set a key-value pair in Redis
   */
  public async set(key: string, value: string, expirationSeconds?: number): Promise<void> {
    const client = await this.getClient();

    if (expirationSeconds) {
      await client.setEx(key, expirationSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  /**
   * Get a value from Redis by key
   */
  public async get(key: string): Promise<string | null> {
    const client = await this.getClient();
    return await client.get(key);
  }

  /**
   * Delete a key from Redis
   */
  public async del(key: string): Promise<void> {
    const client = await this.getClient();
    await client.del(key);
  }

  /**
   * Check if Redis is connected
   */
  public isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Close Redis connection
   */
  public async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

export default RedisService;
