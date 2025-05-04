import mongoose from 'mongoose';
import { ProxyService } from '../../src/services/proxy.service';
import { ProxyStatus } from '../../src/interfaces/Proxy.interface';
import Proxy from '../../src/models/Proxy.model';

// Mock mongoose
jest.mock('mongoose', () => {
  const originalModule = jest.requireActual('mongoose');
  return {
    ...originalModule,
    connect: jest.fn().mockResolvedValue({}),
  };
});

// Mock Proxy model
jest.mock('../../src/models/Proxy.model', () => {
  return {
    aggregate: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };
});

// Mock logger
jest.mock('../../src/helpers/Logger', () => {
  return jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }));
});

describe('Proxy Rotation Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProxy', () => {
    it('should return a valid proxy when available', async () => {
      // Setup mock proxy data
      const mockProxy = {
        _id: '507f1f77bcf86cd799439011',
        value: '192.168.1.1:8080',
        isValid: true,
        usageCount: 5,
        lastUsed: new Date('2023-01-01')
      };

      // Setup mock implementation
      (Proxy.aggregate as jest.Mock).mockResolvedValue([mockProxy]);
      (Proxy.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProxy);

      // Call the function
      const result = await ProxyService.getProxy('linkedin');

      // Verify the result
      expect(result).toEqual(mockProxy);

      // Verify that the aggregate function was called correctly
      expect(Proxy.aggregate).toHaveBeenCalledWith([
        { $match: { isValid: true } },
        { $sort: { usageCount: 1, lastUsed: 1 } },
        { $limit: 1 }
      ]);

      // Verify that the findByIdAndUpdate function was called to update usage
      expect(Proxy.findByIdAndUpdate).toHaveBeenCalledWith(
        mockProxy._id,
        {
          $inc: { usageCount: 1 },
          lastUsed: expect.any(Date)
        }
      );
    });

    it('should return null when no valid proxies are available', async () => {
      // Setup empty proxy data
      (Proxy.aggregate as jest.Mock).mockResolvedValue([]);

      // Call the function
      const result = await ProxyService.getProxy('linkedin');

      // Verify the result is null
      expect(result).toBeNull();

      // Verify that findByIdAndUpdate was not called
      expect(Proxy.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should return null when an error occurs', async () => {
      // Setup mock error
      (Proxy.aggregate as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Call the function
      const result = await ProxyService.getProxy('linkedin');

      // Verify the result is null
      expect(result).toBeNull();
    });
  });

  describe('reportProxyStatus', () => {
    it('should mark a proxy as invalid when reporting blocked status', async () => {
      // Setup mock proxy data
      const mockProxy = {
        _id: '507f1f77bcf86cd799439011',
        value: '192.168.1.1:8080',
        isValid: true,
        save: jest.fn().mockResolvedValue(true)
      };

      // Setup mongoose isValid check to pass
      (mongoose.Types.ObjectId.isValid as jest.Mock) = jest.fn().mockReturnValue(true);
      (Proxy.findById as jest.Mock).mockResolvedValue(mockProxy);

      // Call the function
      await ProxyService.reportProxyStatus('507f1f77bcf86cd799439011', ProxyStatus.BLOCKED, 'IP blocked by LinkedIn');

      // Verify the proxy was updated correctly
      expect(mockProxy.isValid).toBe(false);
      expect(mockProxy.save).toHaveBeenCalled();
    });

    it('should not update for successful proxy status', async () => {
      // Setup mock proxy data
      const mockProxy = {
        _id: '507f1f77bcf86cd799439011',
        value: '192.168.1.1:8080',
        isValid: true,
        save: jest.fn().mockResolvedValue(true)
      };

      // Setup mongoose isValid check to pass
      (mongoose.Types.ObjectId.isValid as jest.Mock) = jest.fn().mockReturnValue(true);
      (Proxy.findById as jest.Mock).mockResolvedValue(mockProxy);

      // Call the function
      await ProxyService.reportProxyStatus('507f1f77bcf86cd799439011', ProxyStatus.SUCCESS);

      // Verify isValid remains true
      expect(mockProxy.isValid).toBe(true);
      expect(mockProxy.save).toHaveBeenCalled();
    });

    it('should handle invalid proxy ID', async () => {
      // Setup mongoose isValid check to fail
      (mongoose.Types.ObjectId.isValid as jest.Mock) = jest.fn().mockReturnValue(false);

      // Call the function
      await ProxyService.reportProxyStatus('invalid-id', ProxyStatus.SUCCESS);

      // Verify findById was not called
      expect(Proxy.findById).not.toHaveBeenCalled();
    });

    it('should handle proxy not found', async () => {
      // Setup mongoose isValid check to pass
      (mongoose.Types.ObjectId.isValid as jest.Mock) = jest.fn().mockReturnValue(true);
      (Proxy.findById as jest.Mock).mockResolvedValue(null);

      // Call the function
      await ProxyService.reportProxyStatus('507f1f77bcf86cd799439011', ProxyStatus.SUCCESS);

      // Function should complete without error
      expect(Proxy.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  describe('parseProxyValue', () => {
    it('should correctly parse a proxy with http protocol', () => {
      const result = ProxyService.parseProxyValue('http://192.168.1.1:8080');

      expect(result).toEqual({
        host: '192.168.1.1',
        port: 8080,
        username: undefined,
        password: undefined
      });
    });

    it('should correctly parse a proxy without protocol', () => {
      const result = ProxyService.parseProxyValue('192.168.1.1:8080');

      expect(result).toEqual({
        host: '192.168.1.1',
        port: 8080,
        username: undefined,
        password: undefined
      });
    });

    it('should correctly parse a proxy with authentication', () => {
      const result = ProxyService.parseProxyValue('http://user:pass@192.168.1.1:8080');

      expect(result).toEqual({
        host: '192.168.1.1',
        port: 8080,
        username: 'user',
        password: 'pass'
      });
    });

    it('should return null for invalid proxy value', () => {
      const result = ProxyService.parseProxyValue('invalid-proxy');
      expect(result).toBeNull();
    });
  });
});