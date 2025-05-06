import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import LinkedInAccount from '../models/linkedinAccount.model';
import Proxy from '../models/proxy.model';
import LinkedInAuthService, { LoginResult } from '../services/linkedin/LinkedInAuthService';
import LinkedInSearchService, { SearchParams } from '../services/linkedin/LinkedInSearchService';
import SeleniumService from '../services/selenium/SeleniumService';
import logger from '../utils/logger';
import { normalizeLinkedInUrl } from '../utils/linkedin.utils';

/**
 * Controller for LinkedIn operations
 */
class LinkedInController {
  /**
   * Test LinkedIn account login
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public testLogin = async (req: Request, res: Response, next: NextFunction) => {
    let loginResult: LoginResult | null = null;

    logger.warn(`Test login request: ${JSON.stringify(req.body)}`);
    try {
      const { accountId, password, proxyId } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn account ID is required',
        });
      }

      // Get LinkedIn account
      const account = await LinkedInAccount.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'LinkedIn account not found',
        });
      }

      // Get proxy if provided
      let proxy = undefined;
      if (proxyId) {
        proxy = await Proxy.findById(proxyId);
        if (!proxy) {
          return res.status(404).json({
            success: false,
            message: 'Proxy not found',
          });
        }
      }

      // Attempt login
      loginResult = await LinkedInAuthService.login(account, password, proxy);

      // Check if login was successful
      if (!loginResult.driver) {
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize WebDriver',
        });
      }

      const isLoggedIn = await LinkedInAuthService.isLoggedIn(loginResult.driver);

      if (isLoggedIn) {
        // Increment account usage
        await LinkedInAccount.incrementUsage(account._id);

        // If proxy was used, increment its usage too
        if (proxy) {
          await Proxy.incrementUsage(proxy._id);
        }

        return res.status(200).json({
          success: true,
          message: 'Successfully logged in to LinkedIn',
          data: {
            account: {
              id: account._id,
              username: account.username,
            },
            proxy: proxy ? {
              id: proxy._id,
              host: proxy.host,
              port: proxy.port,
            } : null,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Failed to login to LinkedIn. Account credentials may be incorrect or account may require verification.',
        });
      }
    } catch (error) {
      logger.error(`Test login error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while testing LinkedIn login',
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      // Always clean up the driver
      if (loginResult && loginResult.driver) {
        try {
          await SeleniumService.quitDriver(loginResult.driver);
        } catch (error) {
          logger.error(`Error quitting driver: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  };

  /**
   * Search LinkedIn profiles
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public searchProfiles = async (req: Request, res: Response, next: NextFunction) => {
    let loginResult: LoginResult | null = null;

    try {
      const { accountId, password, proxyId, keywords, filters, maxResults } = req.body;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn account ID is required',
        });
      }

      if (!keywords) {
        return res.status(400).json({
          success: false,
          message: 'Search keywords are required',
        });
      }

      // Get LinkedIn account
      const account = await LinkedInAccount.findById(accountId);
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'LinkedIn account not found',
        });
      }

      // Get proxy if provided
      let proxy = undefined;
      if (proxyId) {
        proxy = await Proxy.findById(proxyId);
        if (!proxy) {
          return res.status(404).json({
            success: false,
            message: 'Proxy not found',
          });
        }
      }

      // Login to LinkedIn
      loginResult = await LinkedInAuthService.login(account, password, proxy);

      if (!loginResult.driver) {
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize WebDriver',
        });
      }

      // Check if login was successful
      const isLoggedIn = await LinkedInAuthService.isLoggedIn(loginResult.driver);
      if (!isLoggedIn) {
        return res.status(401).json({
          success: false,
          message: 'Failed to login to LinkedIn. Account credentials may be incorrect or account may require verification.',
        });
      }

      // Prepare search parameters
      const searchParams: SearchParams = {
        keywords,
        filters,
        maxResults: maxResults || 10,
      };

      // Perform search
      const searchResults = await LinkedInSearchService.search(loginResult.driver, searchParams);

      // Increment usage counters
      await LinkedInAccount.incrementUsage(account._id);
      if (proxy) {
        await Proxy.incrementUsage(proxy._id);
      }

      return res.status(200).json({
        success: true,
        message: 'LinkedIn profile search completed',
        data: {
          results: searchResults,
          count: searchResults.length,
        },
      });
    } catch (error) {
      logger.error(`Search profiles error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while searching LinkedIn profiles',
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      // Always clean up the driver
      if (loginResult && loginResult.driver) {
        try {
          await SeleniumService.quitDriver(loginResult.driver);
        } catch (error) {
          logger.error(`Error quitting driver: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  };

  /**
   * Get next available LinkedIn account
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public getNextAccount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get available accounts sorted by usage
      const accounts = await LinkedInAccount.findAvailable();

      if (!accounts || accounts.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No available LinkedIn accounts found',
        });
      }

      // Return the first (least used) account
      const account = accounts[0];

      return res.status(200).json({
        success: true,
        message: 'Retrieved next available LinkedIn account',
        data: {
          id: account._id,
          username: account.username,
          email: account.email,
          usageCount: account.usageCount,
          lastUsed: account.lastUsed,
        },
      });
    } catch (error) {
      logger.error(`Get next account error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while getting the next LinkedIn account',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  /**
   * Get next available proxy
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public getNextProxy = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get available proxies sorted by usage
      const proxies = await Proxy.findAvailable();

      if (!proxies || proxies.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No available proxies found',
        });
      }

      // Return the first (least used) proxy
      const proxy = proxies[0];

      return res.status(200).json({
        success: true,
        message: 'Retrieved next available proxy',
        data: {
          id: proxy._id,
          host: proxy.host,
          port: proxy.port,
          protocol: proxy.protocol,
          usageCount: proxy.usageCount || 0,
          lastUsed: proxy.lastUsed || null,
        },
      });
    } catch (error) {
      logger.error(`Get next proxy error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while getting the next proxy',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

export default new LinkedInController();
