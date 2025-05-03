import winston from "winston";
import { config } from "../config/config";

/**
 * A centralized logging service that provides consistent logging throughout the application
 */
export class Logger {
  private logger: winston.Logger;
  private context: string;

  /**
   * Creates a new Logger instance
   * @param context The context (usually the class/component name) for this logger
   */
  constructor(context: string) {
    this.context = context;

    // Define log format
    const logFormat = winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level.toUpperCase()}] [${this.context}] - ${message}`;
    });

    // Create logger instance
    this.logger = winston.createLogger({
      level: config.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat,
      ),
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            logFormat,
          ),
        }),
        // File transport for errors
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
      ],
    });

    // Handle the case where logs directory doesn't exist
    this.logger.exceptions.handle(
      new winston.transports.File({ filename: "logs/exceptions.log" }),
    );
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param meta Optional metadata to include
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message + (meta ? ` ${JSON.stringify(meta)}` : ""));
  }

  /**
   * Log an informational message
   * @param message The message to log
   * @param meta Optional metadata to include
   */
  info(message: string, meta?: any): void {
    this.logger.info(message + (meta ? ` ${JSON.stringify(meta)}` : ""));
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param meta Optional metadata to include
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message + (meta ? ` ${JSON.stringify(meta)}` : ""));
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param error Optional error object or metadata to include
   */
  error(message: string, error?: any): void {
    if (error instanceof Error) {
      this.logger.error(`${message}: ${error.message}`, {
        stack: error.stack,
        name: error.name,
      });
    } else {
      this.logger.error(message + (error ? ` ${JSON.stringify(error)}` : ""));
    }
  }

  /**
   * Create a child logger with additional context
   * @param context Additional context to append to the current context
   */
  createChildLogger(context: string): Logger {
    return new Logger(`${this.context}.${context}`);
  }
}
