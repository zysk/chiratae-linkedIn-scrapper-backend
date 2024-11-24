import { Builder } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { PageLoadStrategy } from "selenium-webdriver/lib/capabilities";
import path from "path";

/**
 * Manages Selenium WebDriver instance for LinkedIn automation
 *
 * Business Logic:
 * 1. Initializes Chrome WebDriver with required settings
 * 2. Handles browser configuration for scraping
 * 3. Manages driver lifecycle
 */
export class SeleniumService {
    constructor() {
        this.driver = null;
    }

    /**
     * Initializes Chrome WebDriver with scraping-friendly settings
     * @returns {WebDriver} Configured Selenium WebDriver instance
     */
    async initialize() {
        try {
            const chromeOptions = new chrome.Options();
            chromeOptions.addArguments(
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-gpu",
                "--disable-notifications",
                "--disable-infobars",
                "--start-maximized"
            );
            chromeOptions.setPageLoadStrategy(PageLoadStrategy.NORMAL);

            this.driver = await new Builder()
                .forBrowser("chrome")
                .setChromeOptions(chromeOptions)
                .build();

            return this.driver;
        } catch (error) {
            console.error("Failed to initialize Selenium WebDriver:", error);
            throw error;
        }
    }

    getDriver() {
        return this.driver;
    }

    async quit() {
        if (this.driver) {
            await this.driver.quit();
            this.driver = null;
        }
    }
}

// Export a singleton instance
export const seleniumService = new SeleniumService();