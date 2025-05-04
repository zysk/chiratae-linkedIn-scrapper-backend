import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Config interface
interface Config {
  PORT: string;
  NODE_ENV: string;
  TZ: string;
  MONGOURI: string;
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_LIFE: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_LIFE: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  ENABLE_HEADLESS: string;
  ENABLE_CRON: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  ENCRYPTION_KEY: string;
  LOG_LEVEL: string;
  CHROMEDRIVER_PATH?: string; // Optional: Used for custom ChromeDriver path

  // Selenium and LinkedIn Configuration
  SELENIUM_HEADLESS: string;
  SELENIUM_USER_AGENT?: string;
  SELENIUM_WINDOW_WIDTH: string;
  SELENIUM_WINDOW_HEIGHT: string;
  SELENIUM_TIMEOUT: string;
  LINKEDIN_LOGIN_RETRY_ATTEMPTS: string;
  LINKEDIN_LOGIN_RETRY_DELAY: string;
  LINKEDIN_SEARCH_DELAY_MIN: string;
  LINKEDIN_SEARCH_DELAY_MAX: string;
  LINKEDIN_SCRAPER_REQUEST_TIMEOUT: string;
  LINKEDIN_SESSION_EXPIRY_HOURS: string;
  LINKEDIN_PROFILES_PER_SEARCH: string;
  LINKEDIN_MAX_ACCOUNTS_PER_DAY: string;
}

// Default config values
export const defaultConfig: Config = {
  PORT: "3000",
  NODE_ENV: "development",
  TZ: "UTC",
  MONGOURI: "mongodb://localhost:27017/linkedin-scraper",
  ACCESS_TOKEN_SECRET: "access_token_default_secret",
  ACCESS_TOKEN_LIFE: "7d",
  REFRESH_TOKEN_SECRET: "refresh_token_default_secret",
  REFRESH_TOKEN_LIFE: "7d",
  REDIS_HOST: "localhost",
  REDIS_PORT: "6379",
  ENABLE_HEADLESS: "true",
  ENABLE_CRON: "true",
  SMTP_HOST: "smtp.example.com",
  SMTP_PORT: "587",
  SMTP_USER: "user@example.com",
  SMTP_PASS: "password",
  SMTP_FROM: "noreply@example.com",
  ENCRYPTION_KEY: "default_encryption_key_32_characters",
  LOG_LEVEL: "info", // Default log level
  // CHROMEDRIVER_PATH is undefined by default, will use auto-detected path

  // Selenium and LinkedIn Configuration
  SELENIUM_HEADLESS: "true",
  SELENIUM_USER_AGENT: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  SELENIUM_WINDOW_WIDTH: "1920",
  SELENIUM_WINDOW_HEIGHT: "1080",
  SELENIUM_TIMEOUT: "30000",
  LINKEDIN_LOGIN_RETRY_ATTEMPTS: "3",
  LINKEDIN_LOGIN_RETRY_DELAY: "5000",
  LINKEDIN_SEARCH_DELAY_MIN: "3000",
  LINKEDIN_SEARCH_DELAY_MAX: "8000",
  LINKEDIN_SCRAPER_REQUEST_TIMEOUT: "120000",
  LINKEDIN_SESSION_EXPIRY_HOURS: "24",
  LINKEDIN_PROFILES_PER_SEARCH: "25",
  LINKEDIN_MAX_ACCOUNTS_PER_DAY: "5"
};

// Load config values from environment variables or use defaults
export const config: Config = {
  PORT: process.env.PORT || defaultConfig.PORT,
  NODE_ENV: process.env.NODE_ENV || defaultConfig.NODE_ENV,
  TZ: process.env.TZ || defaultConfig.TZ,
  MONGOURI: process.env.MONGOURI || defaultConfig.MONGOURI,
  ACCESS_TOKEN_SECRET:
    process.env.ACCESS_TOKEN_SECRET || defaultConfig.ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_LIFE:
    process.env.ACCESS_TOKEN_LIFE || defaultConfig.ACCESS_TOKEN_LIFE,
  REFRESH_TOKEN_SECRET:
    process.env.REFRESH_TOKEN_SECRET || defaultConfig.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_LIFE:
    process.env.REFRESH_TOKEN_LIFE || defaultConfig.REFRESH_TOKEN_LIFE,
  REDIS_HOST: process.env.REDIS_HOST || defaultConfig.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT || defaultConfig.REDIS_PORT,
  ENABLE_HEADLESS: process.env.ENABLE_HEADLESS || defaultConfig.ENABLE_HEADLESS,
  ENABLE_CRON: process.env.ENABLE_CRON || defaultConfig.ENABLE_CRON,
  SMTP_HOST: process.env.SMTP_HOST || defaultConfig.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || defaultConfig.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER || defaultConfig.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS || defaultConfig.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || defaultConfig.SMTP_FROM,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || defaultConfig.ENCRYPTION_KEY,
  LOG_LEVEL: process.env.LOG_LEVEL || defaultConfig.LOG_LEVEL,
  CHROMEDRIVER_PATH: process.env.CHROMEDRIVER_PATH,

  // Selenium and LinkedIn Configuration
  SELENIUM_HEADLESS: process.env.SELENIUM_HEADLESS || defaultConfig.SELENIUM_HEADLESS,
  SELENIUM_USER_AGENT: process.env.SELENIUM_USER_AGENT || defaultConfig.SELENIUM_USER_AGENT,
  SELENIUM_WINDOW_WIDTH: process.env.SELENIUM_WINDOW_WIDTH || defaultConfig.SELENIUM_WINDOW_WIDTH,
  SELENIUM_WINDOW_HEIGHT: process.env.SELENIUM_WINDOW_HEIGHT || defaultConfig.SELENIUM_WINDOW_HEIGHT,
  SELENIUM_TIMEOUT: process.env.SELENIUM_TIMEOUT || defaultConfig.SELENIUM_TIMEOUT,
  LINKEDIN_LOGIN_RETRY_ATTEMPTS: process.env.LINKEDIN_LOGIN_RETRY_ATTEMPTS || defaultConfig.LINKEDIN_LOGIN_RETRY_ATTEMPTS,
  LINKEDIN_LOGIN_RETRY_DELAY: process.env.LINKEDIN_LOGIN_RETRY_DELAY || defaultConfig.LINKEDIN_LOGIN_RETRY_DELAY,
  LINKEDIN_SEARCH_DELAY_MIN: process.env.LINKEDIN_SEARCH_DELAY_MIN || defaultConfig.LINKEDIN_SEARCH_DELAY_MIN,
  LINKEDIN_SEARCH_DELAY_MAX: process.env.LINKEDIN_SEARCH_DELAY_MAX || defaultConfig.LINKEDIN_SEARCH_DELAY_MAX,
  LINKEDIN_SCRAPER_REQUEST_TIMEOUT: process.env.LINKEDIN_SCRAPER_REQUEST_TIMEOUT || defaultConfig.LINKEDIN_SCRAPER_REQUEST_TIMEOUT,
  LINKEDIN_SESSION_EXPIRY_HOURS: process.env.LINKEDIN_SESSION_EXPIRY_HOURS || defaultConfig.LINKEDIN_SESSION_EXPIRY_HOURS,
  LINKEDIN_PROFILES_PER_SEARCH: process.env.LINKEDIN_PROFILES_PER_SEARCH || defaultConfig.LINKEDIN_PROFILES_PER_SEARCH,
  LINKEDIN_MAX_ACCOUNTS_PER_DAY: process.env.LINKEDIN_MAX_ACCOUNTS_PER_DAY || defaultConfig.LINKEDIN_MAX_ACCOUNTS_PER_DAY
};

// Validate required configuration
const requiredEnvVars: Array<keyof Config> = [
  "MONGOURI",
  "ACCESS_TOKEN_SECRET",
  "ENCRYPTION_KEY",
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !config[envVar] || config[envVar] === defaultConfig[envVar],
);

if (missingEnvVars.length > 0) {
  console.warn(
    `Warning: Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
  console.warn(
    "Using default values for development. DO NOT use default values in production!",
  );
}

// Export configuration
export default config;
export { Config };
