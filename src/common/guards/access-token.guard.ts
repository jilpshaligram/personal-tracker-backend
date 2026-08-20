import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SecurityService } from '../../infrastructure/security/security.service';
import { User } from '../../modules/users/schemas/user.schema';
import { UserStatus } from '../../modules/users/enums/user-status.enum';
import { UserSession } from '../../modules/user-session/schemas/user-session.schema';
import type { IJwtPayload } from '../interfaces/authenticated-request.interface';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly securityService: SecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const cookies = request.cookies as Record<string, string> | undefined;
    const authHeader = request.headers.authorization;

    let accessToken: string | undefined;

    if (authHeader) {
      accessToken = authHeader.replace(/^(Bearer\s+)+/i, '').trim();
      if (!accessToken) {
        accessToken = undefined;
      }
    }

    if (!accessToken && cookies) {
      accessToken =
        cookies['accessToken'] ?? cookies['access_token'] ?? cookies['token'];
    }

    if (!accessToken && request.headers.cookie) {
      const match = request.headers.cookie.match(
        /(?:accessToken|access_token|token)=([^;]+)/,
      );
      if (match) {
        accessToken = decodeURIComponent(match[1]);
      }
    }

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

    let payload: IJwtPayload;
    try {
      payload = await this.securityService.verifyAccessToken(accessToken);
    } catch {
      this.clearAuthCookies(response);
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (payload.tokenType !== 'access') {
      this.clearAuthCookies(response);
      throw new UnauthorizedException('Invalid token type');
    }

    // 1. Verify user existence and active status in DB
    const user = await User.findByPk(payload.sub, {
      attributes: ['id', 'status', 'deletedAt'],
    });

    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt) {
      this.clearAuthCookies(response);
      throw new UnauthorizedException(
        'User account no longer exists or is inactive',
      );
    }

    // 2. Verify active session in DB (if sessionId is present in payload)
    if (payload.sessionId) {
      const session = await UserSession.findOne({
        where: { id: payload.sessionId, isActive: true },
        attributes: ['id', 'isActive', 'expiresAt'],
      });

      if (!session || (session.expiresAt && session.expiresAt < new Date())) {
        this.clearAuthCookies(response);
        throw new UnauthorizedException(
          'Session has been invalidated or expired',
        );
      }
    }

    (request as Request & { user: unknown }).user = {
      id: payload.sub,
      sub: payload.sub,
      role: payload.role,
      sessionId: payload.sessionId,
    };

    return true;
  }

  private clearAuthCookies(response: Response): void {
    if (!response || typeof response.clearCookie !== 'function') {
      return;
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    const cookieNames = [
      'access_token',
      'accessToken',
      'token',
      'refresh_token',
      'refreshToken',
      'onboardingToken',
      'onboarding_token',
    ];

    for (const name of cookieNames) {
      response.clearCookie(name, cookieOptions);
      response.clearCookie(name);
    }
  }
}
