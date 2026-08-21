import { Injectable } from '@nestjs/common';
import pino, { Logger } from 'pino';

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

  debug(message: string, data?: Record<string, any>): void {
    this.logger.debug(data || {}, message);
  }

  info(message: string, data?: Record<string, any>): void {
    this.logger.info(data || {}, message);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.logger.warn(data || {}, message);
  }

  error(message: string, error?: Error | Record<string, any>): void {
    if (error instanceof Error) {
      this.logger.error(
        {
          error: {
            name: error.name,
            message: error.message,
          },
        },
        message,
      );
    } else {
      this.logger.error(error || {}, message);
    }
  }

  child(context: Record<string, unknown>): LoggerService {
    const childLogger = this.logger.child(context);
    const childService = new LoggerService();
    childService.logger = childLogger;
    return childService;
  }

  getLogger(): Logger {
    return this.logger;
  }
}
