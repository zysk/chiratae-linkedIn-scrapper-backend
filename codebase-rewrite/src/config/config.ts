import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Config interface
interface Config {
  PORT: string;
  NODE_ENV: string;
  TZ: string;
  MONGOURI: string;
  JWT_SECRET: string;
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_LIFE: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  ENABLE_HEADLESS: string;
  ENABLE_CRON: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
}

// Default config values
const defaultConfig: Config = {
  PORT: '3000',
  NODE_ENV: 'development',
  TZ: 'UTC',
  MONGOURI: 'mongodb://localhost:27017/linkedin-scraper',
  JWT_SECRET: 'jwt_default_secret',
  ACCESS_TOKEN_SECRET: 'access_token_default_secret',
  ACCESS_TOKEN_LIFE: '7d',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  ENABLE_HEADLESS: 'true',
  ENABLE_CRON: 'true',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'user@example.com',
  SMTP_PASS: 'password',
  SMTP_FROM: 'noreply@example.com'
};

// Load config values from environment variables or use defaults
export const config: Config = {
  PORT: process.env.PORT || defaultConfig.PORT,
  NODE_ENV: process.env.NODE_ENV || defaultConfig.NODE_ENV,
  TZ: process.env.TZ || defaultConfig.TZ,
  MONGOURI: process.env.MONGOURI || defaultConfig.MONGOURI,
  JWT_SECRET: process.env.JWT_SECRET || defaultConfig.JWT_SECRET,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || defaultConfig.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_LIFE: process.env.ACCESS_TOKEN_LIFE || defaultConfig.ACCESS_TOKEN_LIFE,
  REDIS_HOST: process.env.REDIS_HOST || defaultConfig.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT || defaultConfig.REDIS_PORT,
  ENABLE_HEADLESS: process.env.ENABLE_HEADLESS || defaultConfig.ENABLE_HEADLESS,
  ENABLE_CRON: process.env.ENABLE_CRON || defaultConfig.ENABLE_CRON,
  SMTP_HOST: process.env.SMTP_HOST || defaultConfig.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || defaultConfig.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER || defaultConfig.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS || defaultConfig.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || defaultConfig.SMTP_FROM
};

// Validate required configuration
const requiredEnvVars: Array<keyof Config> = [
  'MONGOURI',
  'JWT_SECRET',
  'ACCESS_TOKEN_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !config[envVar] || config[envVar] === defaultConfig[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`Warning: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Using default values for development. DO NOT use default values in production!');
}

// Export configuration
export default config;