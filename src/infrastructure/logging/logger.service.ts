import { Injectable } from '@nestjs/common';
import pino, { Logger } from 'pino';

/**
 * Pino logger service for structured JSON logging
 *
 * Features:
 * - Structured JSON output with correlation IDs
 * - Environment-specific configuration (pretty printing for development)
 * - All standard log levels (debug, info, warn, error)
 * - Compatible with NestJS request context
 */
@Injectable()
export class LoggerService {
  private logger: Logger;

  constructor() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      messageKey: 'message',
      nestedKey: 'data',
    });
  }

  /**
   * Log debug message
   * @param message - Log message
   * @param data - Additional context data
   */
  debug(message: string, data?: Record<string, any>): void {
    this.logger.debug(data || {}, message);
  }

  /**
   * Log informational message
   * @param message - Log message
   * @param data - Additional context data
   */
  info(message: string, data?: Record<string, any>): void {
    this.logger.info(data || {}, message);
  }

  /**
   * Log warning message
   * @param message - Log message
   * @param data - Additional context data
   */
  warn(message: string, data?: Record<string, any>): void {
    this.logger.warn(data || {}, message);
  }

  /**
   * Log error message
   * @param message - Log message
   * @param error - Error object or additional context data
   */
  error(message: string, error?: Error | Record<string, any>): void {
    if (error instanceof Error) {
      this.logger.error(
        {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        },
        message,
      );
    } else {
      this.logger.error(error || {}, message);
    }
  }

  /**
   * Create a child logger with additional context
   * @param context - Context data to include in all log messages
   * @returns Child logger instance
   */
  child(context: Record<string, unknown>): LoggerService {
    const childLogger = this.logger.child(context);
    const childService = new LoggerService();
    childService.logger = childLogger;
    return childService;
  }

  /**
   * Get the underlying Pino logger instance
   * @returns Pino Logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }
}
