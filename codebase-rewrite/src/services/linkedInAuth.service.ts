import { WebDriver, By } from 'selenium-webdriver';
import mongoose from 'mongoose';
import { navigateTo, findElementSafe, sendKeysSafe, clickElementSafe, randomDelay } from '../helpers/SeleniumUtils';
import LinkedInAccount from '../models/LinkedInAccount.model';
import { decryptPassword } from '../helpers/Encryption'; // Assuming this helper exists

const LINKEDIN_LOGIN_URL = 'https://www.linkedin.com/login';

// --- Locators --- (These are likely to change and need maintenance)
const USERNAME_INPUT = By.id('username');
const PASSWORD_INPUT = By.id('password');
const SIGN_IN_BUTTON = By.xpath('//button[@type="submit" and contains(text(), "Sign in")]');
// Locators for success, CAPTCHA, OTP, etc. need to be identified
const FEED_INDICATOR = By.id('feed-tab-icon'); // Example indicator of successful login
const CAPTCHA_IMAGE = By.id('captcha-image'); // Example CAPTCHA image locator
const CAPTCHA_INPUT = By.id('captcha-input'); // Example CAPTCHA input locator
const OTP_INPUT = By.id('otp-input'); // Example OTP input locator
const OTP_SUBMIT_BUTTON = By.id('otp-submit'); // Example OTP submit button

// --- Login Status Types ---
export enum LoginStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CAPTCHA_REQUIRED = 'CAPTCHA_REQUIRED',
  OTP_REQUIRED = 'OTP_REQUIRED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface LoginResult {
  status: LoginStatus;
  message: string;
  captchaImageUrl?: string; // URL if CAPTCHA is needed
}

/**
 * Attempts to log in to LinkedIn using provided credentials and WebDriver.
 * Handles common scenarios like CAPTCHA and OTP.
 *
 * @param driver - Selenium WebDriver instance.
 * @param accountId - MongoDB ObjectId of the LinkedInAccount.
 * @returns Promise<LoginResult> - The outcome of the login attempt.
 */
export const performLinkedInLogin = async (
  driver: WebDriver,
  accountId: string | mongoose.Types.ObjectId
): Promise<LoginResult> => {
  try {
    const account = await LinkedInAccount.findById(accountId);
    if (!account || !account.password) {
      return { status: LoginStatus.FAILED, message: 'LinkedIn account or password not found.' };
    }

    // TODO: Decrypt password securely
    const decryptedPassword = account.password; // Replace with await decryptPassword(account.password);
    if (!decryptedPassword) {
       return { status: LoginStatus.FAILED, message: 'Failed to decrypt LinkedIn password.' };
    }

    console.log(`Attempting login for: ${account.name}`);
    await navigateTo(driver, LINKEDIN_LOGIN_URL);
    await randomDelay(2000, 4000);

    // Enter credentials
    if (!await sendKeysSafe(driver, USERNAME_INPUT, account.name)) {
        return { status: LoginStatus.FAILED, message: 'Failed to find or type in username field.' };
    }
    await randomDelay(500, 1500);
    if (!await sendKeysSafe(driver, PASSWORD_INPUT, decryptedPassword)) {
         return { status: LoginStatus.FAILED, message: 'Failed to find or type in password field.' };
    }
    await randomDelay(1000, 2000);

    // Click Sign In
    if (!await clickElementSafe(driver, SIGN_IN_BUTTON)) {
        return { status: LoginStatus.FAILED, message: 'Failed to find or click sign in button.' };
    }

    await randomDelay(5000, 8000); // Wait for potential redirects/checks

    // --- Check Login Outcome ---
    const currentUrl = await driver.getCurrentUrl();

    // 1. Check for successful login (e.g., redirected to feed)
    if (currentUrl.includes('/feed')) {
      // Optional: Double-check by looking for a known element on the feed page
      const feedElement = await findElementSafe(driver, FEED_INDICATOR, 3000);
      if (feedElement) {
        console.log(`Login successful for: ${account.name}`);
        account.isValid = true;
        account.isBlocked = false;
        await account.save();
        return { status: LoginStatus.SUCCESS, message: 'Login successful.' };
      }
    }

    // 2. Check for CAPTCHA challenge
    const captchaImageElement = await findElementSafe(driver, CAPTCHA_IMAGE, 2000);
    if (captchaImageElement) {
      console.log(`CAPTCHA required for: ${account.name}`);
      const captchaImageUrl = await captchaImageElement.getAttribute('src');
      return {
        status: LoginStatus.CAPTCHA_REQUIRED,
        message: 'CAPTCHA verification is required.',
        captchaImageUrl: captchaImageUrl || undefined
      };
    }

    // 3. Check for OTP/Phone verification challenge
    const otpInputElement = await findElementSafe(driver, OTP_INPUT, 2000);
    if (otpInputElement) {
      console.log(`OTP verification required for: ${account.name}`);
      return { status: LoginStatus.OTP_REQUIRED, message: 'OTP verification is required.' };
    }

    // 4. If none of the above, assume failure (e.g., invalid credentials, unexpected page)
    console.log(`Login failed for: ${account.name}. Current URL: ${currentUrl}`);
    account.isValid = false; // Mark as potentially invalid
    await account.save();
    return { status: LoginStatus.FAILED, message: 'Login failed. Invalid credentials or unexpected page.' };

  } catch (error: any) {
    console.error(`Error during LinkedIn login for account ${accountId}:`, error);
    // Update account status on error?
    try {
       await LinkedInAccount.findByIdAndUpdate(accountId, { isValid: false });
    } catch (dbError) {
        console.error(`Failed to update account status after login error for ${accountId}`, dbError);
    }
    return { status: LoginStatus.UNKNOWN_ERROR, message: `An unexpected error occurred: ${error.message}` };
  }
};

/**
 * Submits the solution for a CAPTCHA challenge.
 *
 * @param driver - Selenium WebDriver instance.
 * @param captchaSolution - The text entered by the user.
 * @returns Promise<boolean> - True if submission seemed successful, false otherwise.
 */
export const submitCaptchaSolution = async (
  driver: WebDriver,
  captchaSolution: string
): Promise<boolean> => {
   console.log(`Submitting CAPTCHA solution: ${captchaSolution}`);
   if (!await sendKeysSafe(driver, CAPTCHA_INPUT, captchaSolution)) {
     console.error('Failed to find or type in CAPTCHA input field.');
     return false;
   }
   await randomDelay(500, 1000);
   // Assuming CAPTCHA submit is part of the main sign-in button or a specific one
   if (!await clickElementSafe(driver, SIGN_IN_BUTTON)) {
     console.error('Failed to find or click submit button after CAPTCHA.');
     return false; // Need to identify the correct button if it's different
   }
   await randomDelay(5000, 8000); // Wait for verification
   // TODO: Add check here to see if CAPTCHA was accepted (e.g., URL change, element check)
   return true; // Assuming success for now
};

/**
 * Submits the OTP code.
 *
 * @param driver - Selenium WebDriver instance.
 * @param otpCode - The OTP code entered by the user.
 * @returns Promise<boolean> - True if submission seemed successful, false otherwise.
 */
export const submitOtpCode = async (
  driver: WebDriver,
  otpCode: string
): Promise<boolean> => {
  console.log(`Submitting OTP code: ${otpCode}`);
   if (!await sendKeysSafe(driver, OTP_INPUT, otpCode)) {
     console.error('Failed to find or type in OTP input field.');
     return false;
   }
   await randomDelay(500, 1000);
   if (!await clickElementSafe(driver, OTP_SUBMIT_BUTTON)) {
     console.error('Failed to find or click submit button after OTP.');
     return false;
   }
   await randomDelay(5000, 8000); // Wait for verification
   // TODO: Add check here to see if OTP was accepted (e.g., URL change to /feed)
   return true; // Assuming success for now
};

/**
 * Checks if the current WebDriver session appears to be logged into LinkedIn.
 *
 * @param driver - Selenium WebDriver instance.
 * @returns Promise<boolean>
 */
export const checkLinkedInLoginStatus = async (driver: WebDriver): Promise<boolean> => {
    try {
        const currentUrl = await driver.getCurrentUrl();
        if (currentUrl.includes('/feed')) {
            // More robust check: look for a feed element
            const feedElement = await findElementSafe(driver, FEED_INDICATOR, 3000);
            return !!feedElement; // True if feed element found
        }
        return false;
    } catch (error) {
        console.error('Error checking LinkedIn login status:', error);
        return false;
    }
};