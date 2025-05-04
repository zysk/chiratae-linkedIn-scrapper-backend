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

// Connect to Redis (with proper error handling)
const redisClient = createClient({
  url: CONFIG.REDIS_URL
});

redisClient.on('connect', () => {
  console.log('Redis connected');
  redisClient.set('isFree', 'true')
    .then(() => console.log('Key set successfully in Redis'))
    .catch((err) => console.error('Error setting key in Redis:', err));
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redisClient.connect().catch((err) => {
  console.error('Redis connection attempt failed:', err);
});

// Set up middleware
app.use(cors());
app.use(logger(CONFIG.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb', parameterLimit: 10000000 }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    environment: CONFIG.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Setup routes (will be implemented later)
// app.use('/users', usersRouter);
// app.use('/campaign', campaignRouter);
// app.use('/lead', leadRouter);
// ... more routes

// Catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new ApiError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
});

// Global error handler middleware
app.use(errorHandler);

export { redisClient };
export default app;
