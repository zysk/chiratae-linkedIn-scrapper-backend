import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import path from 'path';

// Import our utilities
import { CONFIG } from './utils/config';
import { errorHandler, ApiError } from './middleware/errorHandler';
import { checkChromeDriver } from './utils/checkChromeDriver';
import appLogger from './utils/logger';

// Import services
import RedisService from './services/redis/RedisService';
import SchedulerService from './services/redis/SchedulerService';

// Import routes
import userRoutes from './routes/user.routes';
import userRatingRoutes from './routes/userRating.routes';
import linkedinAccountRoutes from './routes/linkedinAccount.routes';
import proxyRoutes from './routes/proxy.routes';
import campaignRoutes from './routes/campaign.routes';
import linkedInRoutes from './routes/linkedin.routes';
import leadRoutes from './routes/lead.routes';
import utilsRoutes from './routes/utils.routes';

// Create Express app
const app = express();

// Connect to MongoDB
mongoose.connect(CONFIG.MONGOURI)
  .then(() => {
    appLogger.info('Connected to MongoDB');
  })
  .catch((err) => {
    appLogger.error(`MongoDB connection error: ${err}`);
  });

// Check ChromeDriver installation on startup
(async () => {
  try {
    await checkChromeDriver();
  } catch (error) {
    appLogger.warn(`ChromeDriver check failed, LinkedIn automation might not work correctly: ${error instanceof Error ? error.message : String(error)}`);
  }
})();

// Initialize Redis services
(async () => {
  try {
    // Initialize Redis
    const redisService = RedisService.getInstance();
    const client = await redisService.getClient();
    await client.set('app:status', 'online');
    appLogger.info('Redis initialized successfully');

    // Initialize job scheduler if enabled in config
    if (CONFIG.ENABLE_CRON) {
      const scheduler = SchedulerService.getInstance();
      await scheduler.initialize();
      appLogger.info('Scheduler service initialized successfully');
    } else {
      appLogger.info('Scheduler service not enabled - ENABLE_CRON is set to false');
    }
  } catch (error) {
    appLogger.error(`Failed to initialize Redis services: ${error instanceof Error ? error.message : String(error)}`);
  }
})();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/ratings', userRatingRoutes);
app.use('/api/linkedin-accounts', linkedinAccountRoutes);
app.use('/api/proxies', proxyRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/linkedin', linkedInRoutes);
app.use('/api/lead', leadRoutes);
app.use('/api/utils', utilsRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const isMongoConnected = mongoose.connection.readyState === 1;

    // Check Redis connection
    let isRedisConnected = false;
    try {
      const redisService = RedisService.getInstance();
      isRedisConnected = redisService.isRedisConnected();
    } catch (error) {
      appLogger.error(`Error checking Redis connection: ${error instanceof Error ? error.message : String(error)}`);
    }

    res.status(200).json({
      status: 'success',
      message: 'API is running',
      timestamp: new Date(),
      environment: CONFIG.NODE_ENV,
      services: {
        mongodb: isMongoConnected ? 'connected' : 'disconnected',
        redis: isRedisConnected ? 'connected' : 'disconnected',
        scheduler: CONFIG.ENABLE_CRON ? 'enabled' : 'disabled'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking service health',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(new ApiError(`Not Found - ${req.originalUrl}`, 404));
});

// Error handler
app.use(errorHandler);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  appLogger.info('SIGTERM received, shutting down gracefully');

  try {
    // Shutdown scheduler if enabled
    if (CONFIG.ENABLE_CRON) {
      const scheduler = SchedulerService.getInstance();
      await scheduler.shutdown();
    }

    // Close Redis connection
    const redisService = RedisService.getInstance();
    await redisService.close();

    // Close MongoDB connection
    await mongoose.connection.close();
    appLogger.info('Services gracefully closed');
  } catch (error) {
    appLogger.error(`Error during graceful shutdown: ${error instanceof Error ? error.message : String(error)}`);
  }

  process.exit(0);
});

export default app;
