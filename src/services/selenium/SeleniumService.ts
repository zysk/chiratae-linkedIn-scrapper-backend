import fs from 'fs';
import os from 'os';
import path from 'path';
import { Builder, WebDriver } from 'selenium-webdriver';
import chrome, { Options } from 'selenium-webdriver/chrome';
import { PageLoadStrategy } from 'selenium-webdriver/lib/capabilities';
import { IProxy } from '../../models/proxy.model';
import { CONFIG } from '../../utils/config';
import logger from '../../utils/logger';

/**
 * Driver options for creating a WebDriver instance
 */
interface DriverOptions {
	headless?: boolean;
	proxy?: IProxy;
	userAgent?: string;
}

/**
 * SeleniumService provides methods for creating and managing WebDriver instances
 * with support for proxies, headless mode, and platform detection.
 */
export class SeleniumService {
	private static instance: SeleniumService;
	private activeDrivers: WebDriver[] = [];

	private constructor() { }

	/**
	 * Get the singleton instance of the SeleniumService
	 */
	public static getInstance(): SeleniumService {
		if (!SeleniumService.instance) {
			SeleniumService.instance = new SeleniumService();
		}
		return SeleniumService.instance;
	}

	/**
	 * Detects the current operating system platform
	 * @returns The platform name ('win32', 'darwin', 'linux')
	 */
	private getPlatform(): string {
		return os.platform();
	}

	/**
	 * Gets the chromedriver path based on the current platform
	 * @returns The path to the chromedriver executable
	 */
	private getChromeDriverPath(): string {
		const platform = this.getPlatform();
		const baseDriverPath = path.join(process.cwd(), 'chromedriver');

		switch (platform) {
			case 'win32':
				// Check for win64 directory first, then fall back to win32
				const win64Path = path.join(baseDriverPath, 'chromedriver-win64', 'chromedriver.exe');
				const win32Path = path.join(baseDriverPath, 'chromedriver-win32', 'chromedriver.exe');

				if (this.fileExists(win64Path)) {
					logger.info('Using ChromeDriver from win64 directory');
					return win64Path;
				} else if (this.fileExists(win32Path)) {
					logger.info('Using ChromeDriver from win32 directory');
					return win32Path;
				} else {
					logger.warn('No ChromeDriver found in win64 or win32 directories, defaulting to win64 path');
					return win64Path;
				}
			case 'darwin':
				return path.join(baseDriverPath, 'chromedriver-mac');
			default: // linux
				return path.join(baseDriverPath, 'chromedriver-linux64', 'chromedriver');
		}
	}

	/**
	 * Check if a file exists
	 * @param filePath Path to check
	 * @returns True if file exists, false otherwise
	 */
	private fileExists(filePath: string): boolean {
		try {
			return fs.existsSync(filePath);
		} catch (err) {
			return false;
		}
	}

	/**
	 * Creates chrome options with default settings
	 * @param headless Whether to run in headless mode
	 * @returns Chrome options object
	 */
	private createDefaultChromeOptions(headless: boolean = CONFIG.BROWSER.HEADLESS): Options {
		const options = new chrome.Options();

		// Common options
		options.addArguments('--no-sandbox');
		options.addArguments('--disable-gpu');
		options.addArguments('--remote-allow-origins=*');
		options.addArguments(`--window-size=${CONFIG.BROWSER.VIEWPORT.WIDTH},${CONFIG.BROWSER.VIEWPORT.HEIGHT}`);
		options.setPageLoadStrategy(PageLoadStrategy.EAGER);

		// Set headless mode if needed
		if (headless) {
			options.addArguments('--headless=new');
		}

		return options;
	}

	/**
	 * Creates a new Selenium WebDriver with the specified options
	 * @param options Configuration options for the driver
	 * @returns A configured WebDriver instance
	 */
	public async createDriver(options: DriverOptions = {}): Promise<WebDriver> {
		try {
			logger.info(`Creating Chrome driver with options: ${JSON.stringify(options)}`);
			logger.info(`Using ChromeDriver from ${process.platform} directory`);

			// Create Chrome options with anti-detection enhancements
			const chromeOptions = this.createEnhancedChromeOptions(options.headless ?? CONFIG.BROWSER.HEADLESS);

			// Add proxy if provided
			if (options.proxy) {
				const proxyString = this.buildProxyString(options.proxy);
				if (proxyString) {
					chromeOptions.addArguments(`--proxy-server=${proxyString}`);
					logger.info(`Using proxy: ${options.proxy.host}:${options.proxy.port}`);
				}
			}

			// Get the correct chromedriver path for this platform
			const chromeDriverPath = this.getChromeDriverPath();
			const serviceBuilder = new chrome.ServiceBuilder(chromeDriverPath);

			// Build and initialize the driver
			const driver = await new Builder()
				.forBrowser('chrome')
				.setChromeService(serviceBuilder)
				.setChromeOptions(chromeOptions)
				.build();

			// Set script and page load timeouts
			await driver.manage().setTimeouts({
				script: CONFIG.BROWSER.TIMEOUT.SCRIPT,
				pageLoad: CONFIG.BROWSER.TIMEOUT.PAGE_LOAD,
				implicit: CONFIG.BROWSER.TIMEOUT.ELEMENT
			});

			// Keep track of active drivers
			this.activeDrivers.push(driver);
			logger.info('Chrome driver created successfully');
			return driver;
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error(`Error creating WebDriver: ${errorMessage}`);
			throw new Error(`Failed to create WebDriver: ${errorMessage}`);
		}
	}

	/**
	 * Creates enhanced Chrome options with anti-detection and stability features
	 * @param headless Whether to run Chrome in headless mode
	 * @returns Chrome options object
	 */
	private createEnhancedChromeOptions(headless: boolean): chrome.Options {
		// Create base Chrome options
		const chromeOptions = new chrome.Options();

		// Add enhanced arguments for stability and anti-detection
		chromeOptions.addArguments(
			'--disable-dev-shm-usage',          // Overcome limited resource problems
			'--no-sandbox',                      // Required for running Chrome in containers
			'--disable-gpu',                     // Reduces CPU/GPU usage
			'--disable-setuid-sandbox',          // Additional sandbox security
			'--disable-infobars',                // Disable info bars that interfere with testing
			'--disable-notifications',           // Disable notifications
			'--disable-extensions',              // Disable extensions
			'--disable-popup-blocking',          // Disable popup blocking
			'--disable-web-security',            // Disable web security for login redirects
			'--disable-software-rasterizer',     // Avoid WebGL errors
			'--ignore-certificate-errors',       // Ignore certificate errors
			'--enable-unsafe-swiftshader',       // Address WebGL issues in error logs
			'--window-size=1920,1080',           // Set standard window size
			'--start-maximized'                  // Maximize window
		);

		// Set enhanced user agent
		const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
		chromeOptions.addArguments(`--user-agent=${userAgent}`);

		// Add headless specific options
		if (headless) {
			chromeOptions.addArguments(
				'--headless=new',                  // Use new headless mode
				'--disable-blink-features=AutomationControlled'  // Prevent automation detection
			);
		}

		// Add experimental options to prevent detection
		chromeOptions.addArguments('--disable-blink-features=AutomationControlled');
		// Set preferences to prevent detection
		chromeOptions.setUserPreferences({
			'credentials_enable_service': false,
			'profile.password_manager_enabled': false
		});

		return chromeOptions;
	}

	/**
	 * Builds a proxy string from proxy details
	 * @param proxy The proxy configuration
	 * @returns A proxy string for Chrome options
	 */
	private buildProxyString(proxy: IProxy): string {
		if (!proxy || !proxy.host || !proxy.port) {
			return '';
		}

		const protocol = proxy.protocol || 'http';
		let proxyString = `${protocol}://${proxy.host}:${proxy.port}`;

		// Add authentication if provided
		if (proxy.username && proxy.encryptedPassword) {
			const password = proxy.getPassword();
			if (password) {
				proxyString = `${protocol}://${proxy.username}:${password}@${proxy.host}:${proxy.port}`;
			}
		}

		return proxyString;
	}

	/**
	 * Quits a WebDriver instance and removes it from the active drivers list
	 * @param driver The WebDriver instance to quit
	 */
	public async quitDriver(driver: WebDriver): Promise<void> {
		try {
			if (driver) {
				await driver.quit();

				// Remove from active drivers
				const index = this.activeDrivers.indexOf(driver);
				if (index > -1) {
					this.activeDrivers.splice(index, 1);
				}
			}
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error('Error quitting WebDriver:', errorMessage);
		}
	}

	/**
	 * Quits all active WebDriver instances
	 */
	public async quitAllDrivers(): Promise<void> {
		try {
			const quitPromises = this.activeDrivers.map(driver => driver.quit());
			await Promise.all(quitPromises);
			this.activeDrivers = [];
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			logger.error('Error quitting all WebDrivers:', errorMessage);
		}
	}
}

export default SeleniumService.getInstance();
