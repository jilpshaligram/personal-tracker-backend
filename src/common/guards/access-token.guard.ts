import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SecurityService } from '../../infrastructure/security/security.service';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly securityService: SecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const cookies = request.cookies as Record<string, string> | undefined;
    const authHeader = request.headers.authorization;

    let accessToken: string | undefined;

    // 1. Check Authorization header (Bearer <token> or raw token)
    if (authHeader) {
      accessToken = authHeader.replace(/^(Bearer\s+)+/i, '').trim();
      if (!accessToken) {
        accessToken = undefined;
      }
    }

    // 2. Check cookies
    if (!accessToken && cookies) {
      accessToken =
        cookies['accessToken'] ?? cookies['access_token'] ?? cookies['token'];
    }

    // 3. Fallback: Parse raw cookie header if cookies object is not parsed
    if (!accessToken && request.headers.cookie) {
      const match = request.headers.cookie.match(
        /(?:accessToken|access_token|token)=([^;]+)/,
      );
      if (match) {
        accessToken = decodeURIComponent(match[1]);
      }
    }

    // 4. Fallback: check custom headers
    if (!accessToken) {
      const customHeader =
        request.headers['x-access-token'] ?? request.headers['access_token'];
      if (typeof customHeader === 'string') {
        accessToken = customHeader.trim();
      }
    }

    if (!accessToken) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const payload = await this.securityService.verifyAccessToken(accessToken);

      (request as Request & { user: unknown }).user = {
        id: payload.sub,
        sub: payload.sub,
        role: payload.role,
        sessionId: payload.sessionId,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
