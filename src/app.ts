import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "morgan";
import path from "path";
import mongoose from "mongoose";
import { createClient, RedisClientType } from "redis";
import { WebDriver } from "selenium-webdriver";
import { scheduleJob } from "node-schedule";
import { config } from "./config/config";
import { errorHandler } from "./helpers/ErrorHandler";
import { getRedisClient } from "./services/redis.service"; // Import the Redis service function
import { Logger } from "./services/logger.service";
import { ChromeDriverService } from "./services/chromedriver.service";
import { webDriverFactory } from "./services/webDriverFactory.service";
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
import adminRoutes from "./routes/admin.routes";

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

  private async connectToDatabases(): Promise<void> {
    try {
      // Connect to MongoDB
      await connectDatabase();
      this.logger.info("MongoDB connected successfully");

      // Initialize and connect to Redis
      this.redisClient = await getRedisClient();
      this.logger.info("Redis client connected successfully");
    } catch (error) {
      this.logger.error("Database connection failed:", error);
      throw error; // Re-throw for the main promise catch
    }
  }

  private async configureMiddlewares(): Promise<void> {
    // Set up request parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(cookieParser());

    // Set up CORS
    const corsOptions = {
      origin: "*", // Allow all origins by default
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    };
    this.app.use(cors(corsOptions));

    // Enable request logging in development mode
    if (process.env.NODE_ENV !== "production") {
      this.app.use(logger("dev"));
    }

    // Serve static files
    this.app.use(express.static(path.join(__dirname, "public")));

    this.logger.info("Middlewares configured successfully");
  }

  private async configureRoutes(): Promise<void> {
    // Healthcheck endpoint
    this.app.get("/api/health", (req: Request, res: Response) => {
      res.status(200).json({
        status: "success",
        message: "Server is running",
        time: new Date().toISOString(),
      });
    });

    // API routes
    this.app.use("/api/users", userRoutes);
    this.app.use("/api/campaigns", campaignRoutes);
    this.app.use("/api/leads", leadRoutes);
    this.app.use("/api/linkedin-accounts", linkedInAccountRoutes);
    this.app.use("/api/proxies", proxyRoutes);
    this.app.use("/api/lead-comments", leadCommentRoutes);
    this.app.use("/api/lead-logs", leadLogsRoutes);
    this.app.use("/api/lead-statuses", leadStatusRoutes);
    this.app.use("/api/email-settings", emailSettingsRoutes);
    this.app.use("/api/admin", adminRoutes);

    // Error handling middleware
    this.app.use(notFoundMiddleware);
    this.app.use(errorMiddleware);

    this.logger.info("Routes configured successfully");
  }

  private async setupSelenium(): Promise<void> {
    try {
      // Create default driver without proxy on startup using the WebDriverFactory
      this.driver = await webDriverFactory.createDriver();
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

  private async setupCronJobs(): Promise<void> {
    // Example cron job
    // This would be replaced with actual cron job initialization
    if (config.ENABLE_CRON === "true") {
      this.logger.info("Setting up cron jobs");

      // Example: Run a job every day at 2 AM
      scheduleJob("0 2 * * *", async () => {
        this.logger.info("Running scheduled job");
        // Job implementation would go here
      });
    } else {
      this.logger.info("Cron jobs are disabled");
    }
  }
}

export const app = new App().app;
// Don't expose driver directly anymore, use WebDriverFactory instead
