import { createClient, RedisClientType } from 'redis';
import { config } from '../config/config';

// --- Redis Client Initialization ---

// Export the client instance directly if it's meant to be a singleton
// Or create a function to get/create the client

let redisClientInstance: RedisClientType | null = null;

export const getRedisClient = async (): Promise<RedisClientType> => {
    if (redisClientInstance && redisClientInstance.isOpen) {
        return redisClientInstance;
    }

    console.log('Initializing Redis client...');
    const client = createClient({
        url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`
    });

    client.on('error', (err) => console.error('Redis Client Error:', err));

    try {
        await client.connect();
        redisClientInstance = client as RedisClientType;
        console.log('Redis connected successfully.');
        return redisClientInstance;
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
        throw err; // Re-throw connection error
    }
};

// --- Distributed Locking Functions ---

/**
 * Attempts to acquire a distributed lock.
 *
 * @param client Redis client instance.
 * @param lockKey The key to use for the lock.
 * @param lockValue A unique value for this lock instance (e.g., process ID + timestamp).
 * @param expirySeconds Time in seconds until the lock automatically expires.
 * @returns True if the lock was acquired, false otherwise.
 */
export const acquireLock = async (
    client: RedisClientType,
    lockKey: string,
    lockValue: string,
    expirySeconds: number = 3600 // Default 1 hour expiry
): Promise<boolean> => {
    try {
        const result = await client.set(lockKey, lockValue, {
            NX: true,      // Only set if the key does not exist
            EX: expirySeconds // Set expiry time in seconds
        });
        return result === 'OK'; // SET returns 'OK' on success with NX
    } catch (error) {
        console.error(`Error acquiring lock for key ${lockKey}:`, error);
        return false;
    }
};

/**
 * Releases a distributed lock, ensuring it's released only by the owner.
 * Uses a Lua script for atomicity.
 *
 * @param client Redis client instance.
 * @param lockKey The key of the lock to release.
 * @param lockValue The unique value that was used to acquire the lock.
 * @returns True if the lock was released, false otherwise (e.g., lock expired or held by someone else).
 */
export const releaseLock = async (
    client: RedisClientType,
    lockKey: string,
    lockValue: string
): Promise<boolean> => {
    // Lua script: Delete the key only if its current value matches the expected value.
    const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
    `;
    try {
        // EVAL takes script, number of keys, key(s)..., arg(s)...
        const result = await client.eval(script, { keys: [lockKey], arguments: [lockValue] });
        return result === 1; // DEL returns 1 if the key was deleted, 0 otherwise
    } catch (error) {
        console.error(`Error releasing lock for key ${lockKey}:`, error);
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