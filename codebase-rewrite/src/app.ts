import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import path from 'path';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { Builder, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';
import { scheduleJob } from 'node-schedule';
import { config } from './config/config';
import { errorHandler } from './helpers/ErrorHandler';

// Import routes
import userRoutes from './routes/users.routes';
import campaignRoutes from './routes/campaign.routes';
import leadRoutes from './routes/lead.routes';
import linkedInAccountRoutes from './routes/linkedInAccount.routes';
import proxyRoutes from './routes/proxy.routes';
import leadCommentRoutes from './routes/leadComment.routes';
import leadLogsRoutes from './routes/leadLogs.routes';
import leadStatusRoutes from './routes/leadStatus.routes';
import emailSettingsRoutes from './routes/emailSettings.routes';

// Redis client
const redisClient = createClient({
  url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`
});

class App {
  public app: Express;
  public driver: WebDriver | null = null;

  constructor() {
    this.app = express();
    this.configureMiddlewares();
    this.configureRoutes();
    this.connectToDatabases();
    this.setupSelenium();
    this.setupCronJobs();
  }

  private configureMiddlewares(): void {
    this.app.use(cors());
    if (config.NODE_ENV === 'development') {
      this.app.use(logger('dev'));
    }
    this.app.use(express.json({ limit: '100mb' }));
    this.app.use(express.urlencoded({ extended: false, limit: '100mb' }));
    this.app.use(cookieParser());
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  private configureRoutes(): void {
    // API routes
    this.app.use('/users', userRoutes);
    this.app.use('/campaign', campaignRoutes);
    this.app.use('/lead', leadRoutes);
    this.app.use('/linkedInAccount', linkedInAccountRoutes);
    this.app.use('/proxies', proxyRoutes);
    this.app.use('/leadComments', leadCommentRoutes);
    this.app.use('/leadLogs', leadLogsRoutes);
    this.app.use('/leadStatus', leadStatusRoutes);
    this.app.use('/emailSettings', emailSettingsRoutes);

    // Serve the frontend (SPA)
    this.app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // Error handler middleware
    this.app.use(errorHandler);
  }

  private async connectToDatabases(): Promise<void> {
    try {
      // MongoDB connection
      await mongoose.connect(config.MONGOURI);
      console.log('MongoDB connected successfully');

      // Redis connection
      await redisClient.connect();
      await redisClient.set('isFree', 'true');
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Database connection error:', error);
      process.exit(1);
    }
  }

  private async setupSelenium(): Promise<void> {
    try {
      const chromeOptions = new Options();

      if (config.ENABLE_HEADLESS === 'true') {
        chromeOptions.addArguments('--headless=new', '--disable-gpu');
      }

      chromeOptions.addArguments(
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials'
      );

      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .build();

      console.log('Selenium WebDriver initialized successfully');
    } catch (error) {
      console.error('Selenium WebDriver initialization error:', error);
    }
  }

  private setupCronJobs(): void {
    // Skip cron setup if disabled
    if (config.ENABLE_CRON !== 'true') {
      console.log('Cron jobs are disabled');
      return;
    }

    // Schedule cron job to run at midnight
    scheduleJob('0 0 * * *', async () => {
      try {
        console.log(`Cron job started at ${new Date().toISOString()}`);
        // Import here to avoid circular dependencies
        const { cronFunc } = require('./helpers/cronFunctions');
        await cronFunc(this.driver, redisClient);
        console.log(`Cron job completed at ${new Date().toISOString()}`);
      } catch (error) {
        console.error('Cron job error:', error);
      }
    });

    console.log('Cron jobs scheduled successfully');
  }
}

// Create app instance
const application = new App();
export const app = application.app;
export const driver = application.driver;