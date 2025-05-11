import { WebDriver, By, Key, until } from 'selenium-webdriver';
import { ILinkedInAccount } from '../../models/linkedinAccount.model';
import seleniumService from '../selenium/SeleniumService';
import logger from '../../utils/logger';
import { IProxy } from '../../models/proxy.model';
import fs from 'fs';
import path from 'path';
import { randomDelay } from '../../utils/delay';
import { CONFIG } from '../../utils/config';

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
    proxy?: IProxy | null
  ): Promise<LoginResult> {
    let driver: WebDriver | null = null;

    try {
      // Create a WebDriver instance with the specified options
      driver = await seleniumService.createDriver({
        headless: CONFIG.BROWSER.HEADLESS,
        proxy: proxy || undefined
      });

      // Navigate to LinkedIn login page
      logger.info(`Navigating to LinkedIn login page: ${this.LOGIN_URL}`);
      await driver.get(this.LOGIN_URL);

      // Save screenshot of the landing page for diagnostics
      await this.saveDebugScreenshot(driver, 'login-page-initial');

      // Wait for the page to load and log page title
      await driver.wait(until.titleContains('LinkedIn'), 15000);
      const pageTitle = await driver.getTitle();
      logger.info(`LinkedIn page title: ${pageTitle}`);

      // Try to determine what page we're on
      const isOnLoginPage = await this.isOnLoginPage(driver);

      if (!isOnLoginPage) {
        logger.warn('Not on expected login page. Attempting flexible login approach');

        // Try to find any input fields that might be for username/email
        const possibleUsernameFields = await driver.findElements(
          By.css('input[type="text"], input[type="email"], input[name*="email"], input[name*="username"], input[id*="email"], input[id*="username"]')
        );

        if (possibleUsernameFields.length > 0) {
          logger.info(`Found ${possibleUsernameFields.length} potential username fields`);

          // Take a screenshot to see what page we're actually on
          await this.saveDebugScreenshot(driver, 'alternate-login-form');

          // Try to find any input fields that might be for password
          const possiblePasswordFields = await driver.findElements(
            By.css('input[type="password"], input[name*="password"], input[id*="password"]')
          );

          if (possiblePasswordFields.length > 0) {
            logger.info(`Found ${possiblePasswordFields.length} potential password fields`);

            // Attempt login with the first username and password fields found
            await possibleUsernameFields[0].clear();
            await possibleUsernameFields[0].sendKeys(account.username);
            logger.info(`Entered username: ${account.username}`);
            await randomDelay(800, 1500);

            await possiblePasswordFields[0].clear();
            await possiblePasswordFields[0].sendKeys(password);
            logger.info('Entered password');
            await randomDelay(1000, 2000);

            // Try to find submit button
            const possibleSubmitButtons = await driver.findElements(
              By.css('button[type="submit"], input[type="submit"], button[id*="login"], button[id*="sign"], button[class*="login"], button[class*="sign"]')
            );

            if (possibleSubmitButtons.length > 0) {
              logger.info('Found potential submit button, attempting to click');
              await possibleSubmitButtons[0].click();
            } else {
              logger.warn('No submit button found, trying to press Enter key on password field');
              await possiblePasswordFields[0].sendKeys(Key.RETURN);
            }
          } else {
            logger.error('No password fields found on the page');
            throw new Error('Unable to locate password field on LinkedIn login page');
          }
        } else {
          // If we can't find username/password fields, navigate directly to the known login URL
          logger.warn('No username fields found. Trying to navigate directly to the known login URL');
          await driver.get('https://www.linkedin.com/login');
          await randomDelay(3000, 5000);

          // Take another screenshot
          await this.saveDebugScreenshot(driver, 'forced-login-page');

          // Now try the standard login approach
          try {
            const usernameField = await driver.findElement(By.id('username'));
            await usernameField.clear();
            await usernameField.sendKeys(account.username);
            logger.info(`Entered username: ${account.username}`);

            await randomDelay(800, 1500);

            const passwordField = await driver.findElement(By.id('password'));
            await passwordField.clear();
            await passwordField.sendKeys(password);
            logger.info('Entered password');

            await randomDelay(1000, 2000);

            const submitButton = await driver.findElement(By.css('button[type="submit"]'));
            await submitButton.click();
            logger.info('Clicked submit button');
          } catch (loginError) {
            logger.error(`Error in standard login after redirect: ${loginError instanceof Error ? loginError.message : String(loginError)}`);
            throw new Error('Unable to locate login fields even after direct navigation to login page');
          }
        }
      } else {
        // Standard login flow
        logger.info('On standard login page, proceeding with normal login flow');

        // Wait for the username field with longer timeout
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
      }

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
   * Saves a screenshot for debugging purposes
   * @param driver WebDriver instance
   * @param type Type of screenshot for naming
   */
  private async saveDebugScreenshot(driver: WebDriver, type: string): Promise<void> {
    try {
      // Create screenshots directory if it doesn't exist
      const screenshotsDir = path.join(process.cwd(), 'data', 'screenshots');
      try {
        // Use fs.promises for async file operations
        await fs.promises.mkdir(screenshotsDir, { recursive: true });
      } catch (mkdirError) {
        logger.warn(`Could not create screenshots directory: ${mkdirError instanceof Error ? mkdirError.message : String(mkdirError)}`);
      }

      // Generate filename with timestamp and type
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
      const filename = path.join(screenshotsDir, `${type}_${timestamp}.png`);

      // Take the screenshot
      const screenshot = await driver.takeScreenshot();
      await fs.promises.writeFile(filename, screenshot, 'base64');

      // Also save the page source for further analysis
      try {
        const pageSource = await driver.getPageSource();
        const htmlFilename = path.join(screenshotsDir, `${type}_${timestamp}.html`);
        await fs.promises.writeFile(htmlFilename, pageSource, 'utf8');
        logger.info(`Saved page source to ${htmlFilename}`);
      } catch (pageSourceError) {
        logger.warn(`Could not save page source: ${pageSourceError instanceof Error ? pageSourceError.message : String(pageSourceError)}`);
      }

      // Log URL and title for context
      try {
        const url = await driver.getCurrentUrl();
        const title = await driver.getTitle();
        logger.info(`Screenshot saved to ${filename} (URL: ${url}, Title: ${title})`);
      } catch (error) {
        logger.info(`Screenshot saved to ${filename}`);
      }
    } catch (error) {
      logger.warn(`Error taking debug screenshot: ${error instanceof Error ? error.message : String(error)}`);
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

  /**
   * Checks if the current page is the LinkedIn login page
   * @param driver The WebDriver instance
   * @returns Whether the driver is currently on the login page
   */
  public async isOnLoginPage(driver: WebDriver): Promise<boolean> {
    try {
      // First check the current URL and page title for quick determination
      const currentUrl = await driver.getCurrentUrl();
      logger.info(`Checking if on login page. Current URL: ${currentUrl}`);

      if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint')) {
        logger.info('URL contains /login or /checkpoint, confirming we are on login page');
        return true;
      }

      try {
        const pageTitle = await driver.getTitle();
        logger.info(`Page title: ${pageTitle}`);

        if (pageTitle.toLowerCase().includes('login') ||
            pageTitle.toLowerCase().includes('sign in') ||
            pageTitle.toLowerCase().includes('log in')) {
          logger.info('Page title indicates we are on a login page');
          return true;
        }
      } catch (titleError) {
        logger.warn(`Could not get page title: ${titleError instanceof Error ? titleError.message : String(titleError)}`);
      }

      // Take a screenshot to debug what page we're actually on
      await this.saveDebugScreenshot(driver, 'login-page-detection');

      // Check for any input fields that could be username/email
      const possibleUsernameFields = await driver.findElements(
        By.css('input[type="text"], input[type="email"], input[name*="email"], input[name*="username"], input[id*="email"], input[id*="username"]')
      );

      logger.info(`Found ${possibleUsernameFields.length} potential username/email fields`);

      if (possibleUsernameFields.length > 0) {
        // Check for any input fields that could be passwords
        const possiblePasswordFields = await driver.findElements(
          By.css('input[type="password"], input[name*="password"], input[id*="password"]')
        );

        logger.info(`Found ${possiblePasswordFields.length} potential password fields`);

        // If we have both username and password fields, it's likely a login page
        if (possiblePasswordFields.length > 0) {
          logger.info('Found both username and password fields, likely on login page');
          return true;
        }
      }

      // Try standard login elements as a fallback
      const standardLoginElements = [
        { type: 'id', value: 'username' },
        { type: 'id', value: 'password' },
        { type: 'css', value: 'button[type="submit"]' },
        { type: 'css', value: 'div.login__form' },
        { type: 'css', value: 'a.join-now' }
      ];

      // Check for alternative login page indicators
      const alternativeLoginElements = [
        { type: 'xpath', value: '//h1[contains(text(), "Sign in")]' },
        { type: 'xpath', value: '//h1[contains(text(), "Log in")]' },
        { type: 'xpath', value: '//div[contains(text(), "Sign in")]' },
        { type: 'css', value: 'form[action*="login"]' },
        { type: 'css', value: 'form[action*="checkpoint"]' },
        { type: 'css', value: 'form[name*="login"]' }
      ];

      for (const element of [...standardLoginElements, ...alternativeLoginElements]) {
        try {
          const selector = element.type === 'id' ? By.id(element.value) :
                           element.type === 'css' ? By.css(element.value) :
                           By.xpath(element.value);

          const found = await driver.findElements(selector);
          if (found.length > 0) {
            for (const el of found) {
              if (await el.isDisplayed()) {
                logger.info(`Found login element: ${element.type}=${element.value}`);
                return true;
              }
            }
          }
        } catch (error) {
          // Continue checking other elements
        }
      }

      logger.info('Could not conclusively determine if on login page');
      return false;
    } catch (error) {
      logger.error(`Error checking if on login page: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

export default LinkedInAuthService.getInstance();
