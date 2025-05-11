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
	TIMEZONE: process.env.TZ || 'Asia/Kolkata',

	// Email configuration
	EMAIL: {
		HOST: process.env.EMAIL_HOST,
		PORT: parseInt(process.env.EMAIL_PORT || '587'),
		USER: process.env.EMAIL_USER,
		PASS: process.env.EMAIL_PASS,
		FROM: process.env.EMAIL_FROM
	},

	// Encryption configuration
	ENCRYPTION: {
		KEY: process.env.ENCRYPTION_KEY || 'dK8Hy2P9Nf5Vb7Xq1Wm4Rj6Tl9Zs3Yc',
		IV: process.env.ENCRYPTION_IV || '1234567890123456',
		ALGORITHM: process.env.ENCRYPTION_ALGORITHM || 'aes-256-cbc'
	},

	// Scheduler configuration
	SCHEDULER: {
		INTERNAL_API_TOKEN: process.env.SCHEDULER_INTERNAL_API_TOKEN || 'your-internal-api-token'
	},

	// Browser configuration
	BROWSER: {
		HEADLESS: process.env.BROWSER_HEADLESS === 'true',
		USER_AGENT: process.env.BROWSER_USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
		VIEWPORT: {
			WIDTH: parseInt(process.env.BROWSER_VIEWPORT_WIDTH || '1920', 10),
			HEIGHT: parseInt(process.env.BROWSER_VIEWPORT_HEIGHT || '1080', 10)
		},
		TIMEOUT: {
			PAGE_LOAD: parseInt(process.env.BROWSER_TIMEOUT_PAGE_LOAD || '15000', 10),
			ELEMENT: parseInt(process.env.BROWSER_TIMEOUT_ELEMENT || '5000', 10),
			SCRIPT: parseInt(process.env.BROWSER_TIMEOUT_SCRIPT || '3000', 10)
		},
		SESSION_CLEANUP_INTERVAL: parseInt(process.env.BROWSER_SESSION_CLEANUP_INTERVAL || '300000', 10),
		SESSION_MAX_AGE: parseInt(process.env.BROWSER_SESSION_MAX_AGE || '3600000', 10)
	},

	// LinkedIn configuration
	LINKEDIN: {
		BASE_URL: process.env.LINKEDIN_BASE_URL || 'https://www.linkedin.com',
		LOGIN_URL: process.env.LINKEDIN_LOGIN_URL || 'https://www.linkedin.com/login',
		FEED_URL: process.env.LINKEDIN_FEED_URL || 'https://www.linkedin.com/feed',
		RETRY_ATTEMPTS: parseInt(process.env.LINKEDIN_RETRY_ATTEMPTS || '3', 10),
		RETRY_DELAY: parseInt(process.env.LINKEDIN_RETRY_DELAY || '1000', 10),
		MAX_RETRIES: parseInt(process.env.LINKEDIN_MAX_RETRIES || '3', 10)
	},

	DEBUG: {
		SAVE_SCREENSHOTS: process.env.SAVE_SCREENSHOTS === 'false' ? false : true,
		LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
		SELECTORS: process.env.DEBUG_SELECTORS === 'false' ? false : true,
		CHROME_LOGS: process.env.CHROME_LOGS === 'false' ? false : true,
	}
} as const;
