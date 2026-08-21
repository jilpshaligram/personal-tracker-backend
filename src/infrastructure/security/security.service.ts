import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';
import { IJwtPayload } from '@/modules/auth/interfaces/jwt-payload.interface';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class SecurityService {
  constructor(private readonly configService: ConfigService) {}

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  async generateAccessToken(
    payload: Omit<IJwtPayload, 'tokenType' | 'iat' | 'exp'>,
  ): Promise<string> {
    const secret = this.configService.get<string>('auth.accessSecret') ?? '';
    const expiry =
      this.configService.get<string>('auth.accessTokenExpiry') ?? '10m';
    const key = new TextEncoder().encode(secret);

    return new SignJWT({ ...payload, tokenType: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(key);
  }

  async generateRefreshToken(payload: {
    sub: string;
    sessionId: string;
  }): Promise<string> {
    const secret = this.configService.get<string>('auth.refreshSecret') ?? '';
    const expiry =
      this.configService.get<string>('auth.refreshTokenExpiry') ?? '30d';
    const key = new TextEncoder().encode(secret);

    return new SignJWT({ ...payload, tokenType: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(key);
  }

  async generateOnboardingToken(payload: {
    sub: string;
    email?: string;
  }): Promise<string> {
    const secret = this.configService.get<string>('auth.accessSecret') ?? '';
    const expiry =
      this.configService.get<string>('auth.onboardingTokenExpiry') ?? '5m';
    const key = new TextEncoder().encode(secret);

    return new SignJWT({ ...payload, tokenType: 'onboarding' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(key);
  }

  async verifyAccessToken(token: string): Promise<IJwtPayload> {
    const secret = this.configService.get<string>('auth.accessSecret') ?? '';
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as IJwtPayload;
  }

  async verifyRefreshToken(token: string): Promise<IJwtPayload> {
    const secret = this.configService.get<string>('auth.refreshSecret') ?? '';
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return payload as unknown as IJwtPayload;
  }

  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
