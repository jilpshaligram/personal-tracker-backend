import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '@/modules/auth/auth.service';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { successResponse } from '@/common/responses/api-response.helper';
import {
  AuthGuard,
  OnboardingGuard,
  AccessTokenGuard,
} from '@/common/guards/auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { AuditAction } from '@/common/decorators/audit-action.decorator';
import { ActionType } from '@/modules/audit-logs/enums/action-type.enum';
import type { AuthenticatedRequest } from '@/common/interfaces/authenticated-request.interface';

import { signupSchema, SignupDto } from '@/modules/auth/dto/signup.dto';
import { loginSchema, LoginDto } from '@/modules/auth/dto/login.dto';
import {
  verifyEmailOtpSchema,
  VerifyEmailOtpDto,
} from '@/modules/auth/dto/verify-email-otp.dto';
import {
  createPinSchema,
  CreatePinDto,
} from '@/modules/auth/dto/create-pin.dto';
import {
  verifyPinSchema,
  VerifyPinDto,
} from '@/modules/auth/dto/verify-pin.dto';
import {
  forgotPasswordSchema,
  ForgotPasswordDto,
} from '@/modules/auth/dto/forgot-password.dto';
import {
  verifyPasswordOtpSchema,
  VerifyPasswordOtpDto,
} from '@/modules/auth/dto/verify-password-otp.dto';
import {
  resetPasswordSchema,
  ResetPasswordDto,
} from '@/modules/auth/dto/reset-password.dto';
import {
  forgotPinSchema,
  ForgotPinDto,
} from '@/modules/auth/dto/forgot-pin.dto';
import {
  verifyPinOtpSchema,
  VerifyPinOtpDto,
} from '@/modules/auth/dto/verify-pin-otp.dto';
import { resetPinSchema, ResetPinDto } from '@/modules/auth/dto/reset-pin.dto';
import {
  resendEmailOtpSchema,
  ResendEmailOtpDto,
} from '@/modules/auth/dto/resend-otp.dto';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const ONBOARDING_TOKEN_COOKIE = 'onboardingToken';
const ACCESS_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const ONBOARDING_TOKEN_MAX_AGE_MS = 5 * 60 * 1000;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'User Signup',
    description: 'Registers a new user and sends an email verification OTP.',
  })
  @ApiResponse({ status: 201, description: 'Registration successful.' })
  @ApiResponse({
    status: 400,
    description: 'Validation or duplicate email error.',
  })
  @UsePipes(new ZodValidationPipe(signupSchema))
  async signup(@Body() dto: SignupDto) {
    const data = await this.authService.signup(dto);
    return successResponse('Registration successful. Verify your email.', data);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Email OTP',
    description: 'Verifies the OTP sent to user email.',
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  @UsePipes(new ZodValidationPipe(verifyEmailOtpSchema))
  async verifyEmail(
    @Body() dto: VerifyEmailOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.verifyEmail(dto);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };

    res.cookie(ONBOARDING_TOKEN_COOKIE, data.onboardingToken, {
      ...cookieOptions,
      maxAge: ONBOARDING_TOKEN_MAX_AGE_MS,
    });

    return successResponse('Email verified.', data);
  }

  @Post('resend-email-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend Email OTP',
    description: 'Resends a fresh OTP code to user email.',
  })
  @ApiResponse({ status: 200, description: 'OTP resent successfully.' })
  @UsePipes(new ZodValidationPipe(resendEmailOtpSchema))
  async resendEmailOtp(@Body() dto: ResendEmailOtpDto) {
    await this.authService.resendEmailOtp(dto);
    return successResponse('OTP resent successfully.');
  }

  @Post('create-pin')
  @Public()
  @UseGuards(OnboardingGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('onboarding-token')
  @ApiOperation({
    summary: 'Create Security PIN',
    description:
      'Creates a 4-digit security PIN for user. Requires a valid onboarding token.',
  })
  @ApiResponse({ status: 200, description: 'PIN created successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid onboarding token required.',
  })
  @UsePipes(new ZodValidationPipe(createPinSchema))
  async createPin(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePinDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.createPin(req.user.sub, dto);
    res.clearCookie(ONBOARDING_TOKEN_COOKIE);
    res.clearCookie('onboarding_token');
    return successResponse(data.message);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with Email & Password',
    description: 'Validates credentials and prompts for PIN verification.',
  })
  @ApiResponse({
    status: 200,
    description: 'Credentials verified; PIN verification required.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(dto);

    if (data.onboardingToken) {
      res.cookie(ONBOARDING_TOKEN_COOKIE, data.onboardingToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: ONBOARDING_TOKEN_MAX_AGE_MS,
      });
    }

    const message = data.message ?? 'PIN verification required.';
    return successResponse(message, { nextStep: data.nextStep });
  }

  @Post('verify-pin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify PIN & Issue Access/Refresh Tokens',
    description:
      'Verifies PIN and sets refresh token cookie, returning JWT access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, access token issued.',
  })
  @ApiResponse({ status: 401, description: 'Invalid PIN.' })
  @UsePipes(new ZodValidationPipe(verifyPinSchema))
  async verifyPin(
    @Body() dto: VerifyPinDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    };
    const { accessToken, refreshToken } =
      await this.authService.verifyPinAndIssueTokens(dto, deviceInfo);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };

    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return successResponse('Login successful.', { accessToken });
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh Access Token',
    description: 'Uses refresh_token cookie to issue a new access token.',
  })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing refresh token.',
  })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const cookieToken =
      cookies?.[REFRESH_TOKEN_COOKIE] ??
      cookies?.['refreshToken'] ??
      cookies?.['refresh_token'];

    if (!cookieToken) {
      this.clearAuthCookies(res);
      return { success: false, message: 'Refresh token missing', errors: [] };
    }

    try {
      const { accessToken, newRefreshToken } =
        await this.authService.refreshToken(cookieToken);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
      };

      res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
        ...cookieOptions,
        maxAge: ACCESS_TOKEN_MAX_AGE_MS,
      });

      res.cookie(REFRESH_TOKEN_COOKIE, newRefreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_TOKEN_MAX_AGE_MS,
      });

      return successResponse('Token refreshed.', { accessToken });
    } catch (err) {
      this.clearAuthCookies(res);
      throw err;
    }
  }

  @Post('logout')
  @AuditAction(ActionType.LOGOUT)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Logout Current Session',
    description: 'Invalidates current session and clears refresh token cookie.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.user.sessionId) {
      await this.authService.logout(req.user.sessionId);
    }
    this.clearAuthCookies(res);
    return successResponse('Logged out successfully.');
  }

  @Post('logout-all')
  @AuditAction(ActionType.LOGOUT)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Logout All Sessions',
    description: 'Revokes all active sessions for the user across devices.',
  })
  @ApiResponse({ status: 200, description: 'Logged out from all devices.' })
  async logoutAll(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(req.user.sub);
    this.clearAuthCookies(res);
    return successResponse('Logged out from all devices.');
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot Password Request',
    description: 'Triggers password reset OTP email.',
  })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent.' })
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return successResponse('If the email exists, an OTP has been sent.');
  }

  @Post('verify-password-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Password Reset OTP',
    description: 'Validates OTP for resetting password.',
  })
  @ApiResponse({ status: 200, description: 'OTP verified.' })
  @UsePipes(new ZodValidationPipe(verifyPasswordOtpSchema))
  async verifyPasswordOtp(
    @Body() dto: VerifyPasswordOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.verifyPasswordOtp(dto);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };

    res.cookie(ONBOARDING_TOKEN_COOKIE, data.onboardingToken, {
      ...cookieOptions,
      maxAge: ONBOARDING_TOKEN_MAX_AGE_MS,
    });

    return successResponse('OTP verified. You may reset your password.', data);
  }

  @Post('reset-password')
  @Public()
  @UseGuards(OnboardingGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('onboarding-token')
  @ApiOperation({
    summary: 'Reset Password',
    description:
      'Sets a new password for user. Requires a valid onboarding token.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid onboarding token required.',
  })
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.resetPassword(req.user.sub, dto);
    res.clearCookie(ONBOARDING_TOKEN_COOKIE);
    res.clearCookie('onboarding_token');
    return successResponse('Password reset successfully.');
  }

  @Post('forgot-pin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Forgot PIN Request',
    description: 'Triggers PIN reset OTP email.',
  })
  @ApiResponse({ status: 200, description: 'PIN reset OTP sent.' })
  @UsePipes(new ZodValidationPipe(forgotPinSchema))
  async forgotPin(@Body() dto: ForgotPinDto) {
    await this.authService.forgotPin(dto);
    return successResponse('If the email exists, an OTP has been sent.');
  }

  @Post('verify-pin-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify PIN Reset OTP',
    description: 'Validates OTP for resetting PIN.',
  })
  @ApiResponse({ status: 200, description: 'OTP verified.' })
  @UsePipes(new ZodValidationPipe(verifyPinOtpSchema))
  async verifyPinOtp(
    @Body() dto: VerifyPinOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.verifyPinOtp(dto);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    };

    res.cookie(ONBOARDING_TOKEN_COOKIE, data.onboardingToken, {
      ...cookieOptions,
      maxAge: ONBOARDING_TOKEN_MAX_AGE_MS,
    });

    return successResponse('OTP verified. You may reset your PIN.', data);
  }

  @Post('reset-pin')
  @Public()
  @UseGuards(OnboardingGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('onboarding-token')
  @ApiOperation({
    summary: 'Reset Security PIN',
    description:
      'Sets a new security PIN for user. Requires a valid onboarding token.',
  })
  @ApiResponse({ status: 200, description: 'PIN reset successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid onboarding token required.',
  })
  @UsePipes(new ZodValidationPipe(resetPinSchema))
  async resetPin(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ResetPinDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.resetPin(req.user.sub, dto);
    res.clearCookie(ONBOARDING_TOKEN_COOKIE);
    res.clearCookie('onboarding_token');
    return successResponse('PIN reset successfully.');
  }

  @Get('verify-token')
  @Public()
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Verify access token and return user details' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired access token',
  })
  verifyToken(@Req() req: AuthenticatedRequest) {
    return successResponse('Token is valid.', {
      user: req.user,
    });
  }

  private clearAuthCookies(res: Response): void {
    if (!res || typeof res.clearCookie !== 'function') {
      return;
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    const cookieNames = [
      ACCESS_TOKEN_COOKIE,
      'accessToken',
      'token',
      REFRESH_TOKEN_COOKIE,
      'refreshToken',
      ONBOARDING_TOKEN_COOKIE,
      'onboarding_token',
    ];

    for (const name of cookieNames) {
      res.clearCookie(name, cookieOptions);
      res.clearCookie(name);
    }
  }
}
