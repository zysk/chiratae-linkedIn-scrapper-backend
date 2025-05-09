import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import LinkedInAccount from '../models/linkedinAccount.model';
import Proxy from '../models/proxy.model';
import LinkedInAuthService, { LoginResult } from '../services/linkedin/LinkedInAuthService';
import LinkedInSearchService, { SearchParams } from '../services/linkedin/LinkedInSearchService';
import SeleniumService from '../services/selenium/SeleniumService';
import logger from '../utils/logger';
import { normalizeLinkedInUrl } from '../utils/linkedin.utils';
import Campaign, { CampaignStatus } from '../models/campaign.model';
import Lead from '../models/lead.model';

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

    try {
      const { linkedinAccountId, password, proxyId } = req.body;

      if (!linkedinAccountId) {
        return res.status(400).json({
          success: false,
          message: 'LinkedIn account ID is required',
        });
      }

      // Get LinkedIn account
      const account = await LinkedInAccount.findById(linkedinAccountId);
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

		logger.info(`Login result: ${JSON.stringify(loginResult)}`);
      // Check if login was successful
      if (!loginResult.driver) {
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize WebDriver',
        });
      }

      // Check for authentication challenges
      if (loginResult.captcha.challengePresent) {
        // CAPTCHA challenge detected
        return res.status(403).json({
          success: false,
          message: 'CAPTCHA verification required',
          challengeType: 'captcha',
          challengeDetails: loginResult.captcha
        });
      }

      if (loginResult.otp.verificationRequired) {
        // OTP verification required
        return res.status(403).json({
          success: false,
          message: 'One-time password verification required',
          challengeType: 'otp',
          challengeDetails: loginResult.otp
        });
      }

      if (loginResult.phoneVerification.verificationRequired) {
        // Phone verification required
        return res.status(403).json({
          success: false,
          message: 'Phone verification required',
          challengeType: 'phone',
          challengeDetails: loginResult.phoneVerification
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
          loginStatus: loginResult
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
      const { linkedinAccountId, password, proxyId, keywords, filters, maxResults, campaignId } = req.body;

      if (!linkedinAccountId) {
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
      const account = await LinkedInAccount.findById(linkedinAccountId);
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

      // Get campaign if provided
      let campaign = undefined;
      if (campaignId) {
        campaign = await Campaign.findById(campaignId);
        if (!campaign) {
          return res.status(404).json({
            success: false,
            message: 'Campaign not found',
          });
        }

        // Update campaign status to running
        await Campaign.findByIdAndUpdate(campaignId, {
          status: CampaignStatus.RUNNING,
          startedAt: new Date(),
        });
      }

      // Login to LinkedIn
      loginResult = await LinkedInAuthService.login(account, password, proxy);

		logger.info(`Login result: ${JSON.stringify(loginResult)}`);

      if (!loginResult.driver) {
        return res.status(500).json({
          success: false,
          message: 'Failed to initialize WebDriver',
        });
      }

      // Check for authentication challenges
      if (loginResult.captcha.challengePresent) {
        // CAPTCHA challenge detected
        return res.status(403).json({
          success: false,
          message: 'CAPTCHA verification required',
          challengeType: 'captcha',
          challengeDetails: loginResult.captcha
        });
      }

      if (loginResult.otp.verificationRequired) {
        // OTP verification required
        return res.status(403).json({
          success: false,
          message: 'One-time password verification required',
          challengeType: 'otp',
          challengeDetails: loginResult.otp
        });
      }

      if (loginResult.phoneVerification.verificationRequired) {
        // Phone verification required
        return res.status(403).json({
          success: false,
          message: 'Phone verification required',
          challengeType: 'phone',
          challengeDetails: loginResult.phoneVerification
        });
      }

      // Check if login was successful
      const isLoggedIn = await LinkedInAuthService.isLoggedIn(loginResult.driver);
      if (!isLoggedIn) {
        return res.status(401).json({
          success: false,
          message: 'Failed to login to LinkedIn. Account credentials may be incorrect.',
          loginStatus: loginResult
        });
      }

      // Increment account usage
      await LinkedInAccount.incrementUsage(account._id);

      // If proxy was used, increment its usage too
      if (proxy) {
        await Proxy.incrementUsage(proxy._id);
      }

      // Prepare search parameters
      const searchParams: SearchParams = {
        keywords,
        filters,
        maxResults: maxResults || 10,
        campaignId,
      };

      // Perform search
      const searchResults = await LinkedInSearchService.search(loginResult.driver, searchParams);

      // Store results in campaign if provided
      if (campaign && searchResults.length > 0) {
        // Create leads from search results
        const leads = searchResults.map(profile => {
          return {
            campaignId: campaign?._id,
            clientId: profile.profileId,
            profileUrl: profile.profileUrl,
            name: profile.name,
            headline: profile.headline,
            location: profile.location,
            currentCompany: profile.currentCompany,
            imageUrl: profile.imageUrl,
            isOpenToWork: profile.isOpenToWork,
            connectionDegree: profile.connectionDegree,
            // Set additional fields for new leads
            status: 'NEW',
            isSearched: false,
            createdAt: new Date(),
          };
        });

        // Check for existing leads to avoid duplicates
        const clientIds = leads.map(lead => lead.clientId);
        const existingLeads = await Lead.find({
          clientId: { $in: clientIds },
          campaignId: campaign._id
        });

        // Filter out duplicates
        const existingClientIdSet = new Set(existingLeads.map(lead => lead.clientId));
        const newLeads = leads.filter(lead => !existingClientIdSet.has(lead.clientId));

        // Insert new leads
        if (newLeads.length > 0) {
          await Lead.insertMany(newLeads);

          // Update campaign stats
          await Campaign.findByIdAndUpdate(campaignId, {
            $inc: { 'stats.profilesFound': newLeads.length },
            $set: { lastRunAt: new Date() }
          });
        }

        // Return search results with new/existing status
        return res.status(200).json({
          success: true,
          message: 'LinkedIn search completed successfully',
          data: {
            resultsCount: searchResults.length,
            newResults: newLeads.length,
            duplicates: searchResults.length - newLeads.length,
            results: searchResults.map(profile => {
              // Create a new object to avoid modifying the original
              return {
                profileId: profile.profileId,
                name: profile.name,
                headline: profile.headline,
                profileUrl: profile.profileUrl,
                // Check if this profile was already in the database
                isNew: !existingClientIdSet.has(profile.profileId)
              };
            })
          },
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'LinkedIn search completed successfully',
          data: {
            resultsCount: searchResults.length,
            results: searchResults
          },
        });
      }
    } catch (error) {
      logger.error(`LinkedIn search error: ${error instanceof Error ? error.message : String(error)}`);

      // Update campaign status if it was provided and there was an error
      if (req.body.campaignId) {
        try {
          await Campaign.findByIdAndUpdate(req.body.campaignId, {
            status: CampaignStatus.FAILED,
            error: error instanceof Error ? error.message : String(error)
          });
        } catch (updateError) {
          logger.error(`Error updating campaign status: ${updateError}`);
        }
      }

      return res.status(500).json({
        success: false,
        message: 'An error occurred during LinkedIn search',
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
