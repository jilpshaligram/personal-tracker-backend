import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SecurityService } from '../../infrastructure/security/security.service';
import type { IJwtPayload } from '../interfaces/authenticated-request.interface';

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
