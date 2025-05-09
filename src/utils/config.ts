import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Central configuration object for the application
 */
export const CONFIG = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database configuration
  MONGOURI: process.env.MONGOURI || 'mongodb://localhost:27017/linkedin-scraper',

  // JWT configuration
  JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET || 'access_token_secret',
  JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_token_secret',
  JWT_ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '1D',
  JWT_REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7D',

  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // LinkedIn scraper configuration
  ENABLE_CRON: process.env.ENABLE_CRON === 'true',
  ENABLE_WORKERS: process.env.ENABLE_WORKERS !== 'false',
  HEADLESS_BROWSER: process.env.HEADLESS_BROWSER === 'true',
  TIMEZONE: process.env.TZ || 'Asia/Kolkata',

  // Email configuration
  EMAIL: {
    HOST: process.env.EMAIL_HOST,
    PORT: parseInt(process.env.EMAIL_PORT || '587'),
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS,
    FROM: process.env.EMAIL_FROM
  }
};
