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
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { successResponse } from '../../../common/responses/api-response.helper';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { Public } from '../../../common/decorators/public.decorator';
import type { IJwtPayload } from '../interfaces/jwt-payload.interface';

import { signupSchema } from '../dto/signup.dto';
import type { SignupDto } from '../dto/signup.dto';
import { loginSchema } from '../dto/login.dto';
import type { LoginDto } from '../dto/login.dto';
import { verifyEmailOtpSchema } from '../dto/verify-email-otp.dto';
import type { VerifyEmailOtpDto } from '../dto/verify-email-otp.dto';
import { createPinSchema } from '../dto/create-pin.dto';
import type { CreatePinDto } from '../dto/create-pin.dto';
import { verifyPinSchema } from '../dto/verify-pin.dto';
import type { VerifyPinDto } from '../dto/verify-pin.dto';
import { forgotPasswordSchema } from '../dto/forgot-password.dto';
import type { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { verifyPasswordOtpSchema } from '../dto/verify-password-otp.dto';
import type { VerifyPasswordOtpDto } from '../dto/verify-password-otp.dto';
import { resetPasswordSchema } from '../dto/reset-password.dto';
import type { ResetPasswordDto } from '../dto/reset-password.dto';
import { forgotPinSchema } from '../dto/forgot-pin.dto';
import type { ForgotPinDto } from '../dto/forgot-pin.dto';
import { verifyPinOtpSchema } from '../dto/verify-pin-otp.dto';
import type { VerifyPinOtpDto } from '../dto/verify-pin-otp.dto';
import { resetPinSchema } from '../dto/reset-pin.dto';
import type { ResetPinDto } from '../dto/reset-pin.dto';
import { resendEmailOtpSchema } from '../dto/resend-otp.dto';
import type { ResendEmailOtpDto } from '../dto/resend-otp.dto';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface AuthenticatedRequest extends Request {
  user: IJwtPayload;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(signupSchema))
  async signup(@Body() dto: SignupDto) {
    const data = await this.authService.signup(dto);
    return successResponse('Registration successful. Verify your email.', data);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(verifyEmailOtpSchema))
  async verifyEmail(@Body() dto: VerifyEmailOtpDto) {
    const data = await this.authService.verifyEmail(dto);
    return successResponse('Email verified.', data);
  }

  @Post('resend-email-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resendEmailOtpSchema))
  async resendEmailOtp(@Body() dto: ResendEmailOtpDto) {
    await this.authService.resendEmailOtp(dto);
    return successResponse('OTP resent successfully.');
  }

  @Post('create-pin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(createPinSchema))
  async createPin(@Body() dto: CreatePinDto) {
    const data = await this.authService.createPin(dto);
    return successResponse(data.message);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return successResponse('PIN verification required.', data);
  }

  @Post('verify-pin')
  @Public()
  @HttpCode(HttpStatus.OK)
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

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return successResponse('Login successful.', { accessToken });
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(HttpStatus.OK)
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

    res.cookie(REFRESH_TOKEN_COOKIE, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return successResponse('Token refreshed.', { accessToken });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (req.user.sessionId) {
      await this.authService.logout(req.user.sessionId);
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    return successResponse('Logged out successfully.');
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async logoutAll(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(req.user.sub);
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    return successResponse('Logged out from all devices.');
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(forgotPasswordSchema))
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return successResponse('If the email exists, an OTP has been sent.');
  }

  @Post('verify-password-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(verifyPasswordOtpSchema))
  async verifyPasswordOtp(@Body() dto: VerifyPasswordOtpDto) {
    const data = await this.authService.verifyPasswordOtp(dto);
    return successResponse('OTP verified. You may reset your password.', data);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resetPasswordSchema))
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return successResponse('Password reset successfully.');
  }

  @Post('forgot-pin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(forgotPinSchema))
  async forgotPin(@Body() dto: ForgotPinDto) {
    await this.authService.forgotPin(dto);
    return successResponse('If the email exists, an OTP has been sent.');
  }

  @Post('verify-pin-otp')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(verifyPinOtpSchema))
  async verifyPinOtp(@Body() dto: VerifyPinOtpDto) {
    const data = await this.authService.verifyPinOtp(dto);
    return successResponse('OTP verified. You may reset your PIN.', data);
  }

  @Post('reset-pin')
  @Public()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(resetPinSchema))
  async resetPin(@Body() dto: ResetPinDto) {
    await this.authService.resetPin(dto);
    return successResponse('PIN reset successfully.');
  }
}
