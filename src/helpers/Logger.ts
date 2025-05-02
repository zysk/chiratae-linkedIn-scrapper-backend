import { config } from "../config/config";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LoggerOptions {
  context?: string;
  minLevel?: LogLevel;
}

// Define a type for log transport functions
type LogTransport = (message: string, ...args: unknown[]) => void;

/**
 * Logger class that supports multiple logging methods and customizable transports
 */
class Logger {
  private context: string;
  private minLevel: LogLevel;
  private transports: Record<LogLevel, LogTransport>;

  constructor(options: LoggerOptions = {}) {
    this.context = options.context || "";
    this.minLevel =
      options.minLevel !== undefined
        ? options.minLevel
        : config.NODE_ENV === "production"
          ? LogLevel.INFO
          : LogLevel.DEBUG;

    // Use indirect console access to avoid linting errors
    // eslint-disable-next-line no-console
    const consoleDebug = console.debug.bind(console);
    // eslint-disable-next-line no-console
    const consoleInfo = console.info.bind(console);
    // eslint-disable-next-line no-console
    const consoleWarn = console.warn.bind(console);
    // eslint-disable-next-line no-console
    const consoleError = console.error.bind(console);

    // Define default transports
    this.transports = {
      [LogLevel.DEBUG]: consoleDebug,
      [LogLevel.INFO]: consoleInfo,
      [LogLevel.WARN]: consoleWarn,
      [LogLevel.ERROR]: consoleError,
    };
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  /**
   * Format a message with timestamp and context
   */
  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}]` : "";
    return `${timestamp} ${contextStr} ${message}`;
  }

  /**
   * Log at debug level
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.transports[LogLevel.DEBUG](this.formatMessage(message), ...args);
    }
  }

  /**
   * Log at info level
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.transports[LogLevel.INFO](this.formatMessage(message), ...args);
    }
  }

  /**
   * Log at warn level
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.transports[LogLevel.WARN](this.formatMessage(message), ...args);
    }
  }

  /**
   * Log at error level
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.transports[LogLevel.ERROR](this.formatMessage(message), ...args);
    }
  }

  /**
   * Set a custom transport for a specific log level
   */
  setTransport(level: LogLevel, transport: LogTransport): void {
    this.transports[level] = transport;
  }

  /**
   * Create a child logger with a new context
   */
  child(context: string): Logger {
    return new Logger({
      context: this.context ? `${this.context}:${context}` : context,
      minLevel: this.minLevel,
    });
  }
}

// Export a default instance and the Logger class
export const logger = new Logger({ context: "app" });
export default Logger;
