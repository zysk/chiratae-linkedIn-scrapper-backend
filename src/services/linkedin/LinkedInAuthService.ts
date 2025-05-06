import { WebDriver, By, Key, until } from 'selenium-webdriver';
import { ILinkedInAccount } from '../../models/linkedinAccount.model';
import seleniumService from '../selenium/SeleniumService';
import logger from '../../utils/logger';
import { IProxy } from '../../models/proxy.model';
import fs from 'fs';
import path from 'path';
import { randomDelay } from '../../utils/delay';

/**
 * Interface for handling CAPTCHA challenges
 */
interface CaptchaResult {
  imageData: string | null;
  challengePresent: boolean;
  message: string;
}

/**
 * Interface for OTP verification process
 */
interface OtpResult {
  verificationRequired: boolean;
  message: string;
}

/**
 * Interface for phone verification process
 */
interface PhoneVerificationResult {
  verificationRequired: boolean;
  message: string;
  subMessage?: string;
}

/**
 * Interface for login results
 */
export interface LoginResult {
  success: boolean;
  driver: WebDriver | null;
  message: string;
  captcha: CaptchaResult;
  otp: OtpResult;
  phoneVerification: PhoneVerificationResult;
}

/**
 * Extended LinkedIn account interface with password
 */
interface LinkedInAccountWithPassword extends ILinkedInAccount {
  password: string;
}

/**
 * Service for handling LinkedIn authentication and verification challenges
 */
export class LinkedInAuthService {
  private static instance: LinkedInAuthService;
  private readonly LOGIN_URL = 'https://www.linkedin.com/login';
  private readonly HOME_URL = 'https://www.linkedin.com/feed/';

  private constructor() {}

  /**
   * Get the singleton instance of the LinkedInAuthService
   */
  public static getInstance(): LinkedInAuthService {
    if (!LinkedInAuthService.instance) {
      LinkedInAuthService.instance = new LinkedInAuthService();
    }
    return LinkedInAuthService.instance;
  }

  /**
   * Logs into LinkedIn with the provided account and proxy
   * @param account The LinkedIn account credentials
   * @param password The decrypted password for the account
   * @param proxy Optional proxy configuration for the login
   * @returns A LoginResult object with status and challenge information
   */
  public async login(
    account: ILinkedInAccount,
    password: string,
    proxy?: IProxy
  ): Promise<LoginResult> {
    let driver: WebDriver | null = null;

    try {
      // Create a WebDriver instance with the specified options
      driver = await seleniumService.createDriver({
        headless: process.env.NODE_ENV === 'production',
        proxy: proxy
      });

      // Navigate to LinkedIn login page
      await driver.get(this.LOGIN_URL);

      // Wait for the page to load
      await driver.wait(until.elementLocated(By.id('username')), 10000);

      // Add a small random delay to mimic human behavior
      await randomDelay(1000, 2000);

      // Enter username
      await driver.findElement(By.id('username')).sendKeys(account.username);

      // Add another small random delay
      await randomDelay(800, 1500);

      // Enter password
      await driver.findElement(By.id('password')).sendKeys(password);

      // Add another small random delay
      await randomDelay(1000, 2000);

      // Click submit button
      await driver.findElement(By.css('button[type="submit"]')).click();

      // Wait a moment to check for any challenges
      await randomDelay(10000, 15000);

      // Check for CAPTCHA
      const captchaResult = await this.checkForCaptcha(driver);

      // Check for OTP verification
      const otpResult = await this.checkForOtpVerification(driver);

      // Check for phone verification
      const phoneVerificationResult = await this.checkForPhoneVerification(driver);

      // Check login success (if no challenges)
      const isLoggedIn = await this.isLoggedIn(driver);

      if (isLoggedIn && !captchaResult.challengePresent && !otpResult.verificationRequired && !phoneVerificationResult.verificationRequired) {
        logger.info(`Successfully logged in as ${account.username}`);
        return {
          success: true,
          driver,
          message: 'Login successful',
          captcha: captchaResult,
          otp: otpResult,
          phoneVerification: phoneVerificationResult
        };
      } else if (captchaResult.challengePresent) {
        logger.info(`CAPTCHA challenge detected for ${account.username}`);
        return {
          success: false,
          driver,
          message: 'CAPTCHA verification required',
          captcha: captchaResult,
          otp: otpResult,
          phoneVerification: phoneVerificationResult
        };
      } else if (otpResult.verificationRequired) {
        logger.info(`OTP verification required for ${account.username}`);
        return {
          success: false,
          driver,
          message: 'OTP verification required',
          captcha: captchaResult,
          otp: otpResult,
          phoneVerification: phoneVerificationResult
        };
      } else if (phoneVerificationResult.verificationRequired) {
        logger.info(`Phone verification required for ${account.username}`);
        return {
          success: false,
          driver,
          message: 'Phone verification required',
          captcha: captchaResult,
          otp: otpResult,
          phoneVerification: phoneVerificationResult
        };
      } else {
        logger.warn(`Login failed for ${account.username} with unknown reason`);
        return {
          success: false,
          driver,
          message: 'Login failed - check credentials',
          captcha: captchaResult,
          otp: otpResult,
          phoneVerification: phoneVerificationResult
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`LinkedIn login error: ${errorMessage}`);

      // Clean up driver on error
      if (driver) {
        await seleniumService.quitDriver(driver);
      }

      return {
        success: false,
        driver: null,
        message: `Login error: ${errorMessage}`,
        captcha: { challengePresent: false, imageData: null, message: '' },
        otp: { verificationRequired: false, message: '' },
        phoneVerification: { verificationRequired: false, message: '' }
      };
    }
  }

  /**
   * Checks if the user is logged in
   * @param driver The WebDriver instance
   * @returns True if logged in, false otherwise
   */
  public async isLoggedIn(driver: WebDriver): Promise<boolean> {
    try {
      const url = await driver.getCurrentUrl();

      // Check for common URLs after successful login
      if (url.includes('/feed/') || url.includes('/mynetwork/') || url.includes('/notifications/') || url.includes('/jobs/')) {
        return true;
      }

      // Check for the presence of global navigation bar
      try {
        await driver.wait(until.elementLocated(By.css('nav.global-nav')), 5000);
        return true;
      } catch {
        // Nav bar not found
        return false;
      }
    } catch (error) {
      logger.error('Error checking login status:', error);
      return false;
    }
  }

  /**
   * Checks for CAPTCHA challenge and captures the image
   * @param driver The WebDriver instance
   * @returns A CaptchaResult object
   */
  private async checkForCaptcha(driver: WebDriver): Promise<CaptchaResult> {
    try {
      // Try to locate common CAPTCHA elements
      const captchaPresent = await driver.findElements(By.css('img[alt*="CAPTCHA" i], .recaptcha-container, .captcha-container'));

      if (captchaPresent.length > 0) {
        // Try to find the CAPTCHA image
        const captchaImage = await driver.findElements(By.css('img[alt*="CAPTCHA" i], .captcha-image img'));

        if (captchaImage.length > 0) {
          // Take a screenshot of the CAPTCHA image
          const imageData = await captchaImage[0].takeScreenshot();

          // Option: Save to disk for debugging
          this.saveCaptchaImage(imageData);

          return {
            challengePresent: true,
            imageData,
            message: 'CAPTCHA challenge detected'
          };
        }

        return {
          challengePresent: true,
          imageData: null,
          message: 'CAPTCHA challenge detected but image could not be captured'
        };
      }

      return {
        challengePresent: false,
        imageData: null,
        message: 'No CAPTCHA challenge detected'
      };
    } catch (error) {
      logger.error('Error checking for CAPTCHA:', error);
      return {
        challengePresent: false,
        imageData: null,
        message: 'Error detecting CAPTCHA'
      };
    }
  }

  /**
   * Checks for OTP verification requirement
   * @param driver The WebDriver instance
   * @returns An OtpResult object
   */
  private async checkForOtpVerification(driver: WebDriver): Promise<OtpResult> {
    try {
      // Look for OTP input fields or verification page
      const otpElements = await driver.findElements(By.css('input[id*="verification-code"], input[id*="pin"], input[id*="otp"]'));

      // Look for verification messages
      const verificationMessages = await driver.findElements(By.xpath('//*[contains(text(), "verification code") or contains(text(), "security code") or contains(text(), "verification") or contains(text(), "two-step")]'));

      if (otpElements.length > 0 || verificationMessages.length > 0) {
        return {
          verificationRequired: true,
          message: 'OTP verification required'
        };
      }

      return {
        verificationRequired: false,
        message: 'No OTP verification required'
      };
    } catch (error) {
      logger.error('Error checking for OTP verification:', error);
      return {
        verificationRequired: false,
        message: 'Error detecting OTP verification'
      };
    }
  }

  /**
   * Checks for phone verification requirement
   * @param driver The WebDriver instance
   * @returns A PhoneVerificationResult object
   */
  private async checkForPhoneVerification(driver: WebDriver): Promise<PhoneVerificationResult> {
    try {
      // Look for phone verification elements
      const phoneVerificationElements = await driver.findElements(By.css('input[id*="phone"], input[id*="mobile"], input[type="tel"]'));

      // Look for phone verification messages
      const phoneMessages = await driver.findElements(By.xpath('//*[contains(text(), "phone number") or contains(text(), "mobile") or contains(text(), "verify your account")]'));

      if (phoneVerificationElements.length > 0 || phoneMessages.length > 0) {
        // Attempt to get the verification message
        let message = 'Phone verification required';
        let subMessage = '';

        if (phoneMessages.length > 0) {
          try {
            message = await phoneMessages[0].getText();

            // Try to get additional instructions
            const additionalInstructions = await driver.findElements(By.css('.verification-instructions, .secondary-text'));
            if (additionalInstructions.length > 0) {
              subMessage = await additionalInstructions[0].getText();
            }
          } catch (err) {
            // Failed to get text, use default message
          }
        }

        return {
          verificationRequired: true,
          message,
          subMessage
        };
      }

      return {
        verificationRequired: false,
        message: 'No phone verification required'
      };
    } catch (error) {
      logger.error('Error checking for phone verification:', error);
      return {
        verificationRequired: false,
        message: 'Error detecting phone verification'
      };
    }
  }

  /**
   * Submits a CAPTCHA solution
   * @param driver The WebDriver instance
   * @param captchaSolution The solution for the CAPTCHA
   * @returns Whether the submission was successful
   */
  public async submitCaptcha(driver: WebDriver, captchaSolution: string): Promise<boolean> {
    try {
      // Look for CAPTCHA input field
      const captchaInput = await driver.findElement(By.css('input[id*="captcha"]'));

      if (captchaInput) {
        // Clear any existing text
        await captchaInput.clear();

        // Enter the CAPTCHA solution
        await captchaInput.sendKeys(captchaSolution);

        // Add a small delay
        await randomDelay(1000, 2000);

        // Submit the form
        const submitButton = await driver.findElement(By.css('button[type="submit"]'));
        await submitButton.click();

        // Wait to see if the login proceeds
        await randomDelay(3000, 5000);

        // Check if login was successful
        const isLoggedIn = await this.isLoggedIn(driver);

        // Check if CAPTCHA is still present (indicating failure)
        const captchaResult = await this.checkForCaptcha(driver);

        return isLoggedIn && !captchaResult.challengePresent;
      }

      return false;
    } catch (error) {
      logger.error('Error submitting CAPTCHA solution:', error);
      return false;
    }
  }

  /**
   * Submits an OTP code during login verification
   * @param driver The WebDriver instance
   * @param otpCode The OTP code to submit
   * @returns Whether the submission was successful
   */
  public async submitOtp(driver: WebDriver, otpCode: string): Promise<boolean> {
    try {
      // Find OTP input fields
      const otpInputs = await driver.findElements(By.css('input[id*="verification-code"], input[id*="pin"], input[id*="otp"]'));

      if (otpInputs.length > 0) {
        // If it's a single input field for the entire code
        await otpInputs[0].clear();
        await otpInputs[0].sendKeys(otpCode);

        // Add a small delay
        await randomDelay(1000, 2000);

        // Submit the form or click the verification button
        const submitButtons = await driver.findElements(By.css('button[type="submit"], button.verification-submit'));

        if (submitButtons.length > 0) {
          await submitButtons[0].click();

          // Wait to see if the login proceeds
          await randomDelay(3000, 5000);

          // Check if login was successful
          const isLoggedIn = await this.isLoggedIn(driver);

          // Check if OTP input is still present (indicating failure)
          const otpResult = await this.checkForOtpVerification(driver);

          return isLoggedIn && !otpResult.verificationRequired;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error submitting OTP code:', error);
      return false;
    }
  }

  /**
   * Saves a CAPTCHA image to disk (for debugging)
   * @param imageData The base64-encoded image data
   */
  private saveCaptchaImage(imageData: string | null): void {
    if (!imageData) return;

    try {
      // Create directory if it doesn't exist
      const captchaDir = path.join(process.cwd(), 'captchas');
      if (!fs.existsSync(captchaDir)) {
        fs.mkdirSync(captchaDir, { recursive: true });
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = path.join(captchaDir, `captcha-${timestamp}.png`);

      // Write the image data to a file
      fs.writeFileSync(filePath, Buffer.from(imageData, 'base64'));

      logger.debug(`CAPTCHA image saved to: ${filePath}`);
    } catch (error) {
      logger.error('Error saving CAPTCHA image:', error);
    }
  }

  /**
   * Logs out of LinkedIn
   * @param driver The WebDriver instance
   * @returns Whether the logout was successful
   */
  public async logout(driver: WebDriver): Promise<boolean> {
    try {
      // Navigate to LinkedIn homepage
      await driver.get('https://www.linkedin.com/');

      // Click on profile menu
      const profileMenu = await driver.findElement(By.css('div.global-nav__me-photo, li.global-nav__primary-item:last-child'));
      await profileMenu.click();

      // Wait for dropdown to appear
      await driver.wait(until.elementLocated(By.css('div.global-nav__me-content')), 5000);

      // Find and click the sign out button
      const signOutLink = await driver.findElement(By.css('a[href*="logout"]'));
      await signOutLink.click();

      // Wait for logout to complete
      await randomDelay(3000, 5000);

      // Check if logged out (should redirect to login page)
      const url = await driver.getCurrentUrl();
      return url.includes('/login') || url.includes('/home');
    } catch (error) {
      logger.error('Error during LinkedIn logout:', error);
      return false;
    }
  }
}

export default LinkedInAuthService.getInstance();
