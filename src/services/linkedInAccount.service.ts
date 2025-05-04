import mongoose from "mongoose";
import LinkedInAccount from "../models/LinkedInAccount.model";
import Logger from "../helpers/Logger";
import ProxyService from "./proxy.service";

const logger = new Logger({ context: "linkedin-account-service" });

/**
 * Enum for LinkedIn account status reporting
 */
export enum LinkedInAccountStatus {
  SUCCESS = 'success',
  BLOCKED = 'blocked',
  INVALID_CREDENTIALS = 'invalid_credentials',
  ERROR = 'error'
}

/**
 * Service for managing LinkedIn account rotation and selection
 */
export class LinkedInAccountService {
  /**
   * Get a LinkedIn account for use in scraping operations
   *
   * @returns A valid LinkedIn account or null if none is available
   */
  public static async getAccount(): Promise<any> {
    try {
      const pipeline = [
        // Only use valid and unblocked accounts
        { $match: { isValid: true, isBlocked: false } },
        // Sort by usage count (prefer less used) and last used time (prefer older)
        { $sort: { usageCount: 1, lastUsed: 1 } },
        // Limit to 1 result
        { $limit: 1 }
      ];

      const accounts = await LinkedInAccount.aggregate(pipeline);

      if (accounts.length === 0) {
        logger.warn("No valid LinkedIn accounts available");
        return null;
      }

      const account = accounts[0];

      // Update the account's usage information
      await LinkedInAccount.findByIdAndUpdate(account._id, {
        $inc: { usageCount: 1 },
        lastUsed: new Date()
      });

      logger.info(`Selected LinkedIn account: ${account.name}`);

      return account;
    } catch (error) {
      logger.error("Error getting LinkedIn account:", error);
      return null;
    }
  }

  /**
   * Get an optimal account and proxy pair for LinkedIn operations
   *
   * @returns Object with account and proxy, or null if unavailable
   */
  public static async getAccountWithProxy(): Promise<{ account: any; proxy: any } | null> {
    try {
      const account = await this.getAccount();
      if (!account) {
        return null;
      }

      const proxy = await ProxyService.getProxy('linkedin');
      if (!proxy) {
        logger.warn("No valid proxies available for LinkedIn operations");
      }

      return { account, proxy };
    } catch (error) {
      logger.error("Error getting LinkedIn account with proxy:", error);
      return null;
    }
  }

  /**
   * Report LinkedIn account status to adjust rotation
   *
   * @param accountId - ID of the LinkedIn account
   * @param status - Status of the account
   * @param detail - Optional detail about the status
   */
  public static async reportAccountStatus(
    accountId: string,
    status: LinkedInAccountStatus,
    detail?: string
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        logger.warn(`Invalid LinkedIn account ID reported: ${accountId}`);
        return;
      }

      const account = await LinkedInAccount.findById(accountId);
      if (!account) {
        logger.warn(`LinkedIn account not found for ID: ${accountId}`);
        return;
      }

      switch (status) {
        case LinkedInAccountStatus.SUCCESS:
          // If success, just ensure the account is marked as valid
          if (!account.isValid) {
            account.isValid = true;
            account.isBlocked = false;
            logger.info(`LinkedIn account ${account.name} marked as valid`);
          }
          break;

        case LinkedInAccountStatus.BLOCKED:
          // Mark as blocked
          account.isBlocked = true;
          logger.warn(`LinkedIn account ${account.name} marked as blocked: ${detail}`);
          break;

        case LinkedInAccountStatus.INVALID_CREDENTIALS:
          // Mark as invalid but not blocked (credentials need update)
          account.isValid = false;
          logger.warn(`LinkedIn account ${account.name} has invalid credentials: ${detail}`);
          break;

        case LinkedInAccountStatus.ERROR:
          // Log the error but don't change status
          logger.warn(`LinkedIn account ${account.name} reported error: ${detail}`);
          break;

        default:
          logger.warn(`Unknown LinkedIn account status reported: ${status}`);
          break;
      }

      await account.save();
    } catch (error) {
      logger.error(`Error reporting LinkedIn account status for ${accountId}:`, error);
    }
  }

  /**
   * Get account statistics for monitoring
   */
  public static async getAccountStats(): Promise<any> {
    try {
      const stats = await LinkedInAccount.aggregate([
        {
          $facet: {
            "byStatus": [
              {
                $group: {
                  _id: {
                    isValid: "$isValid",
                    isBlocked: "$isBlocked"
                  },
                  count: { $sum: 1 }
                }
              }
            ],
            "usageStats": [
              {
                $group: {
                  _id: null,
                  totalAccounts: { $sum: 1 },
                  totalUsage: { $sum: "$usageCount" },
                  avgUsage: { $avg: "$usageCount" },
                  maxUsage: { $max: "$usageCount" },
                  minUsage: { $min: "$usageCount" }
                }
              }
            ]
          }
        }
      ]);

      return stats[0];
    } catch (error) {
      logger.error("Error getting LinkedIn account stats:", error);
      return null;
    }
  }
}

export default LinkedInAccountService;