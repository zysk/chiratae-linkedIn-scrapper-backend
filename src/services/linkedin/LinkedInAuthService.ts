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

      // Wait for the page to load with longer timeout
      await driver.wait(until.elementLocated(By.id('username')), 15000);

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

      // Wait longer to check for any challenges (LinkedIn can be slow)
      await randomDelay(15000, 20000);

      // Save a screenshot of the post-login page for debugging
      await this.saveDebugScreenshot(driver, 'post-login');

      // First check if login was already successful
      let isLoggedIn = await this.isLoggedIn(driver);

      if (isLoggedIn) {
        logger.info(`Successfully logged in as ${account.username} without any challenges`);
        return {
          success: true,
          driver,
          message: 'Login successful without challenges',
          captcha: { challengePresent: false, imageData: null, message: 'No CAPTCHA' },
          otp: { verificationRequired: false, message: 'No OTP required' },
          phoneVerification: { verificationRequired: false, message: 'No phone verification required' }
        };
      }

      // If not logged in, try to bypass security challenges
      logger.info('Not logged in immediately, attempting to bypass security challenges');
      const bypassAttempted = await this.attemptSecurityBypass(driver);

      if (bypassAttempted) {
        // Wait to see if bypass worked
        await randomDelay(5000, 8000);

        // Check if we're logged in after bypass
        isLoggedIn = await this.isLoggedIn(driver);

        if (isLoggedIn) {
          logger.info(`Successfully logged in as ${account.username} after security bypass`);
          return {
            success: true,
            driver,
            message: 'Login successful after security bypass',
            captcha: { challengePresent: false, imageData: null, message: 'Bypassed' },
            otp: { verificationRequired: false, message: 'Bypassed' },
            phoneVerification: { verificationRequired: false, message: 'Bypassed' }
          };
        }
      }

      // If still not logged in, check for specific challenges
      // Check for CAPTCHA
      const captchaResult = await this.checkForCaptcha(driver);

      // Check for OTP verification
      const otpResult = await this.checkForOtpVerification(driver);

      // Check for phone verification
      const phoneVerificationResult = await this.checkForPhoneVerification(driver);

      // Final login check
      isLoggedIn = await this.isLoggedIn(driver);

      if (captchaResult.challengePresent) {
        logger.info(`CAPTCHA challenge detected for ${account.username}`);
        await this.saveDebugScreenshot(driver, 'captcha-challenge');
        return {
          success: false,
          driver,
          message: 'CAPTCHA verification required',
          captcha: captchaResult,
          otp: otpResult,
          phoneVerification: phoneVerificationResult
        };
      }

      if (otpResult.verificationRequired) {
        logger.info(`OTP verification required for ${account.username}`);
        await this.saveDebugScreenshot(driver, 'otp-challenge');
        return {
          success: false,
          driver,
          message: 'OTP verification required',
          captcha: captchaResult,
          otp: otpResult,
          phoneVerification: phoneVerificationResult
        };
      }

      if (phoneVerificationResult.verificationRequired) {
        logger.info(`Phone verification required for ${account.username}`);
        await this.saveDebugScreenshot(driver, 'phone-challenge');
        return {
          success: false,
          driver,
          message: 'Phone verification required',
          captcha: captchaResult,
          otp: otpResult,
          phoneVerification: phoneVerificationResult
        };
      }

      if (isLoggedIn) {
        logger.info(`Successfully logged in as ${account.username}`);
        return {
          success: true,
          driver,
          message: 'Login successful',
          captcha: captchaResult,
          otp: otpResult,
          phoneVerification: phoneVerificationResult
        };
      } else {
        // If not logged in and no specific challenge detected, save screenshot anyway
        logger.warn(`Login failed for ${account.username} with unknown reason`);
        await this.saveDebugScreenshot(driver, 'unknown-failure');
        return {
          success: false,
          driver,
          message: 'Login failed - check credentials or unknown challenge',
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
   * Checks if the user is logged in to LinkedIn
   * @param driver The WebDriver instance
   * @returns Whether the user is logged in
   */
  public async isLoggedIn(driver: WebDriver): Promise<boolean> {
    try {
      // Get the current URL
      const currentUrl = await driver.getCurrentUrl();

      // First check if we're on a known LinkedIn internal page
      const isOnKnownPage =
        currentUrl.includes('/feed') ||
        currentUrl.includes('/mynetwork') ||
        currentUrl.includes('/jobs') ||
        currentUrl.includes('/messaging') ||
        currentUrl.includes('/notifications');

      if (isOnKnownPage) {
        return true;
      }

      // Try a different approach - check for specific LinkedIn dashboard elements with a short timeout
      try {
        // Look for the global navigation bar
        const navBar = await driver.findElements(By.css('nav.global-nav, .global-nav-container'));
        if (navBar.length > 0) {
          return true;
        }

        // Look for the profile dropdown button
        const profileButton = await driver.findElements(By.css('div.feed-identity-module, button[data-control-name="nav.settings"]'));
        if (profileButton.length > 0) {
          return true;
        }

        // Look for common LinkedIn elements that indicate logged-in state
        const commonElements = await driver.findElements(
          By.css('.feed-identity-module, .feed-shared-actor, .share-box, .search-global-typeahead')
        );
        if (commonElements.length > 0) {
          return true;
        }

        // Check for LinkedIn logo in the nav bar (when logged in it's positioned differently)
        const logoInNav = await driver.findElements(By.css('.global-nav__logo'));
        if (logoInNav.length > 0) {
          return true;
        }
      } catch (timeoutError) {
        // Ignore timeout errors as we're just checking multiple elements
      }

      // Final check: make sure we're not on a login, signup, or challenge page
      const notLoggedInPages = [
        '/login',
        '/checkpoint',
        '/signup',
        'add-phone',
        'two-step-verification',
        'challenge'
      ];

      return !notLoggedInPages.some(page => currentUrl.includes(page));
    } catch (error) {
      logger.error(`Error checking login status: ${error instanceof Error ? error.message : String(error)}`);
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
      // Get current URL to check for verification pages
      const currentUrl = await driver.getCurrentUrl();
      const isOnVerificationPage = currentUrl.includes('checkpoint') ||
                                  currentUrl.includes('two-step-verification');

      // More specific OTP input field selectors
      const otpInputs = await driver.findElements(
        By.css('input[id="two-step-challenge-code"], input[id="input__phone_verification_pin"], input[name="pin"]')
      );

      // More precise verification message detection with complete phrases
      const verificationTitles = await driver.findElements(
        By.xpath('//h1[contains(text(), "Enter the verification code")] | //h2[contains(text(), "Two-step verification")] | //h2[contains(text(), "Let\'s make sure it\'s you")]')
      );

      // Check for specific verification code messages
      const codeMessages = await driver.findElements(
        By.xpath('//p[contains(text(), "code was sent to")] | //p[contains(text(), "verification code")] | //span[contains(text(), "Enter the code sent to")]')
      );

      // Look for the verification code form
      const verificationForms = await driver.findElements(
        By.css('form[data-id="two-step-challenge"], form[name="two-factor-auth-form"]')
      );

      if (
        isOnVerificationPage ||
        otpInputs.length > 0 ||
        verificationTitles.length > 0 ||
        codeMessages.length > 0 ||
        verificationForms.length > 0
      ) {
        // Log what triggered the detection for debugging
        logger.info(`OTP verification detected: URL=${isOnVerificationPage}, inputs=${otpInputs.length}, titles=${verificationTitles.length}, messages=${codeMessages.length}, forms=${verificationForms.length}`);

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

  /**
   * Saves a screenshot for debugging authentication issues
   * @param driver The WebDriver instance
   * @param type The type of authentication issue (captcha, otp, phone, etc.)
   */
  private async saveDebugScreenshot(driver: WebDriver, type: string): Promise<void> {
    try {
      // Take a screenshot
      const screenshot = await driver.takeScreenshot();

      // Create directory if it doesn't exist
      const debugDir = path.join(process.cwd(), 'debug-screenshots');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      // Generate filename with timestamp and type
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = path.join(debugDir, `${type}-${timestamp}.png`);

      // Write the screenshot to a file
      fs.writeFileSync(filePath, Buffer.from(screenshot, 'base64'));

      logger.info(`Debug screenshot saved to: ${filePath}`);
    } catch (error) {
      logger.error(`Error saving debug screenshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Attempts to bypass security challenges when possible by using "trust device" options
   * @param driver The WebDriver instance
   * @returns Whether any bypass attempt was made, not if it was successful
   */
  private async attemptSecurityBypass(driver: WebDriver): Promise<boolean> {
    try {
      // Take screenshot before trying bypass
      await this.saveDebugScreenshot(driver, 'pre-bypass-attempt');

      // Try to find "Trust this device"/"Remember me" checkbox and check it
      const trustDeviceCheckboxes = await driver.findElements(
        By.css('input[id*="trust"], input[id*="remember"], input[type="checkbox"]')
      );

      let bypassAttempted = false;

      for (const checkbox of trustDeviceCheckboxes) {
        try {
          if (!(await checkbox.isSelected())) {
            await checkbox.click();
            bypassAttempted = true;
            await randomDelay(1000, 2000);
            logger.info('Clicked "trust device" or "remember me" checkbox');
          }
        } catch (err) {
          // Continue to next checkbox if one fails
        }
      }

      // Try to click any "Skip"/"Not Now"/"Maybe Later" buttons
      const skipButtons = await driver.findElements(
        By.xpath('//button[contains(text(), "Skip")] | //button[contains(text(), "Not Now")] | //button[contains(text(), "Later")] | //button[contains(text(), "Maybe Later")]')
      );

      for (const button of skipButtons) {
        try {
          await button.click();
          bypassAttempted = true;
          await randomDelay(1000, 2000);
          logger.info('Clicked a skip/later button on security challenge');
        } catch (err) {
          // Continue to next button if one fails
        }
      }

      // Try to click "This is a trusted device" options
      const trustDeviceButtons = await driver.findElements(
        By.xpath('//button[contains(text(), "Trust")] | //button[contains(text(), "trusted")] | //a[contains(text(), "Trust")]')
      );

      for (const button of trustDeviceButtons) {
        try {
          await button.click();
          bypassAttempted = true;
          await randomDelay(1000, 2000);
          logger.info('Clicked "trusted device" button');
        } catch (err) {
          // Continue to next button if one fails
        }
      }

      // Take screenshot after bypass attempts
      if (bypassAttempted) {
        await randomDelay(3000, 5000); // Wait to see the result
        await this.saveDebugScreenshot(driver, 'post-bypass-attempt');
      }

      return bypassAttempted;
    } catch (error) {
      logger.error(`Error attempting security bypass: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

export default LinkedInAuthService.getInstance();
