import { WebDriver, By, until, TimeoutError } from 'selenium-webdriver';
import mongoose from "mongoose";
import {
  navigateTo,
  findElementSafe,
  sendKeysSafe,
  clickElementSafe,
  randomDelay,
} from "../helpers/SeleniumUtils";
import LinkedInAccount from "../models/LinkedInAccount.model";
import { decryptPassword } from "../helpers/Encryption"; // Assuming this helper exists
import Logger from "../helpers/Logger";
import { browserSessionManager } from './browserSession.service';
import { webDriverFactory } from './webDriverFactory.service';
import { ILinkedInAccount } from '../interfaces/LinkedInAccount.interface';
import LinkedInAccountService from './linkedInAccount.service';
import ProxyService from './proxy.service';
import { config } from '../config/config';

// Create a dedicated logger for LinkedIn authentication
const logger = new Logger({ context: "linkedin-auth" });

const LINKEDIN_LOGIN_URL = "https://www.linkedin.com/login";

// --- Locators --- (These are likely to change and need maintenance)
const USERNAME_INPUT = By.id("username");
const PASSWORD_INPUT = By.id("password");
const SIGN_IN_BUTTON = By.xpath(
  '//button[@type="submit" and contains(text(), "Sign in")]',
);
// Locators for success, CAPTCHA, OTP, etc. need to be identified
const FEED_INDICATOR = By.id("feed-tab-icon"); // Example indicator of successful login
const CAPTCHA_IMAGE = By.id("captcha-image"); // Example CAPTCHA image locator
const CAPTCHA_INPUT = By.id("captcha-input"); // Example CAPTCHA input locator
const OTP_INPUT = By.id("otp-input"); // Example OTP input locator
const OTP_SUBMIT_BUTTON = By.id("otp-submit"); // Example OTP submit button

// --- Login Status Types ---
export enum LoginStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  CAPTCHA_REQUIRED = "CAPTCHA_REQUIRED",
  OTP_REQUIRED = "OTP_REQUIRED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface LoginResult {
  status: LoginStatus;
  message: string;
  captchaImageUrl?: string; // URL if CAPTCHA is needed
}

/**
 * Authentication result with status and details
 */
export interface AuthResult {
  success: boolean;
  sessionId?: string;
  errorMessage?: string;
  requiresCaptcha?: boolean;
  requiresOtp?: boolean;
  accountLocked?: boolean;
}

/**
 * Service for handling LinkedIn authentication
 */
export class LinkedInAuthService {
  private static instance: LinkedInAuthService;
  private logger: Logger;
  private linkedInUrl = 'https://www.linkedin.com/login';
  private captchaDetectionSelectors = [
    '.recaptcha-checkbox-border',
    '.g-recaptcha',
    'iframe[src*="recaptcha"]',
    '#captcha-internal',
    '.challenge-dialog'
  ];
  private otpDetectionSelectors = [
    '#two-step-challenge',
    '#input__pin',
    '#verification-code',
    '.two-step-verification'
  ];
  private lockedAccountSelectors = [
    '.security-verification',
    '.account-restricted',
    '.account-locked'
  ];

  private constructor() {
    this.logger = new Logger('LinkedInAuthService');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): LinkedInAuthService {
    if (!LinkedInAuthService.instance) {
      LinkedInAuthService.instance = new LinkedInAuthService();
    }
    return LinkedInAuthService.instance;
  }

  /**
   * Authenticate a LinkedIn account
   *
   * @param accountId LinkedIn account ID or account object
   * @param proxyId Optional proxy ID to use
   * @param timeout Authentication timeout in seconds
   * @returns Authentication result
   */
  public async authenticate(
    accountId: string | ILinkedInAccount,
    proxyId?: string,
    timeout: number = 60
  ): Promise<AuthResult> {
    // Get the account
    let account: ILinkedInAccount;
    if (typeof accountId === 'string') {
      const accountService = LinkedInAccountService.getInstance();
      const foundAccount = await accountService.getAccountById(accountId);
      if (!foundAccount) {
        this.logger.error(`Account not found with ID: ${accountId}`);
        return {
          success: false,
          errorMessage: `Account not found with ID: ${accountId}`
        };
      }
      account = foundAccount;
    } else {
      account = accountId;
    }

    // Check if we already have a valid session for this account
    const existingSession = browserSessionManager.getSessionByAccountId(account._id?.toString() || '');
    if (existingSession && browserSessionManager.isSessionValid(existingSession.sessionId)) {
      this.logger.info(`Using existing valid session for account: ${account.username}`);
      return {
        success: true,
        sessionId: existingSession.sessionId
      };
    }

    let driver: WebDriver | null = null;

    try {
      // Get proxy if specified
      let proxyValue: string | undefined = undefined;
      if (proxyId) {
        const proxyService = ProxyService.getInstance();
        const proxy = await proxyService.getProxyById(proxyId);
        if (proxy) {
          proxyValue = proxyService.formatProxyString(proxy);
          this.logger.info(`Using proxy for authentication: ${proxy.host}:${proxy.port}`);
        }
      }

      // Create a new WebDriver with the specified options
      const options = {
        proxy: proxyValue,
        timeout: timeout * 1000, // Convert to milliseconds
      };

      driver = await webDriverFactory.createDriver(options);
      this.logger.info(`Starting LinkedIn authentication for account: ${account.username}`);

      // Navigate to LinkedIn login page
      await driver.get(this.linkedInUrl);

      // Wait for the login page to load
      await driver.wait(until.elementLocated(By.id('username')), 10000);

      // Add some random delay to mimic human behavior
      await randomDelay(1000, 3000);

      // Enter username
      const usernameField = await driver.findElement(By.id('username'));
      await this.typeSlowly(usernameField, account.username);

      await randomDelay(500, 1500);

      // Enter password
      const passwordField = await driver.findElement(By.id('password'));
      await this.typeSlowly(passwordField, account.password);

      await randomDelay(800, 2000);

      // Click sign-in button
      const signInButton = await driver.findElement(By.css('button[type="submit"]'));
      await signInButton.click();

      // Wait for navigation (max 30 seconds)
      const authResult = await this.handlePostLogin(driver, account, timeout);

      if (authResult.success && driver) {
        // Save the session
        authResult.sessionId = await browserSessionManager.saveSession(
          driver,
          account._id?.toString(),
          24, // 24 hour expiration
          { accountUsername: account.username }
        );

        this.logger.info(`Successfully authenticated account: ${account.username}`);
      }

      return authResult;
    } catch (error: any) {
      this.logger.error(`Authentication error for account ${account.username}:`, error);
      return {
        success: false,
        errorMessage: error.message || 'Unknown authentication error'
      };
    } finally {
      // Quit the driver unless we successfully authenticated
      if (driver) {
        try {
          await driver.quit();
        } catch (quitError) {
          this.logger.warn('Error closing WebDriver:', quitError);
        }
      }
    }
  }

  /**
   * Handle post-login scenarios: success, CAPTCHA, OTP, or account locked
   *
   * @param driver WebDriver instance
   * @param account LinkedIn account
   * @param timeout Timeout in seconds
   * @returns Authentication result
   */
  private async handlePostLogin(
    driver: WebDriver,
    account: ILinkedInAccount,
    timeout: number
  ): Promise<AuthResult> {
    const maxWaitTime = timeout * 1000; // Convert to milliseconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check for CAPTCHA
        if (await this.isCaptchaPresent(driver)) {
          this.logger.warn(`CAPTCHA detected for account: ${account.username}`);
          return {
            success: false,
            requiresCaptcha: true,
            errorMessage: 'CAPTCHA verification required'
          };
        }

        // Check for OTP verification
        if (await this.isOtpVerificationRequired(driver)) {
          this.logger.warn(`OTP verification required for account: ${account.username}`);
          return {
            success: false,
            requiresOtp: true,
            errorMessage: 'Two-factor authentication required'
          };
        }

        // Check for account locked
        if (await this.isAccountLocked(driver)) {
          this.logger.warn(`Account locked: ${account.username}`);
          return {
            success: false,
            accountLocked: true,
            errorMessage: 'Account is locked or requires security verification'
          };
        }

        // Check for successful login (feed page, dashboard, or home)
        if (await this.isLoggedIn(driver)) {
          this.logger.info(`Login successful for account: ${account.username}`);
          return { success: true };
        }

        // Check for login error messages
        const errorMessage = await this.getLoginErrorMessage(driver);
        if (errorMessage) {
          this.logger.warn(`Login error for account ${account.username}: ${errorMessage}`);
          return {
            success: false,
            errorMessage
          };
        }

        // Wait a bit before checking again
        await randomDelay(1000, 2000);
      } catch (error: any) {
        this.logger.warn(`Error during post-login handling: ${error.message}`);
      }
    }

    // If we reach here, timeout occurred
    this.logger.warn(`Authentication timeout for account: ${account.username}`);
    return {
      success: false,
      errorMessage: 'Authentication timeout'
    };
  }

  /**
   * Check if CAPTCHA verification is present
   *
   * @param driver WebDriver instance
   * @returns True if CAPTCHA detected
   */
  private async isCaptchaPresent(driver: WebDriver): Promise<boolean> {
    try {
      for (const selector of this.captchaDetectionSelectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          if (element) {
            return true;
          }
        } catch (error) {
          // Element not found, continue checking other selectors
        }
      }

      // Check current URL for CAPTCHA indicators
      const currentUrl = await driver.getCurrentUrl();
      return currentUrl.includes('captcha') ||
        currentUrl.includes('checkpoint') ||
        currentUrl.includes('challenge');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if OTP verification is required
   *
   * @param driver WebDriver instance
   * @returns True if OTP verification detected
   */
  private async isOtpVerificationRequired(driver: WebDriver): Promise<boolean> {
    try {
      for (const selector of this.otpDetectionSelectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          if (element) {
            return true;
          }
        } catch (error) {
          // Element not found, continue checking other selectors
        }
      }

      // Check URL for OTP indicators
      const currentUrl = await driver.getCurrentUrl();
      return currentUrl.includes('two-step-verification') ||
        currentUrl.includes('checkpoint');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if account is locked
   *
   * @param driver WebDriver instance
   * @returns True if account locked detected
   */
  private async isAccountLocked(driver: WebDriver): Promise<boolean> {
    try {
      for (const selector of this.lockedAccountSelectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          if (element) {
            return true;
          }
        } catch (error) {
          // Element not found, continue checking other selectors
        }
      }

      // Check URL for locked account indicators
      const currentUrl = await driver.getCurrentUrl();
      return currentUrl.includes('security-verification') ||
        currentUrl.includes('account-restricted') ||
        currentUrl.includes('checkpoint');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if login was successful
   *
   * @param driver WebDriver instance
   * @returns True if logged in successfully
   */
  private async isLoggedIn(driver: WebDriver): Promise<boolean> {
    try {
      // Check for elements that are present on the logged-in state
      const loggedInSelectors = [
        'input[placeholder*="Search"]',
        '.feed-identity-module',
        '.identity-panel',
        '.nav-item__profile-member-photo',
        '.global-nav'
      ];

      for (const selector of loggedInSelectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          if (element) {
            return true;
          }
        } catch (error) {
          // Element not found, continue checking other selectors
        }
      }

      // Check URL for successful login indicators
      const currentUrl = await driver.getCurrentUrl();
      return currentUrl.includes('feed') ||
        currentUrl.includes('mynetwork') ||
        currentUrl.includes('dashboard');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get login error message if present
   *
   * @param driver WebDriver instance
   * @returns Error message or null if none found
   */
  private async getLoginErrorMessage(driver: WebDriver): Promise<string | null> {
    try {
      // Try various selectors for error messages
      const errorSelectors = [
        '#error-for-username',
        '#error-for-password',
        '.form__error',
        '.alert-content',
        '.form-error-message'
      ];

      for (const selector of errorSelectors) {
        try {
          const element = await driver.findElement(By.css(selector));
          const text = await element.getText();
          if (text && text.trim().length > 0) {
            return text.trim();
          }
        } catch (error) {
          // Element not found or has no text, continue checking other selectors
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Type text slowly like a human
   *
   * @param element Input element
   * @param text Text to type
   */
  private async typeSlowly(element: any, text: string): Promise<void> {
    for (const char of text) {
      await element.sendKeys(char);
      // Random delay between 50-150ms for typing
      await randomDelay(50, 150);
    }
  }

  /**
   * Refresh an existing session or create a new one
   *
   * @param sessionId Existing session ID
   * @param accountId LinkedIn account ID
   * @param proxyId Optional proxy ID
   * @returns New session ID
   */
  public async refreshSession(
    sessionId: string,
    accountId: string,
    proxyId?: string
  ): Promise<string | null> {
    // Check if the session is still valid
    if (sessionId && browserSessionManager.isSessionValid(sessionId)) {
      this.logger.info(`Session ${sessionId} is still valid, extending expiration`);
      const session = browserSessionManager.getSession(sessionId);
      if (session && session.expiresAt) {
        // Extend expiration by 24 hours
        const newExpiration = new Date();
        newExpiration.setHours(newExpiration.getHours() + 24);
        session.expiresAt = newExpiration;
        // Simulate saving the session again (in a real implementation, this would update the file)
        browserSessionManager.deleteSession(sessionId);
        const sessionData = browserSessionManager.getSession(sessionId);
        return sessionId;
      }
    }

    // Session invalid or expired, create a new one
    this.logger.info(`Creating new session for account ${accountId}`);
    const authResult = await this.authenticate(accountId, proxyId);

    return authResult.success ? authResult.sessionId || null : null;
  }

  /**
   * Handle OTP verification (manual step)
   *
   * @param driver WebDriver instance
   * @param otp OTP code entered by user
   * @returns Whether OTP was successfully submitted
   */
  public async handleOtpVerification(driver: WebDriver, otp: string): Promise<boolean> {
    try {
      // Try different OTP input fields
      const otpSelectors = [
        '#input__pin',
        '#verification-code',
        'input[name="pin"]',
        'input[name="verification_code"]'
      ];

      let otpInputField = null;
      for (const selector of otpSelectors) {
        try {
          otpInputField = await driver.findElement(By.css(selector));
          if (otpInputField) {
            break;
          }
        } catch (error) {
          // Element not found, try next selector
        }
      }

      if (!otpInputField) {
        this.logger.error('OTP input field not found');
        return false;
      }

      // Enter the OTP code
      await this.typeSlowly(otpInputField, otp);

      // Find submit button
      const submitSelectors = [
        'button[type="submit"]',
        'button.btn__primary',
        '.form__submit',
        'button.verify-pin-submit'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await driver.findElement(By.css(selector));
          if (submitButton) {
            break;
          }
        } catch (error) {
          // Element not found, try next selector
        }
      }

      if (!submitButton) {
        this.logger.error('OTP submit button not found');
        return false;
      }

      // Click the submit button
      await submitButton.click();

      // Wait for navigation or verification result
      await randomDelay(2000, 5000);

      // Check if we're logged in
      return await this.isLoggedIn(driver);
    } catch (error: any) {
      this.logger.error(`Error handling OTP verification: ${error.message}`);
      return false;
    }
  }
}

// Singleton instance for easy import
export const linkedInAuthService = LinkedInAuthService.getInstance();
export default linkedInAuthService;
