import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SecurityService } from '../../infrastructure/security/security.service';

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(private readonly securityService: SecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        success: false,
        message: 'Onboarding token is required',
        errors: [],
      });
    }

    const token = authHeader.split(' ')[1];

    const payload = await this.securityService
      .verifyAccessToken(token)
      .catch(() => {
        throw new UnauthorizedException({
          success: false,
          message: 'Invalid or expired onboarding token',
          errors: [],
        });
      });

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
