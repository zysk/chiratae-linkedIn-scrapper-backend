import { createClient, RedisClientType } from "redis";
import { config } from "../config/config";
import Logger from "../helpers/Logger";

const logger = new Logger({ context: "redis" });

// --- Redis Client Initialization ---

// Export the client instance directly if it's meant to be a singleton
// Or create a function to get/create the client

let redisClientInstance: RedisClientType | null = null;

/**
 * Gets a Redis client instance (creates one if it doesn't exist)
 */
export const getRedisClient = async (): Promise<RedisClientType> => {
  if (redisClientInstance && redisClientInstance.isOpen) {
    return redisClientInstance;
  }

  logger.info("Initializing Redis client...");
  const client = createClient({
    url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`,
  });

  client.on("error", (err) => logger.error("Redis Client Error:", err));

  try {
    await client.connect();
    redisClientInstance = client as RedisClientType;
    logger.info("Redis connected successfully.");
    return redisClientInstance;
  } catch (err) {
    logger.error("Failed to connect to Redis:", err);
    throw err; // Re-throw connection error
  }
};

// --- Distributed Locking Functions ---

/**
 * Acquire a distributed lock using Redis
 *
 * @param client Redis client
 * @param lockKey Key to use for the lock
 * @param ttlSeconds Time-to-live in seconds for the lock
 * @returns True if lock acquired, false otherwise
 */
export const acquireLock = async (
  client: RedisClientType,
  lockKey: string,
  ttlSeconds = 60, // Default 1 minute lock
): Promise<boolean> => {
  try {
    // Use SET with NX to only set if key doesn't exist
    // EX sets expiration in seconds
    const result = await client.set(lockKey, "1", {
      NX: true,
      EX: ttlSeconds,
    });

    // Result will be "OK" string if lock was acquired, null otherwise
    return result === "OK"; // SET returns 'OK' on success with NX
  } catch (error) {
    logger.error(`Error acquiring lock for key ${lockKey}:`, error);
    return false;
  }
};

/**
 * Check if a lock exists
 *
 * @param client Redis client
 * @param lockKey Key used for the lock
 * @returns True if lock exists, false otherwise
 */
export const checkLock = async (
  client: RedisClientType,
  lockKey: string,
): Promise<boolean> => {
  try {
    // Get the value of the lock key
    const result = await client.get(lockKey);
    // If the key exists, the lock is still held
    return result !== null;
  } catch (error) {
    logger.error(`Error checking lock for key ${lockKey}:`, error);
    return false; // On error, assume lock doesn't exist to avoid deadlock
  }
};

/**
 * Release a distributed lock
 *
 * @param client Redis client
 * @param lockKey Key used for the lock
 * @returns True if lock released, false otherwise
 */
export const releaseLock = async (
  client: RedisClientType,
  lockKey: string,
): Promise<boolean> => {
  try {
    // Simply delete the key to release the lock
    const result = await client.del(lockKey);
    // Result will be 1 if key was deleted, 0 if key didn't exist
    return result === 1; // DEL returns 1 if the key was deleted, 0 otherwise
  } catch (error) {
    logger.error(`Error releasing lock for key ${lockKey}:`, error);
    return false;
  }
};

// --- Example Usage (Conceptual) ---
/*
async function exampleTask() {
    const client = await getRedisClient();
    const myLockKey = 'task:my-unique-task';
    const myLockValue = process.pid + '-' + Date.now(); // Example unique value
    const acquired = await acquireLock(client, myLockKey, myLockValue, 600); // 10 min expiry

    if (acquired) {
        console.log('Lock acquired, performing task...');
        try {
            // ... do the work that needs locking ...
            await new Promise(res => setTimeout(res, 5000)); // Simulate work
        } finally {
            const released = await releaseLock(client, myLockKey, myLockValue);
            if (released) {
                console.log('Lock released.');
            } else {
                console.warn('Could not release lock (maybe expired or value changed).');
            }
        }
    } else {
        console.log('Could not acquire lock, another instance may be running.');
    }
}
*/

export default {
  getRedisClient,
  acquireLock,
  checkLock,
  releaseLock,
};
