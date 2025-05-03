import path from "path";
import fs from "fs";
import os from "os";
import { promisify } from "util";
import { config } from "../config/config";
import { Logger } from "./logger.service";

const chmod = promisify(fs.chmod);
const logger = new Logger("ChromeDriverService");

/**
 * Service to handle ChromeDriver path resolution and configuration across platforms
 */
export class ChromeDriverService {
  private static instance: ChromeDriverService;
  private chromeDriverPath: string | null = null;

  // Use Singleton pattern to avoid multiple instantiations
  public static getInstance(): ChromeDriverService {
    if (!ChromeDriverService.instance) {
      ChromeDriverService.instance = new ChromeDriverService();
    }
    return ChromeDriverService.instance;
  }

  private constructor() {
    // Private constructor to enforce singleton
  }

  /**
   * Get the path to the ChromeDriver executable based on the current platform
   * Follows priority: Custom path > Environment variable > Default path
   */
  public async getDriverPath(): Promise<string> {
    // Return cached path if already resolved
    if (this.chromeDriverPath) {
      return this.chromeDriverPath;
    }

    // Check environment variables first (highest priority)
    if (process.env.CHROMEDRIVER_PATH) {
      this.chromeDriverPath = process.env.CHROMEDRIVER_PATH;
      logger.info(
        `Using ChromeDriver from environment: ${this.chromeDriverPath}`,
      );
      return this.chromeDriverPath;
    }

    // Check config setting if available
    if (config.CHROMEDRIVER_PATH) {
      this.chromeDriverPath = config.CHROMEDRIVER_PATH;
      logger.info(`Using ChromeDriver from config: ${this.chromeDriverPath}`);
      return this.chromeDriverPath;
    }

    // Determine platform-specific path (lowest priority)
    const platform = os.platform();
    let defaultPath: string;

    if (platform === "win32") {
      // Windows path
      defaultPath = path.resolve(
        process.cwd(),
        "chromedriver",
        "chromedriver-win64",
        "chromedriver.exe",
      );
      logger.info(`Detected Windows platform, using: ${defaultPath}`);
    } else if (platform === "linux") {
      // Linux path
      defaultPath = path.resolve(
        process.cwd(),
        "chromedriver",
        "chromedriver-linux64",
        "chromedriver",
      );

      // Set executable permissions on Linux
      try {
        await chmod(defaultPath, 0o755); // rwx for owner, rx for group and others
        logger.info(`Set executable permissions for ChromeDriver on Linux`);
      } catch (error) {
        logger.error(`Failed to set permissions for ChromeDriver: ${error}`);
        // Continue anyway, it might already have correct permissions
      }

      logger.info(`Detected Linux platform, using: ${defaultPath}`);
    } else if (platform === "darwin") {
      // macOS support could be added here if needed
      logger.warn(
        `MacOS platform detected but not currently supported. Using Linux driver as fallback.`,
      );
      defaultPath = path.resolve(
        process.cwd(),
        "chromedriver",
        "chromedriver-linux64",
        "chromedriver",
      );
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Verify the file exists
    if (!fs.existsSync(defaultPath)) {
      throw new Error(
        `ChromeDriver not found at expected path: ${defaultPath}`,
      );
    }

    this.chromeDriverPath = defaultPath;
    return this.chromeDriverPath;
  }

  /**
   * Configure the selenium-webdriver Chrome service with the correct driver path
   */
  public async configureServiceBuilder(): Promise<any> {
    // This is a placeholder for integration with Selenium's ServiceBuilder
    // Will be implemented when integrating with the WebDriver factory
    const driverPath = await this.getDriverPath();
    return { path: driverPath };
  }
}
