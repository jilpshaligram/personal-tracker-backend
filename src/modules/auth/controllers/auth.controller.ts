import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import type { IJwtPayload } from '../interfaces/jwt-payload.interface';

import { signupSchema, SignupDto } from '../dto/signup.dto';
import { loginSchema, LoginDto } from '../dto/login.dto';
import { verifyEmailOtpSchema, VerifyEmailOtpDto } from '../dto/verify-email-otp.dto';
import { createPinSchema, CreatePinDto } from '../dto/create-pin.dto';
import { verifyPinSchema, VerifyPinDto } from '../dto/verify-pin.dto';
import { forgotPasswordSchema, ForgotPasswordDto } from '../dto/forgot-password.dto';
import { verifyPasswordOtpSchema, VerifyPasswordOtpDto } from '../dto/verify-password-otp.dto';
import { resetPasswordSchema, ResetPasswordDto } from '../dto/reset-password.dto';
import { forgotPinSchema, ForgotPinDto } from '../dto/forgot-pin.dto';
import { verifyPinOtpSchema, VerifyPinOtpDto } from '../dto/verify-pin-otp.dto';
import { resetPinSchema, ResetPinDto } from '../dto/reset-pin.dto';
import { resendEmailOtpSchema, ResendEmailOtpDto } from '../dto/resend-otp.dto';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const ACCESS_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User Signup', description: 'Registers a new user and sends an email verification OTP.' })
  @ApiResponse({ status: 201, description: 'Registration successful.' })
  @ApiResponse({ status: 400, description: 'Validation or duplicate email error.' })
  @UsePipes(new ZodValidationPipe(signupSchema))
  async signup(@Body() dto: SignupDto) {
    const data = await this.authService.signup(dto);
    return successResponse('Registration successful. Verify your email.', data);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Email OTP', description: 'Verifies the OTP sent to user email.' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
  @UsePipes(new ZodValidationPipe(verifyEmailOtpSchema))
  async verifyEmail(@Body() dto: VerifyEmailOtpDto) {
    const data = await this.authService.verifyEmail(dto);
    return successResponse('Email verified.', data);
  }

  @Post('resend-email-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend Email OTP', description: 'Resends a fresh OTP code to user email.' })
  @ApiResponse({ status: 200, description: 'OTP resent successfully.' })
  @UsePipes(new ZodValidationPipe(resendEmailOtpSchema))
  async resendEmailOtp(@Body() dto: ResendEmailOtpDto) {
    await this.authService.resendEmailOtp(dto);
    return successResponse('OTP resent successfully.');
  }

  @Post('create-pin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Security PIN', description: 'Creates a 4-digit security PIN for user.' })
  @ApiResponse({ status: 200, description: 'PIN created successfully.' })
  @UsePipes(new ZodValidationPipe(createPinSchema))
  async createPin(@Body() dto: CreatePinDto) {
    const data = await this.authService.createPin(dto);
    return successResponse(data.message);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Email & Password', description: 'Validates credentials and prompts for PIN verification.' })
  @ApiResponse({ status: 200, description: 'Credentials verified; PIN verification required.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return successResponse('PIN verification required.', data);
  }

  @Post('verify-pin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify PIN & Issue Access/Refresh Tokens', description: 'Verifies PIN and sets refresh token cookie, returning JWT access token.' })
  @ApiResponse({ status: 200, description: 'Login successful, access token issued.' })
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
  @ApiOperation({ summary: 'Refresh Access Token', description: 'Uses refresh_token cookie to issue a new access token.' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token.' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookieToken = (req.cookies as Record<string, string>)[
      REFRESH_TOKEN_COOKIE
    ];
    if (!cookieToken) {
      return { success: false, message: 'Refresh token missing', errors: [] };
    }

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
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Logout Current Session', description: 'Invalidates current session and clears refresh token cookie.' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.user.sessionId) {
      await this.authService.logout(req.user.sessionId);
    }
    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    return successResponse('Logged out successfully.');
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Logout All Sessions', description: 'Revokes all active sessions for the user across devices.' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices.' })
  async logoutAll(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(req.user.sub);
    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    return successResponse('Logged out from all devices.');
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forgot Password Request', description: 'Triggers password reset OTP email.' })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent.' })
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return successResponse('If the email exists, an OTP has been sent.');
  }

  @Post('verify-password-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Password Reset OTP', description: 'Validates OTP for resetting password.' })
  @ApiResponse({ status: 200, description: 'OTP verified.' })
  @UsePipes(new ZodValidationPipe(verifyPasswordOtpSchema))
  async verifyPasswordOtp(@Body() dto: VerifyPasswordOtpDto) {
    const data = await this.authService.verifyPasswordOtp(dto);
    return successResponse('OTP verified. You may reset your password.', data);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset Password', description: 'Sets a new password for user.' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return successResponse('Password reset successfully.');
  }

  @Post('forgot-pin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forgot PIN Request', description: 'Triggers PIN reset OTP email.' })
  @ApiResponse({ status: 200, description: 'PIN reset OTP sent.' })
  @UsePipes(new ZodValidationPipe(forgotPinSchema))
  async forgotPin(@Body() dto: ForgotPinDto) {
    await this.authService.forgotPin(dto);
    return successResponse('If the email exists, an OTP has been sent.');
  }

  @Post('verify-pin-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify PIN Reset OTP', description: 'Validates OTP for resetting PIN.' })
  @ApiResponse({ status: 200, description: 'OTP verified.' })
  @UsePipes(new ZodValidationPipe(verifyPinOtpSchema))
  async verifyPinOtp(@Body() dto: VerifyPinOtpDto) {
    const data = await this.authService.verifyPinOtp(dto);
    return successResponse('OTP verified. You may reset your PIN.', data);
  }

  @Post('reset-pin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset Security PIN', description: 'Sets a new security PIN for user.' })
  @ApiResponse({ status: 200, description: 'PIN reset successfully.' })
  @UsePipes(new ZodValidationPipe(resetPinSchema))
  async resetPin(@Body() dto: ResetPinDto) {
    await this.authService.resetPin(dto);
    return successResponse('PIN reset successfully.');
  }
}
