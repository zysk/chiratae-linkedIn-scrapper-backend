import { MongoConnectionPoolManager, mongoose } from '../../src/services/mongoConnectionPool.service';

// Mock mongoose methods
jest.mock('mongoose', () => {
  const mockConnection = {
    on: jest.fn(),
    db: {
      admin: jest.fn().mockReturnValue({
        ping: jest.fn().mockResolvedValue(true)
      }),
      serverConfig: {}
    },
    close: jest.fn().mockResolvedValue(undefined)
  };

  return {
    connect: jest.fn().mockResolvedValue(undefined),
    connection: mockConnection,
    connections: [mockConnection],
    ConnectOptions: {}
  };
});

// Mock EventEmitter methods
jest.mock('events', () => {
  return {
    EventEmitter: class MockEventEmitter {
      on = jest.fn();
      emit = jest.fn();
    }
  };
});

describe('MongoConnectionPoolManager', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      // Get an instance
      const instance1 = MongoConnectionPoolManager.getInstance();

      // Get another instance
      const instance2 = MongoConnectionPoolManager.getInstance();

      // They should be the same instance
      expect(instance1).toBe(instance2);
    });
  });

  describe('connect', () => {
    it('should connect to MongoDB', async () => {
      // Get an instance
      const instance = MongoConnectionPoolManager.getInstance();

      // Connect to MongoDB
      const connection = await instance.connect();

      // Mongoose connect should have been called
      expect(mongoose.connect).toHaveBeenCalled();

      // The connection should be returned
      expect(connection).toBeDefined();
    });

    it('should reuse the existing connection if already connected', async () => {
      // Get an instance
      const instance = MongoConnectionPoolManager.getInstance();

      // Set the instance as connected (this would normally happen in connect())
      // We'll do this by accessing private properties using type assertion
      (instance as any).isConnected = true;
      (instance as any).connectionPool = mongoose.connection;

      // Connect to MongoDB
      const connection = await instance.connect();

      // Mongoose connect should not have been called again
      expect(mongoose.connect).not.toHaveBeenCalled();

      // The connection should be returned
      expect(connection).toBeDefined();
    });

    it('should handle connection errors and retry', async () => {
      // Mock mongoose.connect to reject the first time and resolve the second time
      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce(undefined);

      // Get an instance
      const instance = MongoConnectionPoolManager.getInstance();

      // Reset the instance (in case previous tests have set it to connected)
      (instance as any).isConnected = false;
      (instance as any).connectionPool = null;

      // Set a small retry interval for testing
      (instance as any).RETRY_INTERVAL_MS = 10;

      // Connect to MongoDB
      const connection = await instance.connect();

      // Mongoose connect should have been called twice
      expect(mongoose.connect).toHaveBeenCalledTimes(2);

      // The connection should be returned
      expect(connection).toBeDefined();
    });
  });

  describe('close', () => {
    it('should close the MongoDB connection', async () => {
      // Get an instance
      const instance = MongoConnectionPoolManager.getInstance();

      // Set the instance as connected
      (instance as any).isConnected = true;
      (instance as any).connectionPool = mongoose.connection;

      // Close the connection
      await instance.close();

      // The instance should no longer be connected
      expect((instance as any).isConnected).toBe(false);
      expect((instance as any).connectionPool).toBeNull();
    });

    it('should handle errors when closing the connection', async () => {
      // Mock mongoose.connection.close to reject
      (mongoose.connection.close as jest.Mock).mockRejectedValueOnce(new Error('Close error'));

      // Get an instance
      const instance = MongoConnectionPoolManager.getInstance();

      // Set the instance as connected
      (instance as any).isConnected = true;
      (instance as any).connectionPool = mongoose.connection;

      // Close the connection should throw an error
      await expect(instance.close()).rejects.toThrow('Close error');
    });
  });

  describe('isConnectedToMongoDB', () => {
    it('should return true if connected', () => {
      // Get an instance
      const instance = MongoConnectionPoolManager.getInstance();

      // Set the instance as connected
      (instance as any).isConnected = true;
      (instance as any).connectionPool = mongoose.connection;

      // Check if connected
      expect(instance.isConnectedToMongoDB()).toBe(true);
    });

    it('should return false if not connected', () => {
      // Get an instance
      const instance = MongoConnectionPoolManager.getInstance();

      // Set the instance as disconnected
      (instance as any).isConnected = false;
      (instance as any).connectionPool = null;

      // Check if connected
      expect(instance.isConnectedToMongoDB()).toBe(false);
    });
  });
});