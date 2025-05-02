import {
  WebDriver,
  By,
  until,
  WebElement,
  NoSuchElementError,
  TimeoutError,
} from "selenium-webdriver";
import Logger from "./Logger";

// Create a dedicated logger for selenium utils
const logger = new Logger({ context: "selenium" });

/**
 * Safely navigates to a URL.
 * @param driver - WebDriver instance.
 * @param url - URL to navigate to.
 */
export const navigateTo = async (
  driver: WebDriver,
  url: string,
): Promise<void> => {
  try {
    await driver.get(url);
    logger.info(`Navigated to: ${url}`);
  } catch (error) {
    logger.error(`Error navigating to ${url}:`, error);
    throw error; // Re-throw for higher-level handling
  }
};

/**
 * Finds an element with explicit wait.
 * @param driver - WebDriver instance.
 * @param locator - Element locator (e.g., By.id('elementId')).
 * @param timeout - Maximum wait time in milliseconds (default: 10000).
 * @returns The found WebElement.
 * @throws TimeoutError if element is not found within timeout.
 * @throws NoSuchElementError for other location failures.
 */
export const findElementWait = async (
  driver: WebDriver,
  locator: By,
  timeout = 10000,
): Promise<WebElement> => {
  try {
    const element = await driver.wait(until.elementLocated(locator), timeout);
    // Optional: Wait for element to be visible as well
    await driver.wait(until.elementIsVisible(element), timeout);
    return element;
  } catch (error) {
    if (error instanceof TimeoutError) {
      logger.error(`Timeout waiting for element: ${locator.toString()}`);
    } else if (error instanceof NoSuchElementError) {
      logger.error(`Element not found: ${locator.toString()}`);
    }
    logger.error(`Error finding element ${locator.toString()}:`, error);
    throw error;
  }
};

/**
 * Safely finds an element, returning null if not found within timeout.
 * @param driver - WebDriver instance.
 * @param locator - Element locator.
 * @param timeout - Maximum wait time in milliseconds (default: 5000).
 * @returns The found WebElement or null.
 */
export const findElementSafe = async (
  driver: WebDriver,
  locator: By,
  timeout = 5000,
): Promise<WebElement | null> => {
  try {
    return await findElementWait(driver, locator, timeout);
  } catch (error) {
    // Expected errors if element doesn't exist
    if (error instanceof NoSuchElementError || error instanceof TimeoutError) {
      return null;
    }
    // Log unexpected errors
    logger.error(
      `Unexpected error finding element safely ${locator.toString()}:`,
      error,
    );
    return null;
  }
};

/**
 * Safely clicks an element after ensuring it's present and clickable.
 * @param driver - WebDriver instance.
 * @param locator - Element locator.
 * @param timeout - Maximum wait time (default: 10000).
 * @returns True if clicked successfully, false otherwise.
 */
export const clickElementSafe = async (
  driver: WebDriver,
  locator: By,
  timeout = 10000,
): Promise<boolean> => {
  try {
    const element = await findElementWait(driver, locator, timeout);
    // Optional: Wait for element to be enabled/clickable if needed
    // await driver.wait(until.elementIsEnabled(element), timeout);
    await element.click();
    return true;
  } catch (error) {
    logger.error(`Error clicking element ${locator.toString()}:`, error);
    return false;
  }
};

/**
 * Safely sends keys to an element after ensuring it's present.
 * @param driver - WebDriver instance.
 * @param locator - Element locator.
 * @param keys - The string or sequence of keys to send.
 * @param timeout - Maximum wait time (default: 10000).
 * @returns True if keys sent successfully, false otherwise.
 */
export const sendKeysSafe = async (
  driver: WebDriver,
  locator: By,
  keys: string | Promise<string>,
  timeout = 10000,
): Promise<boolean> => {
  try {
    const element = await findElementWait(driver, locator, timeout);
    await element.sendKeys(keys);
    return true;
  } catch (error) {
    logger.error(`Error sending keys to element ${locator.toString()}:`, error);
    return false;
  }
};

/**
 * Safely gets text from an element.
 * @param driver - WebDriver instance.
 * @param locator - Element locator.
 * @param timeout - Maximum wait time (default: 5000).
 * @returns The element's text or null if not found/error.
 */
export const getTextSafe = async (
  driver: WebDriver,
  locator: By,
  timeout = 5000,
): Promise<string | null> => {
  try {
    const element = await findElementWait(driver, locator, timeout);
    return await element.getText();
  } catch (error) {
    if (error instanceof NoSuchElementError || error instanceof TimeoutError) {
      return null; // Element not found is not an unexpected error here
    }
    logger.error(
      `Error getting text from element ${locator.toString()}:`,
      error,
    );
    return null;
  }
};

/**
 * Introduces a random delay.
 * @param minMs - Minimum delay in milliseconds.
 * @param maxMs - Maximum delay in milliseconds.
 */
export const randomDelay = async (
  minMs: number,
  maxMs: number,
): Promise<void> => {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  logger.debug(`Waiting for ${delay} ms...`);
  await new Promise((resolve) => setTimeout(resolve, delay));
};

/**
 * Scrolls down the page gradually.
 * @param driver - WebDriver instance.
 * @param steps - Number of steps to scroll down.
 * @param delayMs - Delay between steps in milliseconds.
 */
export const scrollDownGradually = async (
  driver: WebDriver,
  steps = 5,
  delayMs = 500,
): Promise<void> => {
  try {
    let lastHeight = (await driver.executeScript(
      "return document.body.scrollHeight",
    )) as number;
    for (let i = 0; i < steps; i++) {
      await driver.executeScript(`window.scrollBy(0, ${lastHeight / steps});`);
      await randomDelay(delayMs, delayMs + 200);
      let newHeight = (await driver.executeScript(
        "return document.body.scrollHeight",
      )) as number;
      // Optional: Break if height stops changing significantly
      // if (newHeight <= lastHeight + 10) break;
      lastHeight = newHeight;
    }
  } catch (error) {
    logger.error("Error during scrolling:", error);
  }
};

/**
 * Gets the current URL from the driver.
 * @param driver - WebDriver instance.
 * @returns The current URL or null if an error occurs.
 */
export const getCurrentUrlSafe = async (
  driver: WebDriver,
): Promise<string | null> => {
  try {
    return await driver.getCurrentUrl();
  } catch (error) {
    logger.error("Error getting current URL:", error);
    return null;
  }
};

// Export all utility functions
export default {
  navigateTo,
  findElementWait,
  findElementSafe,
  clickElementSafe,
  sendKeysSafe,
  getTextSafe,
  randomDelay,
  scrollDownGradually,
  getCurrentUrlSafe,
};
