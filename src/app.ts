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
  const chromeOptions = new chrome.Options();

  if (config.ENABLE_HEADLESS === "true") {
    chromeOptions.addArguments("--headless=new", "--disable-gpu");
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
    console.log(`WebDriver configured to use proxy: ${proxy}`);
  }

  try {
    const driver = await new Builder()
      .forBrowser("chrome")
      .withCapabilities(capabilities)
      .build();
    console.log("Selenium WebDriver initialized successfully");
    return driver;
  } catch (error) {
    console.error("Selenium WebDriver initialization error:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

class App {
  public app: Express;
  public driver: WebDriver | null = null;
  public redisClient: RedisClientType | null = null; // Add property to hold client

  constructor() {
    this.app = express();
    this.connectToDatabases()
      .then(() => {
        this.configureMiddlewares();
        this.configureRoutes();
        this.setupSelenium(); // Setup initial driver
        this.setupCronJobs();
      })
      .catch((err) => {
        console.error("Failed to initialize application:", err);
        process.exit(1);
      });
  }

  private configureMiddlewares(): void {
    this.app.use(cors());
    if (config.NODE_ENV === "development") {
      this.app.use(logger("dev"));
    }
    this.app.use(express.json({ limit: "100mb" }));
    this.app.use(express.urlencoded({ extended: false, limit: "100mb" }));
    this.app.use(cookieParser());
    this.app.use(express.static(path.join(__dirname, "../public")));
  }

  private configureRoutes(): void {
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

    // Error handler middleware
    this.app.use(errorHandler);
  }

  private async connectToDatabases(): Promise<void> {
    // MongoDB connection
    await mongoose.connect(config.MONGOURI);
    console.log("MongoDB connected successfully");

    // Redis connection using the service
    try {
      this.redisClient = await getRedisClient();
      await this.redisClient.set("isFree", "true"); // Initialize lock state (if needed globally)
    } catch (redisError) {
      console.error(
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
    } catch (error) {
      console.error(
        "Initial Selenium setup failed. Scraping features might be unavailable.",
        error,
      );
      // Continue running the app without a driver if setup fails initially
      this.driver = null;
    }
  }

  private setupCronJobs(): void {
    // Skip cron setup if disabled
    if (config.ENABLE_CRON !== "true") {
      console.log("Cron jobs are disabled");
      return;
    }

    // Schedule cron job to run at midnight
    scheduleJob("0 0 * * *", async () => {
      if (!this.driver || !this.redisClient) {
        console.error("Cron job skipped: WebDriver or Redis not initialized.");
        return;
      }
      try {
        console.log(`Cron job started at ${new Date().toISOString()}`);
        // Import here to avoid circular dependencies
        const { cronFunc } = await import("./helpers/cronFunctions");
        await cronFunc(this.driver, this.redisClient);
        console.log(`Cron job completed at ${new Date().toISOString()}`);
      } catch (error) {
        console.error("Cron job error:", error);
      }
    });

    console.log("Cron jobs scheduled successfully");
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
