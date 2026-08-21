import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { SecurityService } from '@/infrastructure/security/security.service';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { AuthenticatedRequest } from '@/common/interfaces/authenticated-request.interface';
import { User } from '@/modules/users/user.schema';
import { UserStatus } from '@/modules/users/enums/user-status.enum';
import { UserSession } from '@/modules/user-session/user-session.schema';
import type { IJwtPayload } from '@/common/interfaces/authenticated-request.interface';

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
      token = cookies.access_token ?? cookies.accessToken ?? cookies.token;
    }

    if (!token && request.headers.cookie) {
      const match = request.headers.cookie.match(
        /(?:access_token|accessToken|token)=([^;]+)/,
      );
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      const customHeader =
        request.headers['x-access-token'] ?? request.headers['access_token'];
      if (typeof customHeader === 'string') {
        token = customHeader.trim();
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

@Injectable()
export class AccessTokenGuard extends AuthGuard {}

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(private readonly securityService: SecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    const cookies = request.cookies as Record<string, string> | undefined;

    let token: string | undefined;

    if (authHeader) {
      token = authHeader.replace(/^(Bearer\s+)+/i, '').trim();
      if (!token) {
        token = undefined;
      }
    }

    if (!token && cookies) {
      token =
        cookies['onboardingToken'] ??
        cookies['onboarding_token'] ??
        cookies['onboardToken'];
    }

    if (!token && request.headers.cookie) {
      const match = request.headers.cookie.match(
        /(?:onboardingToken|onboarding_token|onboardToken)=([^;]+)/,
      );
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      const customHeader =
        request.headers['x-onboarding-token'] ??
        request.headers['x-onboard-token'];
      if (typeof customHeader === 'string') {
        token = customHeader.trim();
      }
    }

    if (!token) {
      throw new UnauthorizedException({
        success: false,
        message: 'Onboarding token is required',
        errors: [],
      });
    }

    let payload: IJwtPayload;
    try {
      payload = await this.securityService.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid or expired onboarding token',
        errors: [],
      });
    }

    if (payload.tokenType !== 'onboarding') {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid token type for this action',
        errors: [],
      });
    }

    (request as Request & { user: unknown }).user = payload;
    return true;
  }
}
