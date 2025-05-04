import { Builder, WebDriver, Capabilities } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';
import { Logger } from './logger.service';
import { ChromeDriverService } from './chromedriver.service';
import { config } from '../config/config';
import ProxyService from './proxy.service';

/**
 * Options for configuring the WebDriver instance
 */
export interface WebDriverOptions {
  /**
   * Proxy configuration (can be object ID, connection string, or proxy value)
   */
  proxy?: string | { host: string; port: number; username?: string; password?: string };

  /**
   * Whether to run in headless mode
   */
  headless?: boolean;

  /**
   * Additional Chrome arguments
   */
  additionalArgs?: string[];

  /**
   * Timeout for operations in milliseconds
   */
  timeout?: number;

  /**
   * User agent to use
   */
  userAgent?: string;
}

/**
 * Factory class for creating WebDriver instances with consistent configuration
 */
export class WebDriverFactory {
  private static instance: WebDriverFactory;
  private logger: Logger;
  private chromeDriverService: ChromeDriverService;

  private constructor() {
    this.logger = new Logger('WebDriverFactory');
    this.chromeDriverService = ChromeDriverService.getInstance();
  }

  /**
   * Get the singleton instance of WebDriverFactory
   */
  public static getInstance(): WebDriverFactory {
    if (!WebDriverFactory.instance) {
      WebDriverFactory.instance = new WebDriverFactory();
    }
    return WebDriverFactory.instance;
  }

  /**
   * Create a new WebDriver instance with the specified options
   *
   * @param options Configuration options for the WebDriver
   * @returns A Promise resolving to a configured WebDriver instance
   */
  public async createDriver(options: WebDriverOptions = {}): Promise<WebDriver> {
    try {
      // Get the ChromeDriver path
      const chromeDriverPath = await this.chromeDriverService.getDriverPath();
      this.logger.info(`Using ChromeDriver at: ${chromeDriverPath}`);

      // Create and configure Chrome options
      const chromeOptions = this.configureChromeOptions(options, chromeDriverPath);

      // Set up capabilities
      const capabilities = Capabilities.chrome();
      capabilities.set('goog:chromeOptions', chromeOptions);

      // Configure proxy if provided
      if (options.proxy) {
        this.configureProxy(capabilities, options.proxy);
      }

      // Create ChromeDriver service
      const service = new chrome.ServiceBuilder(chromeDriverPath);

      // Build and return the WebDriver
      const driver = await new Builder()
        .forBrowser('chrome')
        .withCapabilities(capabilities)
        .setChromeService(service)
        .build();

      // Set timeout if specified
      if (options.timeout) {
        await driver.manage().setTimeouts({
          implicit: options.timeout,
          pageLoad: options.timeout,
          script: options.timeout
        });
      }

      this.logger.info('WebDriver initialized successfully');
      return driver;
    } catch (error: any) {
      this.logger.error('Failed to initialize WebDriver:', error);
      throw error;
    }
  }

  /**
   * Configure Chrome options based on the provided configuration
   *
   * @param options WebDriver options
   * @param chromeDriverPath Path to ChromeDriver executable
   * @returns Configured Chrome options
   */
  private configureChromeOptions(options: WebDriverOptions, chromeDriverPath: string): chrome.Options {
    const chromeOptions = new chrome.Options();

    // Set binary path
    chromeOptions.setChromeBinaryPath(chromeDriverPath);

    // Configure headless mode
    const useHeadless = options.headless ?? (config.ENABLE_HEADLESS === 'true');

    if (useHeadless) {
      chromeOptions.addArguments('--headless=new', '--disable-gpu');
      this.logger.info('Running Chrome in headless mode');
    }

    // Add default arguments
    chromeOptions.addArguments(
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--window-size=1920,1080'
    );

    // Set user agent if provided
    if (options.userAgent) {
      chromeOptions.addArguments(`--user-agent=${options.userAgent}`);
    } else {
      // Default user agent that looks like a regular browser
      chromeOptions.addArguments(
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      );
    }

    // Add any additional arguments
    if (options.additionalArgs && options.additionalArgs.length > 0) {
      chromeOptions.addArguments(...options.additionalArgs);
    }

    return chromeOptions;
  }

  /**
   * Configure proxy settings for the WebDriver
   *
   * @param capabilities Capabilities object to configure
   * @param proxyConfig Proxy configuration (string or object)
   */
  private configureProxy(capabilities: Capabilities, proxyConfig: string | { host: string; port: number; username?: string; password?: string }): void {
    try {
      // Create proxy configuration
      if (typeof proxyConfig === 'string') {
        // Parse the proxy string
        const parsedProxy = ProxyService.parseProxyValue(proxyConfig);
        if (!parsedProxy) {
          throw new Error(`Invalid proxy string: ${proxyConfig}`);
        }

        // Configure proxy using Chrome arguments
        const proxyStr = `${parsedProxy.host}:${parsedProxy.port}`;
        const chromeOptions = capabilities.get('goog:chromeOptions') as chrome.Options;

        chromeOptions.addArguments(`--proxy-server=${proxyStr}`);

        if (parsedProxy.username && parsedProxy.password) {
          // For authenticated proxy we'd need to use an extension
          // This is a placeholder - in a real implementation, would add proxy authentication extension
          this.logger.info(`Configured authenticated proxy: ${proxyStr}`);
        } else {
          this.logger.info(`Configured proxy: ${proxyStr}`);
        }

        capabilities.set('goog:chromeOptions', chromeOptions);
      } else {
        // Use the provided proxy object
        const proxyStr = `${proxyConfig.host}:${proxyConfig.port}`;
        const chromeOptions = capabilities.get('goog:chromeOptions') as chrome.Options;

        chromeOptions.addArguments(`--proxy-server=${proxyStr}`);

        if (proxyConfig.username && proxyConfig.password) {
          // Authenticated proxy handling
          this.logger.info(`Configured authenticated proxy: ${proxyStr}`);
        } else {
          this.logger.info(`Configured proxy: ${proxyStr}`);
        }

        capabilities.set('goog:chromeOptions', chromeOptions);
      }
    } catch (error: any) {
      this.logger.error('Failed to configure proxy:', error);
      throw new Error(`Failed to configure proxy: ${error.message}`);
    }
  }
}

// Export a singleton instance for easy import
export const webDriverFactory = WebDriverFactory.getInstance();

export default webDriverFactory;