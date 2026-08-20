import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '10m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '30d',
  onboardingTokenExpiry: process.env.ONBOARDING_TOKEN_EXPIRY || '5m',
}));
