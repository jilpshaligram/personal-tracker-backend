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
import { LoggerService } from '../../infrastructure/logging/logger.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { extractIpAddress } from '../helpers/ip.helper';
import { extractModuleName } from '../helpers/module.helper';
import { extractEntityInfo } from '../helpers/entity.helper';
import { determineActionType } from '../helpers/action.helper';
import { IJwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

interface AuthenticatedRequest extends Request {
  user?: IJwtPayload;
}

/**
 * Audit Interceptor
 *
 * Automatically creates audit logs for all authenticated API requests.
 * Skips logging for health checks, audit logs endpoints, and public endpoints.
 *
 * Key features:
 * - Non-blocking, asynchronous logging
 * - Comprehensive request context extraction
 * - Graceful error handling (never disrupts requests)
 * - IP address extraction with proxy support
 * - Automatic action type determination
 * - Entity information extraction
 */
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

    // Skip audit logging if:
    // 1. Endpoint is marked as public
    // 2. Request is to health check endpoints
    // 3. Request is to audit logs endpoints (to prevent recursion)
    if (this.shouldSkipAudit(context, request)) {
      return next.handle();
    }

    // Extract request start time for duration calculation
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Capture after response is successful
          this.captureAuditLog(context, request, response, startTime);
        },
        error: (error: Error) => {
          // Capture even on errors (for security monitoring)
          this.captureAuditLog(context, request, response, startTime, error);
        },
      }),
    );
  }

  /**
   * Determine if audit logging should be skipped for this request
   */
  private shouldSkipAudit(
    context: ExecutionContext,
    request: AuthenticatedRequest,
  ): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip public endpoints
    if (isPublic) {
      return true;
    }

    // Skip unauthenticated requests
    if (!request.user) {
      return true;
    }

    const url = request.url.toLowerCase();

    // Skip health check endpoints
    if (url.includes('/health') || url.includes('/ping')) {
      return true;
    }

    // Skip audit logs endpoints to prevent recursion
    if (url.includes('/audit-logs')) {
      return true;
    }

    return false;
  }

  /**
   * Capture audit log asynchronously without blocking the response
   */
  private captureAuditLog(
    context: ExecutionContext,
    request: AuthenticatedRequest,
    response: Response,
    startTime: number,
    error?: Error,
  ): void {
    try {
      // Extract all necessary data
      const auditData = this.extractAuditData(
        context,
        request,
        response,
        startTime,
        error,
      );

      // Log to console/terminal for real-time visibility
      this.logger.info('Audit log captured', {
        userId: auditData.userId,
        module: auditData.module,
        action: auditData.action,
        entityType: auditData.entityType,
        entityId: auditData.entityId,
        requestMethod: auditData.requestMethod,
        requestUrl: auditData.requestUrl,
        statusCode: auditData.statusCode,
        ipAddress: auditData.ipAddress,
        durationMs: auditData.metadata.durationMs,
      });

      // Create audit log asynchronously (fire-and-forget)
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
      // Never let audit logging errors disrupt the original request
      const error = err as Error;
      this.logger.error('Failed to capture audit log', {
        error: error.message,
        stack: error.stack,
        requestUrl: request.url,
      });
    }
  }

  /**
   * Extract all audit data from request and response
   */
  private extractAuditData(
    context: ExecutionContext,
    request: AuthenticatedRequest,
    response: Response,
    startTime: number,
    error?: Error,
  ) {
    const userId = request.user?.sub;

    // Skip if no userId (shouldn't happen as we check in shouldSkipAudit)
    if (!userId) {
      throw new Error('Cannot create audit log without userId');
    }

    const requestUrl = request.url;
    const requestMethod = request.method;

    // Extract module name from URL
    const module = extractModuleName(requestUrl);

    // Extract entity information
    const { entityType, entityId } = extractEntityInfo(requestUrl);

    // Extract IP address and user agent
    const ipAddress = extractIpAddress(request);
    const userAgent = request.headers['user-agent'] || 'Unknown';

    // Determine action type
    const action = determineActionType(requestMethod, requestUrl);

    // Calculate processing duration
    const durationMs = Date.now() - startTime;

    // Build metadata
    const metadata = {
      durationMs,
      correlationId: (request.headers['x-correlation-id'] as string) || null,
      sessionId: request.user?.sessionId || null,
      error: error ? { message: error.message, name: error.name } : null,
    };

    // Get status code (error status or response status)
    const statusCode =
      (error as Error & { status?: number })?.status || response.statusCode;

    return {
      userId,
      module,
      action,
      entityId: entityId || null,
      entityType: entityType || null,
      ipAddress,
      userAgent,
      requestMethod,
      requestUrl,
      statusCode,
      changes: null, // Optional enhancement: capture changes for UPDATE actions
      metadata,
    };
  }
}
