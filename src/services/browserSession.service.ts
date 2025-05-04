import { WebDriver } from 'selenium-webdriver';
import { Logger } from './logger.service';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Session data structure from browser
 */
export interface BrowserSessionData {
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage?: Record<string, string>;
  expiresAt?: Date;
  accountId?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for managing browser sessions
 */
export class BrowserSessionManager {
  private static instance: BrowserSessionManager;
  private logger: Logger;
  private sessionsDir: string;
  private sessions: Map<string, BrowserSessionData> = new Map();

  private constructor() {
    this.logger = new Logger('BrowserSessionManager');
    this.sessionsDir = path.join(process.cwd(), 'data', 'sessions');
    this.ensureSessionsDirectory();
    this.loadSessions();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BrowserSessionManager {
    if (!BrowserSessionManager.instance) {
      BrowserSessionManager.instance = new BrowserSessionManager();
    }
    return BrowserSessionManager.instance;
  }

  /**
   * Create sessions directory if it doesn't exist
   */
  private ensureSessionsDirectory(): void {
    try {
      if (!fs.existsSync(this.sessionsDir)) {
        fs.mkdirSync(this.sessionsDir, { recursive: true });
        this.logger.info(`Sessions directory created at ${this.sessionsDir}`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to create sessions directory: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load all saved sessions from disk
   */
  private loadSessions(): void {
    try {
      const files = fs.readdirSync(this.sessionsDir);
      const sessionFiles = files.filter(f => f.endsWith('.json'));

      this.logger.info(`Loading ${sessionFiles.length} saved sessions`);

      for (const file of sessionFiles) {
        try {
          const filePath = path.join(this.sessionsDir, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const session = JSON.parse(data) as BrowserSessionData;

          // Extract session ID from filename
          const sessionId = path.basename(file, '.json');

          // Skip expired sessions
          if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
            this.logger.info(`Skipping expired session: ${sessionId}`);
            fs.unlinkSync(filePath); // Delete expired session file
            continue;
          }

          this.sessions.set(sessionId, session);
        } catch (fileError: any) {
          this.logger.error(`Error loading session file ${file}: ${fileError.message}`);
        }
      }

      this.logger.info(`Loaded ${this.sessions.size} valid sessions`);
    } catch (error: any) {
      this.logger.error(`Failed to load sessions: ${error.message}`);
    }
  }

  /**
   * Save the current browser session
   *
   * @param driver WebDriver instance
   * @param accountId LinkedIn account ID (optional)
   * @param expirationHours Number of hours until the session expires (default: 24)
   * @param metadata Additional metadata to store with the session
   * @returns Session ID
   */
  public async saveSession(
    driver: WebDriver,
    accountId?: string,
    expirationHours: number = 24,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Get all cookies
      const cookies = await driver.manage().getCookies();

      // Get localStorage items (requires executing JavaScript)
      const localStorageScript = `
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            items[key] = localStorage.getItem(key) || '';
          }
        }
        return items;
      `;

      const localStorageItems = await driver.executeScript(localStorageScript) as Record<string, string>;

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);

      // Create session object
      const sessionData: BrowserSessionData = {
        cookies,
        localStorage: localStorageItems,
        expiresAt,
        accountId,
        metadata
      };

      // Generate a unique session ID
      const sessionId = this.generateSessionId(accountId);

      // Save to memory
      this.sessions.set(sessionId, sessionData);

      // Save to disk
      const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2));

      this.logger.info(`Session saved with ID: ${sessionId}`);
      return sessionId;
    } catch (error: any) {
      this.logger.error(`Failed to save session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load a session into the WebDriver
   *
   * @param driver WebDriver instance
   * @param sessionId Session ID to load
   * @returns Whether the session was loaded successfully
   */
  public async loadSession(driver: WebDriver, sessionId: string): Promise<boolean> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        this.logger.warn(`Session not found: ${sessionId}`);
        return false;
      }

      // Check if session has expired
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        this.logger.warn(`Session expired: ${sessionId}`);
        this.deleteSession(sessionId);
        return false;
      }

      // Get the current URL (to return to after setting cookies)
      const currentUrl = await driver.getCurrentUrl();

      // Clear existing cookies
      await driver.manage().deleteAllCookies();

      // Add all cookies
      for (const cookie of session.cookies) {
        try {
          // We need to be on a page in the same domain before setting cookies
          // If we're on about:blank, navigate to a page first
          if (currentUrl === 'about:blank' || currentUrl === 'data:,') {
            const domain = `.${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}`;
            await driver.get(`https://${domain}`);
          }

          // Some cookie properties might not be valid for setting
          const { name, value, domain, path, secure, httpOnly, expiry } = cookie;
          await driver.manage().addCookie({ name, value, domain, path, secure, httpOnly, expiry });
        } catch (cookieError: any) {
          this.logger.warn(`Failed to set cookie: ${cookieError.message}`);
          // Continue with other cookies even if one fails
        }
      }

      // Set localStorage items
      if (session.localStorage) {
        const storageItems = session.localStorage;
        const localStorageScript = `
          const storageItems = arguments[0];
          localStorage.clear();
          for (const key in storageItems) {
            localStorage.setItem(key, storageItems[key]);
          }
        `;

        await driver.executeScript(localStorageScript, storageItems);
      }

      // Return to the original URL if needed
      if (currentUrl !== 'about:blank' && currentUrl !== 'data:,') {
        await driver.get(currentUrl);
      }

      this.logger.info(`Session loaded: ${sessionId}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to load session: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete a session
   *
   * @param sessionId Session ID to delete
   * @returns Whether the session was deleted successfully
   */
  public deleteSession(sessionId: string): boolean {
    try {
      // Remove from memory
      const existed = this.sessions.delete(sessionId);

      // Remove from disk
      const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.info(`Session file deleted: ${sessionId}`);
        return true;
      }

      return existed;
    } catch (error: any) {
      this.logger.error(`Failed to delete session: ${error.message}`);
      return false;
    }
  }

  /**
   * Get a session by ID
   *
   * @param sessionId Session ID
   * @returns Session data or undefined if not found
   */
  public getSession(sessionId: string): BrowserSessionData | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get a session by LinkedIn account ID
   *
   * @param accountId LinkedIn account ID
   * @returns First matching session or undefined if not found
   */
  public getSessionByAccountId(accountId: string): {sessionId: string, session: BrowserSessionData} | undefined {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.accountId === accountId) {
        return { sessionId, session };
      }
    }
    return undefined;
  }

  /**
   * Check if a session is valid
   *
   * @param sessionId Session ID
   * @returns Whether the session exists and has not expired
   */
  public isSessionValid(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    // Check expiration
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      this.deleteSession(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Clean up expired sessions
   *
   * @returns Number of sessions removed
   */
  public cleanupExpiredSessions(): number {
    let removedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        if (this.deleteSession(sessionId)) {
          removedCount++;
        }
      }
    }

    this.logger.info(`Removed ${removedCount} expired sessions`);
    return removedCount;
  }

  /**
   * Generate a unique session ID
   *
   * @param accountId Optional account ID to include in the ID
   * @returns Unique session ID
   */
  private generateSessionId(accountId?: string): string {
    const randomPart = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now().toString(36);
    const prefix = accountId ? `acc_${accountId.substring(0, 6)}` : 'sess';

    return `${prefix}_${timestamp}_${randomPart}`;
  }
}

// Singleton instance for easy import
export const browserSessionManager = BrowserSessionManager.getInstance();
export default browserSessionManager;