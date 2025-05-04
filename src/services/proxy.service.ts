import mongoose from "mongoose";
import Proxy from "../models/Proxy.model";
import { ProxyStatus } from "../interfaces/Proxy.interface";
import Logger from "../helpers/Logger";

const logger = new Logger({ context: "proxy-service" });

/**
 * Service for managing proxy rotation and selection
 */
export class ProxyService {
  /**
   * Get a proxy for use with a specific service
   *
   * @param serviceType - Type of service using the proxy (e.g., 'linkedin', 'email')
   * @returns A valid proxy or null if none is available
   */
  public static async getProxy(serviceType: string): Promise<any> {
    try {
      const pipeline = [
        // Only use valid proxies
        { $match: { isValid: true } },
        // Sort by usage count (prefer less used) and last used time (prefer older)
        { $sort: { usageCount: 1, lastUsed: 1 } },
        // Limit to 1 result
        { $limit: 1 }
      ];

      const proxies = await Proxy.aggregate(pipeline);

      if (proxies.length === 0) {
        logger.warn(`No valid proxies available for service: ${serviceType}`);
        return null;
      }

      const proxy = proxies[0];

      // Update the proxy's usage information
      await Proxy.findByIdAndUpdate(proxy._id, {
        $inc: { usageCount: 1 },
        lastUsed: new Date()
      });

      logger.info(`Selected proxy ${proxy.value} for service: ${serviceType}`);

      return proxy;
    } catch (error) {
      logger.error(`Error getting proxy for service ${serviceType}:`, error);
      return null;
    }
  }

  /**
   * Report proxy status to adjust rotation
   *
   * @param proxyId - ID of the proxy
   * @param status - Status of the proxy (success, blocked, error)
   * @param detail - Optional detail about the status
   */
  public static async reportProxyStatus(
    proxyId: string,
    status: ProxyStatus,
    detail?: string
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(proxyId)) {
        logger.warn(`Invalid proxy ID reported: ${proxyId}`);
        return;
      }

      const proxy = await Proxy.findById(proxyId);
      if (!proxy) {
        logger.warn(`Proxy not found for ID: ${proxyId}`);
        return;
      }

      switch (status) {
        case ProxyStatus.SUCCESS:
          // If success, no changes needed - lastUsed is already updated by getProxy
          break;

        case ProxyStatus.BLOCKED:
          // Mark as invalid if blocked
          proxy.isValid = false;
          logger.warn(`Proxy ${proxy.value} marked as blocked: ${detail}`);
          break;

        case ProxyStatus.ERROR:
          // If error occurs, we don't immediately mark as invalid
          // but we log it for monitoring
          logger.warn(`Proxy ${proxy.value} reported error: ${detail}`);
          break;

        default:
          logger.warn(`Unknown proxy status reported: ${status}`);
          break;
      }

      await proxy.save();
    } catch (error) {
      logger.error(`Error reporting proxy status for ${proxyId}:`, error);
    }
  }

  /**
   * Get proxy by value instead of ID
   *
   * @param value - Proxy value (e.g., "host:port")
   * @returns Proxy document or null
   */
  public static async getProxyByValue(value: string): Promise<any> {
    try {
      return await Proxy.findOne({ value });
    } catch (error) {
      logger.error(`Error finding proxy by value ${value}:`, error);
      return null;
    }
  }

  /**
   * Parse a proxy value into host, port, username and password
   *
   * @param proxyValue - Proxy value string
   * @returns Parsed proxy parts or null if invalid
   */
  public static parseProxyValue(proxyValue: string): {
    host: string;
    port: number;
    username?: string;
    password?: string;
  } | null {
    try {
      let url = proxyValue;

      // Add http protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `http://${url}`;
      }

      const proxyUrl = new URL(url);

      return {
        host: proxyUrl.hostname,
        port: parseInt(proxyUrl.port || '80'),
        username: proxyUrl.username || undefined,
        password: proxyUrl.password || undefined
      };
    } catch (error) {
      logger.error(`Error parsing proxy value: ${proxyValue}`, error);
      return null;
    }
  }
}

export default ProxyService;