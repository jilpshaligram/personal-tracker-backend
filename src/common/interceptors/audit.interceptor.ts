import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditLogService } from '../../modules/audit-logs/services/audit-log.service';
import { ActionType } from '../../modules/audit-logs/enums/action-type.enum';
import { LoggerService } from '../../infrastructure/logging/logger.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AUDIT_ACTION_KEY } from '../decorators/audit-action.decorator';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger: LoggerService;

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly reflector: Reflector,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.child({ module: 'audit-interceptor' });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    if (this.shouldSkipAudit(context, request)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.captureAuditLog(context, request, response, startTime);
        },
        error: (error: Error) => {
          this.captureAuditLog(context, request, response, startTime, error);
        },
      }),
    );
  }

  private shouldSkipAudit(
    context: ExecutionContext,
    request: AuthenticatedRequest,
  ): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    if (!request.user) {
      return true;
    }

    const url = request.url.toLowerCase();

    if (url.includes('/audit-logs')) {
      return true;
    }

    return false;
  }

  private captureAuditLog(
    context: ExecutionContext,
    request: AuthenticatedRequest,
    response: Response,
    startTime: number,
    error?: Error,
  ): void {
    try {
      const userId = request.user?.sub;
      if (!userId) {
        return;
      }

      const requestUrl = request.url;
      const requestMethod = request.method;

      const match = requestUrl.match(/^\/api\/v\d+\/([^/?]+)/);
      const module = match ? match[1] : 'unknown';

      const ipAddress = this.extractIpAddress(request);
      const userAgent = request.headers['user-agent'] || 'Unknown';
      const action = this.determineAction(context, requestMethod);
      const durationMs = Date.now() - startTime;

      const metadata = {
        durationMs,
        correlationId: (request.headers['x-correlation-id'] as string) || null,
        sessionId: request.user?.sessionId || null,
        error: error ? { message: error.message, name: error.name } : null,
      };

      const statusCode =
        (error as Error & { status?: number })?.status || response.statusCode;

      const auditData = {
        userId,
        module,
        action,
        ipAddress,
        userAgent,
        requestMethod,
        requestUrl,
        statusCode,
        changes: null,
        metadata,
      };

      this.logger.info('Audit log captured', {
        userId: auditData.userId,
        module: auditData.module,
        action: auditData.action,
        requestMethod: auditData.requestMethod,
        requestUrl: auditData.requestUrl,
        statusCode: auditData.statusCode,
        ipAddress: auditData.ipAddress,
        durationMs: auditData.metadata.durationMs,
      });

      void this.auditLogService.createLog(auditData).catch((err: Error) => {
        this.logger.error('Failed to create audit log', {
          error: err.message,
          context: {
            userId: auditData.userId,
            requestUrl: auditData.requestUrl,
            requestMethod: auditData.requestMethod,
          },
        });
      });
    } catch (err) {
      const error = err as Error;
      this.logger.error('Failed to capture audit log', {
        error: error.message,
        stack: error.stack,
        requestUrl: request.url,
      });
    }
  }

  private extractIpAddress(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ips = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor;
      return ips.split(',')[0].trim();
    }

    const xRealIp = request.headers['x-real-ip'];
    if (xRealIp) {
      return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
    }

    const socketAddress = request.socket?.remoteAddress;
    if (socketAddress) {
      return socketAddress.replace(/^::ffff:/, '');
    }

    return 'unknown';
  }

  private determineAction(
    context: ExecutionContext,
    method: string,
  ): ActionType {
    const customAction = this.reflector.getAllAndOverride<ActionType>(
      AUDIT_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (customAction) {
      return customAction;
    }

    switch (method.toUpperCase()) {
      case 'POST':
        return ActionType.CREATE;
      case 'PUT':
      case 'PATCH':
        return ActionType.UPDATE;
      case 'DELETE':
        return ActionType.DELETE;
      case 'GET':
      default:
        return ActionType.VIEW;
    }
  }
}
