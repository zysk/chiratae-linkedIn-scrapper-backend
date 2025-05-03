import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "morgan";
import path from "path";
import mongoose from "mongoose";
import { createClient, RedisClientType } from "redis";
import { Builder, WebDriver, Capabilities } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { scheduleJob } from "node-schedule";
import { config } from "./config/config";
import { errorHandler } from "./helpers/ErrorHandler";
import { getRedisClient } from "./services/redis.service"; // Import the Redis service function
import { Logger } from "./services/logger.service";
import { ChromeDriverService } from "./services/chromedriver.service";
import { ensureLogsDirectory } from "./utils/ensure-dir";
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware';
import { connectDatabase } from './utils/db.util';
import { validateEnvironment } from './utils/env-validator.util';
import { defaultConfig } from './config/config';

// Initialize logger
ensureLogsDirectory();
const appLogger = new Logger("App");

// Import routes
import userRoutes from "./routes/users.routes";
import campaignRoutes from "./routes/campaign.routes";
import leadRoutes from "./routes/lead.routes";
import linkedInAccountRoutes from "./routes/linkedInAccount.routes";
import proxyRoutes from "./routes/proxy.routes";
import leadCommentRoutes from "./routes/leadComment.routes";
import leadLogsRoutes from "./routes/leadLogs.routes";
import leadStatusRoutes from "./routes/leadStatus.routes";
import emailSettingsRoutes from "./routes/emailSettings.routes";

// No longer export redisClient directly from here
// let redisClient: RedisClientType;

/**
 * Creates a configured Selenium WebDriver instance.
 * @param proxy - Optional proxy configuration string (e.g., "http://user:pass@host:port").
 * @returns A promise resolving to the WebDriver instance.
 */
const createWebDriver = async (proxy?: string): Promise<WebDriver> => {
  const logger = new Logger("WebDriverFactory");
  const chromeDriverService = ChromeDriverService.getInstance();
  const chromeDriverPath = await chromeDriverService.getDriverPath();

  logger.info(`Using ChromeDriver at: ${chromeDriverPath}`);

  const chromeOptions = new chrome.Options();
  // Set chromedriver path using the platform-specific path
  chromeOptions.setChromeBinaryPath(chromeDriverPath);

  if (config.ENABLE_HEADLESS === "true") {
    chromeOptions.addArguments("--headless=new", "--disable-gpu");
    logger.info("Running Chrome in headless mode");
  }

  chromeOptions.addArguments(
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--disable-web-security",
    "--disable-features=IsolateOrigins,site-per-process",
    "--disable-site-isolation-trials",
  );

  const capabilities = Capabilities.chrome();
  capabilities.set("goog:chromeOptions", chromeOptions);

  // Configure proxy if provided
  if (proxy) {
    const proxyConfig = {
      proxyType: "manual",
      httpProxy: proxy,
      sslProxy: proxy,
      // ftpProxy: proxy, // Add if needed
      // socksProxy: proxy, // Add if needed
      // socksVersion: 5, // Specify SOCKS version if using SOCKS proxy
    };
    capabilities.setProxy(proxyConfig);
    logger.info(`WebDriver configured to use proxy: ${proxy}`);
  }

  try {
    // Create service with the correct path
    const service = new chrome.ServiceBuilder(chromeDriverPath);

    const driver = await new Builder()
      .forBrowser("chrome")
      .withCapabilities(capabilities)
      .setChromeService(service)
      .build();

    logger.info("Selenium WebDriver initialized successfully");
    return driver;
  } catch (error) {
    logger.error("Selenium WebDriver initialization error:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

class App {
  public app: Express;
  public driver: WebDriver | null = null;
  public redisClient: RedisClientType | null = null; // Add property to hold client
  private logger: Logger;

  constructor() {
    this.app = express();
    this.logger = new Logger("App");

    // Validate environment before proceeding
    validateEnvironment(defaultConfig as unknown as Record<string, string>, false);

    this.connectToDatabases()
      .then(() => {
        // Execute setup functions in parallel
        return Promise.all([
          this.configureMiddlewares(),
          this.configureRoutes(),
          this.setupSelenium(),
          this.setupCronJobs()
        ]);
      })
      .catch((err) => {
        this.logger.error("Failed to initialize application:", err);
        process.exit(1);
      });
  }

  private configureMiddlewares(): Promise<void> {
    this.app.use(cors());
    if (config.NODE_ENV === "development") {
      this.app.use(logger("dev"));
    }
    this.app.use(express.json({ limit: "100mb" }));
    this.app.use(express.urlencoded({ extended: false, limit: "100mb" }));
    this.app.use(cookieParser());
    this.app.use(express.static(path.join(__dirname, "../public")));

    return Promise.resolve();
  }

  private configureRoutes(): Promise<void> {
    // API routes
    this.app.use("/users", userRoutes);
    this.app.use("/campaign", campaignRoutes);
    this.app.use("/lead", leadRoutes);
    this.app.use("/linkedInAccount", linkedInAccountRoutes);
    this.app.use("/proxies", proxyRoutes);
    this.app.use("/leadComments", leadCommentRoutes);
    this.app.use("/leadLogs", leadLogsRoutes);
    this.app.use("/leadStatus", leadStatusRoutes);
    this.app.use("/emailSettings", emailSettingsRoutes);

    // Serve the frontend (SPA)
    this.app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "../public/index.html"));
    });

    // 404 handler for unmatched routes
    this.app.use(notFoundMiddleware);

    // Error handler middleware
    this.app.use(errorMiddleware);

    return Promise.resolve();
  }

  private async connectToDatabases(): Promise<void> {
    // MongoDB connection using the new utility
    try {
      await connectDatabase();
      this.logger.info("MongoDB connected successfully");
    } catch (mongoError) {
      this.logger.error("MongoDB connection failed:", mongoError);
      throw mongoError; // Re-throw to trigger app failure
    }

    // Redis connection using the service
    try {
      this.redisClient = await getRedisClient();
      await this.redisClient.set("isFree", "true"); // Initialize lock state (if needed globally)
      this.logger.info("Redis connected successfully");
    } catch (redisError) {
      this.logger.error(
        "Failed to connect to Redis during app initialization:",
        redisError,
      );
      // Decide if Redis is critical for startup
      // process.exit(1);
    }
  }

  private async setupSelenium(): Promise<void> {
    try {
      // Create default driver without proxy on startup
      this.driver = await createWebDriver();
      this.logger.info("Initial Selenium WebDriver setup completed");
    } catch (error) {
      this.logger.error(
        "Initial Selenium setup failed. Scraping features might be unavailable.",
        error,
      );
      // Continue running the app without a driver if setup fails initially
      this.driver = null;
    }
  }

  private setupCronJobs(): Promise<void> {
    // Skip cron setup if disabled
    if (config.ENABLE_CRON !== "true") {
      this.logger.info("Cron jobs are disabled");
      return Promise.resolve();
    }

    // Schedule cron job to run at midnight
    scheduleJob("0 0 * * *", async () => {
      if (!this.driver || !this.redisClient) {
        this.logger.error(
          "Cron job skipped: WebDriver or Redis not initialized.",
        );
        return;
      }
      try {
        this.logger.info(`Cron job started at ${new Date().toISOString()}`);
        // Import here to avoid circular dependencies
        const { cronFunc } = await import("./helpers/cronFunctions");
        await cronFunc(this.driver, this.redisClient);
        this.logger.info(`Cron job completed at ${new Date().toISOString()}`);
      } catch (error) {
        this.logger.error("Cron job error:", error);
      }
    });

    this.logger.info("Cron jobs scheduled successfully");
    return Promise.resolve();
  }
}

// Create app instance
const application = new App();
export const app = application.app;
// Export the function to create drivers and potentially the initial driver
export { createWebDriver };
export const initialDriver = application.driver; // Keep exporting initial driver for potential direct use
// Export the redis client instance from the app if needed elsewhere
// export const redisClient = application.redisClient;
// OR encourage getting it via getRedisClient() from the service
