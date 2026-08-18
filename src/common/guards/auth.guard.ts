import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SecurityService } from '../../infrastructure/security/security.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

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
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid or expired access token',
          errors: [],
        });
      });

    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid token type',
        errors: [],
      });
    }

    (request as Request & { user: unknown }).user = payload;
    return true;
  }
}
