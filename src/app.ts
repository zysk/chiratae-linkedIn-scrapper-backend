import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import path from 'path';
import { createClient } from 'redis';

// Import our utilities
import { CONFIG } from './utils/config';
import { errorHandler, ApiError } from './middleware/errorHandler';
import { checkChromeDriver } from './utils/checkChromeDriver';

// Import routes
import userRoutes from './routes/user.routes';
import userRatingRoutes from './routes/userRating.routes';
import linkedinAccountRoutes from './routes/linkedinAccount.routes';
import proxyRoutes from './routes/proxy.routes';
import campaignRoutes from './routes/campaign.routes';
import linkedInRoutes from './routes/linkedin.routes';
import leadRoutes from './routes/lead.routes';

// Create Express app
const app = express();

// Connect to MongoDB
mongoose.connect(CONFIG.MONGOURI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Check ChromeDriver installation on startup
(async () => {
  try {
    await checkChromeDriver();
  } catch (error) {
    console.warn('ChromeDriver check failed, LinkedIn automation might not work correctly:', error);
  }
})();

// Connect to Redis (with proper error handling)
const redisClient = createClient({
  url: CONFIG.REDIS_URL
});

redisClient.on('connect', () => {
  console.log('Redis connected');
  redisClient.set('app:status', 'online');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.connect().catch(console.error);

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date(),
    environment: CONFIG.NODE_ENV
  });
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(new ApiError(`Not Found - ${req.originalUrl}`, 404));
});

// Error handler
app.use(errorHandler);

export default app;
