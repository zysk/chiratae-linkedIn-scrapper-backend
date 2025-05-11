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
import { LinkedInProfileScraper } from '../services/linkedin/LinkedInProfileScraper';
import fs from 'fs/promises';
import path from 'path';
import { SelectorVerifier, SelectorHealthMetrics } from '../services/linkedin/SelectorVerifier';

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

  /**
   * Verify LinkedIn selectors
   * Tests selectors against a LinkedIn profile and returns health metrics
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public verifySelectors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { linkedinAccountId, password, proxyId, profileUrl, useLatestLead, outputPath } = req.body;

      // At least one of profileUrl or useLatestLead is required
      if (!profileUrl && !useLatestLead) {
        return res.status(400).json({
          success: false,
          message: 'Either a profile URL or useLatestLead flag must be provided',
        });
      }

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

      // Determine which profile URL to use
      let targetProfileUrl = profileUrl;

      if (useLatestLead) {
        // Find the most recent lead with a valid LinkedIn profile URL
        const latestLead = await Lead.findOne({
          link: { $exists: true, $ne: '' }
        }).sort({ createdAt: -1 }).limit(1);

        if (!latestLead || !latestLead.link) {
          return res.status(404).json({
            success: false,
            message: 'No lead with a valid LinkedIn profile URL found',
          });
        }

        targetProfileUrl = latestLead.link;
        logger.info(`Using latest lead profile URL: ${targetProfileUrl}`);
      }

      // Enable selector debugging
      process.env.DEBUG_SELECTORS = 'true';

      // Run the selector verification
      logger.info(`Testing selectors against profile: ${targetProfileUrl}`);
      const healthMetrics = await LinkedInProfileScraper.verifySelectors(targetProfileUrl, account);

      // Convert Map to serializable object
      const metricsObj: Record<string, SelectorHealthMetrics> = {};
      healthMetrics.forEach((value: SelectorHealthMetrics, key: string) => {
        metricsObj[key] = value;
      });

      // Save to file if outputPath is specified
      if (outputPath) {
        try {
          const resolvedPath = path.resolve(outputPath);
          await fs.writeFile(
            resolvedPath,
            JSON.stringify(metricsObj, null, 2),
            'utf8'
          );
          logger.info(`Selector health metrics saved to ${resolvedPath}`);
        } catch (error) {
          logger.warn(`Error saving metrics to file: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Calculate summary statistics
      const categories = new Set<string>();
      let totalSelectors = 0;
      let workingSelectors = 0;

      for (const metrics of healthMetrics.values()) {
        categories.add(metrics.category);
        totalSelectors++;

        if (metrics.successRate > 0) {
          workingSelectors++;
        }
      }

      // Return the health metrics and summary
      return res.status(200).json({
        success: true,
        message: 'Selector verification completed successfully',
        data: {
          metrics: metricsObj,
          summary: {
            totalSelectors,
            workingSelectors,
            successRate: totalSelectors > 0 ? Math.round(workingSelectors / totalSelectors * 100) : 0,
            categories: Array.from(categories)
          },
          profileUsed: targetProfileUrl
        }
      });

    } catch (error) {
      logger.error(`Selector verification error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while verifying LinkedIn selectors',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  /**
   * Update LinkedIn selectors
   * Analyzes selector health metrics and allows updating/replacing poor performing selectors
   * @param req Request object
   * @param res Response object
   * @param next Next function
   */
  public updateSelectors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { metricsPath, threshold = 0.5, category } = req.body;

      if (!metricsPath) {
        return res.status(400).json({
          success: false,
          message: 'Path to selector health metrics file is required',
        });
      }

      // Read metrics from file
      const inputPath = path.resolve(metricsPath);
      logger.info(`Reading metrics from: ${inputPath}`);

      const metricsRaw = await fs.readFile(inputPath, 'utf8');
      const metricsObj = JSON.parse(metricsRaw);

      // Convert to Map for processing
      const healthMetrics = new Map<string, SelectorHealthMetrics>();
      for (const [key, value] of Object.entries(metricsObj)) {
        healthMetrics.set(key, value as SelectorHealthMetrics);
      }

      // Group by category
      const categorizedMetrics = new Map<string, SelectorHealthMetrics[]>();
      for (const metrics of healthMetrics.values()) {
        if (!categorizedMetrics.has(metrics.category)) {
          categorizedMetrics.set(metrics.category, []);
        }
        categorizedMetrics.get(metrics.category)?.push(metrics);
      }

      // Filter by specified category if provided
      const categoriesToProcess = category
        ? (categorizedMetrics.has(category) ? [category] : [])
        : Array.from(categorizedMetrics.keys());

      if (category && categoriesToProcess.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Category '${category}' not found in metrics file`,
        });
      }

      const thresholdValue = parseFloat(threshold.toString());

      // Process categories and identify selectors that need attention
      const results: any = {};

      for (const categoryName of categoriesToProcess) {
        const metrics = categorizedMetrics.get(categoryName)!;

        // Sort by success rate (descending)
        metrics.sort((a, b) => b.successRate - a.successRate);

        // Find poor performing selectors
        const poorSelectors = metrics.filter(m => m.successRate < thresholdValue);
        const goodSelectors = metrics.filter(m => m.successRate >= thresholdValue);

        results[categoryName] = {
          totalSelectors: metrics.length,
          goodSelectors: goodSelectors.length,
          poorSelectors: poorSelectors.length,
          best: goodSelectors.length > 0 ? goodSelectors[0] : null,
          needsAttention: poorSelectors.map(selector => ({
            selector: selector.selector,
            successRate: selector.successRate,
            successCount: selector.successCount,
            failureCount: selector.failureCount,
            lastText: selector.lastText
          }))
        };
      }

      return res.status(200).json({
        success: true,
        message: 'Selector analysis completed successfully',
        threshold: thresholdValue,
        data: results
      });

    } catch (error) {
      logger.error(`Selector update error: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while analyzing LinkedIn selectors',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

export default new LinkedInController();
