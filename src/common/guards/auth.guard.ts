import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { SecurityService } from '../../infrastructure/security/security.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { User } from '../../modules/users/schemas/user.schema';
import { UserStatus } from '../../modules/users/enums/user-status.enum';
import { UserSession } from '../../modules/user-session/schemas/user-session.schema';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly securityService: SecurityService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const authHeader = request.headers.authorization;
    const cookies = request.cookies as Record<string, string> | undefined;

    let token: string | undefined;

    if (authHeader) {
      token = authHeader.replace(/^(Bearer\s+)+/i, '').trim();
      if (!token) {
        token = undefined;
      }
    }

    if (!token && cookies) {
      token = cookies.access_token ?? cookies.accessToken;
    }

    if (!token && request.headers.cookie) {
      const match = request.headers.cookie.match(
        /(?:access_token|accessToken)=([^;]+)/,
      );
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      throw new UnauthorizedException({
        success: false,
        message: 'Access token is required',
        errors: [],
      });
    }

    const payload = await this.securityService
      .verifyAccessToken(token)
      .catch(() => {
        this.clearAuthCookies(response);
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid or expired access token',
          errors: [],
        });
      });

    if (payload.tokenType !== 'access') {
      this.clearAuthCookies(response);
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid token type',
        errors: [],
      });
    }

    // 1. Verify user existence and active status in DB
    const user = await User.findByPk(payload.sub, {
      attributes: ['id', 'status', 'deletedAt'],
    });

    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt) {
      this.clearAuthCookies(response);
      throw new UnauthorizedException({
        success: false,
        message: 'User account no longer exists or is inactive',
        errors: [],
      });
    }

    // 2. Verify active session in DB (if sessionId is present in payload)
    if (payload.sessionId) {
      const session = await UserSession.findOne({
        where: { id: payload.sessionId, isActive: true },
        attributes: ['id', 'isActive', 'expiresAt'],
      });

      if (!session || (session.expiresAt && session.expiresAt < new Date())) {
        this.clearAuthCookies(response);
        throw new UnauthorizedException({
          success: false,
          message: 'Session has been invalidated or expired',
          errors: [],
        });
      }
    }

    (request as Request & { user: unknown }).user = payload;
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
