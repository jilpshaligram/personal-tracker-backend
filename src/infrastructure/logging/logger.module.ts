import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Global logging module that provides structured logging with Pino
 *
 * This module is global to make LoggerService available throughout the application
 * without needing to import it in every module.
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
