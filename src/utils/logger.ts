import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Determine log level based on environment
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Create format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Create format for file output (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  ),
  winston.format.json()
);

// Define log directory and file paths
const logDir = path.join(process.cwd(), 'logs');
const errorLogPath = path.join(logDir, 'error.log');
const combinedLogPath = path.join(logDir, 'combined.log');

// Create transports array
const logTransports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level,
  }),
];

// Add file transports in production environment
if (process.env.NODE_ENV === 'production') {
  logTransports.push(
    // Write all errors to error.log
    new winston.transports.File({
      filename: errorLogPath,
      level: 'error',
      format: fileFormat,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: combinedLogPath,
      format: fileFormat,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level,
  levels,
  transports: logTransports,
});

export default logger;
