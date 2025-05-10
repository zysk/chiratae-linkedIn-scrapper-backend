import { WebDriver } from 'selenium-webdriver';
import { IProxy } from '../../models/proxy.model';
import SeleniumService from './SeleniumService';
import logger from '../../utils/logger';
import LinkedInAuthService from '../linkedin/LinkedInAuthService';
import { ILinkedInAccount } from '../../models/linkedinAccount.model';

/**
 * Interface for session information
 */
interface SessionInfo {
  driver: WebDriver;
  accountId: string;
  username: string;
  lastUsed: Date;
}

/**
 * Manages WebDriver instances across the application.
 * Ensures one WebDriver instance per campaign and proper cleanup.
 */
export class WebDriverManager {
  private static instance: WebDriverManager;
  private activeDrivers: Map<string, WebDriver> = new Map();
  private lastUsedAccount: Map<string, string> = new Map(); // Map campaign IDs to account IDs
  private seleniumService: typeof SeleniumService;
  private linkedInAuthService: typeof LinkedInAuthService;
  private activeSessions: Map<string, SessionInfo> = new Map(); // Map account usernames to session info

  private constructor() {
    this.seleniumService = SeleniumService;
    this.linkedInAuthService = LinkedInAuthService;
  }

  /**
   * Get the singleton instance of WebDriverManager
   */
  public static getInstance(): WebDriverManager {
    if (!WebDriverManager.instance) {
      WebDriverManager.instance = new WebDriverManager();
    }
    return WebDriverManager.instance;
  }

  /**
   * Get an existing WebDriver for a campaign or create a new one
   * @param campaignId The campaign ID
   * @param options Options for creating a new WebDriver if needed
   * @returns A WebDriver instance
   */
  public async getDriver(
    campaignId: string,
    options: {
      headless?: boolean;
      proxy?: IProxy;
      userAgent?: string;
      forceNew?: boolean;
      linkedInAccount?: ILinkedInAccount;
      password?: string;
    } = {}
  ): Promise<WebDriver> {
    try {
      // Check if we need to force a new driver instance
      if (options.forceNew === true) {
        // Quit existing driver if present
        await this.quitDriver(campaignId);
      }

      // Check if we already have an active driver for this campaign
      const existingDriver = this.activeDrivers.get(campaignId);
      if (existingDriver) {
        try {
          // Check if the driver is still valid
          await existingDriver.getTitle();
          logger.info(`Reusing existing WebDriver for campaign ${campaignId}`);
          return existingDriver;
        } catch (error) {
          // Driver is invalid, remove it and create a new one
          logger.warn(`Existing WebDriver for campaign ${campaignId} is invalid, creating a new one`);
          this.activeDrivers.delete(campaignId);
        }
      }

      // If LinkedIn account is provided, check for existing session
      if (options.linkedInAccount) {
        const existingSession = this.activeSessions.get(options.linkedInAccount.username);
        if (existingSession) {
          try {
            // Verify the session is still valid
            const isLoggedIn = await this.linkedInAuthService.isLoggedIn(existingSession.driver);
            if (isLoggedIn) {
              logger.info(`Reusing existing LinkedIn session for ${options.linkedInAccount.username}`);
              this.activeDrivers.set(campaignId, existingSession.driver);
              this.lastUsedAccount.set(campaignId, existingSession.accountId);
              existingSession.lastUsed = new Date();
              return existingSession.driver;
            } else {
              // Session expired, remove it
              logger.warn(`LinkedIn session expired for ${options.linkedInAccount.username}, creating new one`);
              await this.quitSession(options.linkedInAccount.username);
            }
          } catch (error) {
            // Session invalid, remove it
            logger.warn(`Invalid LinkedIn session for ${options.linkedInAccount.username}, creating new one`);
            await this.quitSession(options.linkedInAccount.username);
          }
        }
      }

      // Create a new driver
      logger.info(`Creating new WebDriver for campaign ${campaignId}`);
      const driver = await this.seleniumService.createDriver({
        headless: options.headless,
        proxy: options.proxy,
        userAgent: options.userAgent
      });

      // If LinkedIn account is provided, log in and store the session
      if (options.linkedInAccount && options.password) {
        logger.info(`Logging in to LinkedIn as ${options.linkedInAccount.username}`);
        const loginResult = await this.linkedInAuthService.login(options.linkedInAccount, options.password, options.proxy);

        if (!loginResult.success || !loginResult.driver) {
          await this.seleniumService.quitDriver(driver);
          throw new Error(`Failed to login to LinkedIn: ${loginResult.message}`);
        }

        // Store the session
        this.activeSessions.set(options.linkedInAccount.username, {
          driver: loginResult.driver,
          accountId: options.linkedInAccount._id.toString(),
          username: options.linkedInAccount.username,
          lastUsed: new Date()
        });

        // Use the logged-in driver
        this.activeDrivers.set(campaignId, loginResult.driver);
        this.lastUsedAccount.set(campaignId, options.linkedInAccount._id.toString());
        return loginResult.driver;
      }

      // Store the driver
      this.activeDrivers.set(campaignId, driver);
      return driver;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error getting WebDriver for campaign ${campaignId}: ${errorMessage}`);
      throw new Error(`Failed to get WebDriver: ${errorMessage}`);
    }
  }

  /**
   * Get an existing LinkedIn session if available
   * @param username LinkedIn account username
   * @returns WebDriver instance if session exists and is valid, null otherwise
   */
  public async getExistingSession(username: string): Promise<WebDriver | null> {
    const session = this.activeSessions.get(username);
    if (!session) return null;

    try {
      const isLoggedIn = await this.linkedInAuthService.isLoggedIn(session.driver);
      if (isLoggedIn) {
        session.lastUsed = new Date();
        return session.driver;
      } else {
        await this.quitSession(username);
      }
    } catch (error) {
      await this.quitSession(username);
    }
    return null;
  }

  /**
   * Quit a specific LinkedIn session
   * @param username LinkedIn account username
   */
  private async quitSession(username: string): Promise<void> {
    const session = this.activeSessions.get(username);
    if (session) {
      try {
        await this.seleniumService.quitDriver(session.driver);
      } catch (error) {
        logger.error(`Error quitting session for ${username}: ${error instanceof Error ? error.message : String(error)}`);
      }
      this.activeSessions.delete(username);
    }
  }

  /**
   * Quit a WebDriver for a specific campaign
   * @param campaignId The campaign ID
   */
  public async quitDriver(campaignId: string): Promise<void> {
    try {
      const driver = this.activeDrivers.get(campaignId);
      if (driver) {
        logger.info(`Quitting WebDriver for campaign ${campaignId}`);
        await this.seleniumService.quitDriver(driver);
        this.activeDrivers.delete(campaignId);
        this.lastUsedAccount.delete(campaignId);

        // Remove any associated sessions
        for (const [username, session] of this.activeSessions.entries()) {
          if (session.driver === driver) {
            this.activeSessions.delete(username);
            break;
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error quitting WebDriver for campaign ${campaignId}: ${errorMessage}`);
    }
  }

  /**
   * Quit all active WebDriver instances
   */
  public async quitAllDrivers(): Promise<void> {
    try {
      logger.info('Quitting all WebDriver instances');
      await this.seleniumService.quitAllDrivers();
      this.activeDrivers.clear();
      this.lastUsedAccount.clear();
      this.activeSessions.clear();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error quitting all WebDrivers: ${errorMessage}`);
    }
  }

  /**
   * Associate a LinkedIn account with a campaign
   * @param campaignId The campaign ID
   * @param accountId The LinkedIn account ID
   */
  public setAccountForCampaign(campaignId: string, accountId: string): void {
    this.lastUsedAccount.set(campaignId, accountId);
  }

  /**
   * Get the LinkedIn account ID last used for a campaign
   * @param campaignId The campaign ID
   * @returns The LinkedIn account ID or undefined if none was set
   */
  public getAccountForCampaign(campaignId: string): string | undefined {
    return this.lastUsedAccount.get(campaignId);
  }

  /**
   * Check if a WebDriver is already active for a campaign
   * @param campaignId The campaign ID
   * @returns True if there is an active driver, false otherwise
   */
  public hasActiveDriver(campaignId: string): boolean {
    return this.activeDrivers.has(campaignId);
  }
}

export default WebDriverManager.getInstance();
