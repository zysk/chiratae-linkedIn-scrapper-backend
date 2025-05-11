import { WebDriver } from 'selenium-webdriver';
import { IProxy } from '../../models/proxy.model';
import { SeleniumService } from './SeleniumService';
import logger from '../../utils/logger';
import { LinkedInAuthService } from '../linkedin/LinkedInAuthService';
import { ILinkedInAccount } from '../../models/linkedinAccount.model';
import { CONFIG } from '../../utils/config';

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
  private sessions: Map<string, SessionInfo> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(
      () => this.cleanupInactiveSessions(),
      CONFIG.BROWSER.SESSION_CLEANUP_INTERVAL
    );
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
   * Get or create a WebDriver instance for a campaign
   */
  public async getDriver(
    campaignId: string,
    options: {
      headless?: boolean;
      proxy?: IProxy;
      linkedInAccount: ILinkedInAccount;
    }
  ): Promise<WebDriver> {
    const { linkedInAccount, proxy } = options;
    const sessionKey = `${campaignId}:${linkedInAccount.id}`;

    // Check for existing valid session
    const existingSession = this.sessions.get(sessionKey);
    if (existingSession) {
      // Update last used time
      existingSession.lastUsed = new Date();
      this.sessions.set(sessionKey, existingSession);
      return existingSession.driver;
    }

    // Create new session
    const driver = await SeleniumService.getInstance().createDriver(options);

    // Get the decrypted password
    const password = linkedInAccount.getPassword();
    if (!password) {
      throw new Error('Failed to decrypt LinkedIn account password');
    }

    // Authenticate with LinkedIn
    const loginResult = await LinkedInAuthService.getInstance().login(linkedInAccount, password, proxy);
    if (!loginResult.success || !loginResult.driver) {
      await SeleniumService.getInstance().quitDriver(driver);
      throw new Error(`Failed to login to LinkedIn: ${loginResult.message}`);
    }

    // Store session info
    this.sessions.set(sessionKey, {
      driver: loginResult.driver,
      accountId: linkedInAccount.id,
      username: linkedInAccount.username,
      lastUsed: new Date()
    });

    return loginResult.driver;
  }

  /**
   * Clean up inactive sessions
   */
  private async cleanupInactiveSessions(): Promise<void> {
    const now = new Date().getTime();
    const maxAge = CONFIG.BROWSER.SESSION_MAX_AGE;

    for (const [sessionKey, sessionInfo] of this.sessions.entries()) {
      const sessionAge = now - sessionInfo.lastUsed.getTime();
      if (sessionAge > maxAge) {
        try {
          await SeleniumService.getInstance().quitDriver(sessionInfo.driver);
          this.sessions.delete(sessionKey);
          logger.info(`Cleaned up inactive session for ${sessionInfo.username}`);
        } catch (error) {
          logger.error(`Error cleaning up session: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  /**
   * Clean up all sessions
   */
  public async cleanup(): Promise<void> {
    clearInterval(this.cleanupInterval);

    for (const [sessionKey, sessionInfo] of this.sessions.entries()) {
      try {
        await SeleniumService.getInstance().quitDriver(sessionInfo.driver);
        this.sessions.delete(sessionKey);
      } catch (error) {
        logger.error(`Error cleaning up session: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Get an existing WebDriver instance if available
   * This allows checking for an existing driver without creating a new one
   * @param campaignId Campaign ID or session identifier
   * @returns WebDriver instance if one exists, null otherwise
   */
  public getExistingDriver(campaignId: string): WebDriver | null {
    // Look for any session that matches this campaign ID
    for (const [sessionKey, sessionInfo] of this.sessions.entries()) {
      if (sessionKey.startsWith(`${campaignId}:`)) {
        // Update last used time
        sessionInfo.lastUsed = new Date();
        this.sessions.set(sessionKey, sessionInfo);
        logger.info(`Found existing driver for campaign ${campaignId}`);
        return sessionInfo.driver;
      }
    }

    // No existing driver found
    logger.info(`No existing driver found for campaign ${campaignId}`);
    return null;
  }
}

export default WebDriverManager.getInstance();
