import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  console.error('Error creating logs directory:', err);
}

// Custom format with ISO timestamp and colorization
const customFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...rest } = info;
    const restString = Object.keys(rest).length ? JSON.stringify(rest, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${restString}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'linkedin-scraper' },
  transports: [
    // Write to all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // Write all errors to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // Create a special file for LinkedIn debugging
    new winston.transports.File({
      filename: path.join(logsDir, 'linkedin-debug.log'),
      level: 'debug',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    })
  ]
});

// Add a debug method specifically for LinkedIn operations
const linkedInDebug = (message: string, meta?: any) => {
  logger.debug(`[LinkedIn] ${message}`, meta);
};

// Export the logger
export default {
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  debug: logger.debug.bind(logger),
  linkedInDebug
};
