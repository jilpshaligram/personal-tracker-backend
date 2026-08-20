import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { OtpService } from '../../otp/services/otp.service';
import { UserSessionService } from '../../user-session/services/user-session.service';
import { SecurityService } from '../../../infrastructure/security/security.service';
import { MailService } from '../../../infrastructure/mail/mail.service';
import { OtpPurpose } from '../../otp/enums/otp-purpose.enum';
import { UserStatus } from '../../users/enums/user-status.enum';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { VerifyEmailOtpDto } from '../dto/verify-email-otp.dto';
import { CreatePinDto } from '../dto/create-pin.dto';
import { VerifyPinDto } from '../dto/verify-pin.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { VerifyPasswordOtpDto } from '../dto/verify-password-otp.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ForgotPinDto } from '../dto/forgot-pin.dto';
import { VerifyPinOtpDto } from '../dto/verify-pin-otp.dto';
import { ResetPinDto } from '../dto/reset-pin.dto';
import { ResendEmailOtpDto } from '../dto/resend-otp.dto';
import { IDeviceInfo } from '../../user-session/interfaces/device-info.interface';
import { Gender } from '../../users/enums/gender.enum';

const PIN_LOCK_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly userSessionService: UserSessionService,
    private readonly securityService: SecurityService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Validates that all signup fields match the existing user record.
   * Password is excluded from validation as it can be updated.
   * Performs all validations before returning to prevent timing attacks.
   * @param dto - The signup DTO with submitted user data
   * @param user - The existing user record from database
   * @returns true if all fields match, false otherwise
   */
  private validateAllSignupFieldsExceptPassword(
    dto: SignupDto,
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      gender: string;
    },
  ): boolean {
    // Validate all fields except password
    const firstNameMatch = dto.firstName === user.firstName;
    const lastNameMatch = dto.lastName === user.lastName;
    const emailMatch = dto.email === user.email;
    const phoneMatch = dto.phone === user.phone;
    const dateOfBirthMatch = dto.dateOfBirth === user.dateOfBirth;
    const genderMatch = dto.gender === user.gender;

    // Debug logging to identify field mismatches
    if (!firstNameMatch)
      console.log(
        `[DEV] firstName mismatch: "${dto.firstName}" vs "${user.firstName}"`,
      );
    if (!lastNameMatch)
      console.log(
        `[DEV] lastName mismatch: "${dto.lastName}" vs "${user.lastName}"`,
      );
    if (!emailMatch)
      console.log(`[DEV] email mismatch: "${dto.email}" vs "${user.email}"`);
    if (!phoneMatch)
      console.log(`[DEV] phone mismatch: "${dto.phone}" vs "${user.phone}"`);
    if (!dateOfBirthMatch)
      console.log(
        `[DEV] dateOfBirth mismatch: "${dto.dateOfBirth}" vs "${user.dateOfBirth}"`,
      );
    if (!genderMatch)
      console.log(`[DEV] gender mismatch: "${dto.gender}" vs "${user.gender}"`);

    // Return true only if ALL fields (except password) match
    return (
      firstNameMatch &&
      lastNameMatch &&
      emailMatch &&
      phoneMatch &&
      dateOfBirthMatch &&
      genderMatch
    );
  }

  async signup(dto: SignupDto): Promise<{ email: string; nextStep: string }> {
    const existingByEmail = await this.usersService.findByEmail(dto.email);
    const existingByPhone = await this.usersService.findByPhone(dto.phone);

    // ── Resumable signup ─────────────────────────────────────────────────────
    // If the user already exists but never finished onboarding (PENDING status,
    // not verified, no PIN), allow them to re-enter the flow by re-sending OTP.
    // We verify all signup fields (except password) match. If password differs,
    // we update it to the new value.
    const existing = existingByEmail ?? existingByPhone;
    if (existing) {
      const isResumable =
        existing.status === UserStatus.PENDING &&
        !existing.isVerified &&
        !existing.isPinCreated;

      if (!isResumable) {
        // Account is already active / verified — real conflict
        throw new ConflictException({
          success: false,
          message: existingByEmail
            ? 'Email already registered'
            : 'Phone number already registered',
          errors: [],
        });
      }

      // Verify it's the same person (all fields except password must match)
      const allFieldsMatch = this.validateAllSignupFieldsExceptPassword(
        dto,
        existing,
      );
      if (!allFieldsMatch) {
        throw new ConflictException({
          success: false,
          message: existingByEmail
            ? 'Email already registered'
            : 'Phone number already registered',
          errors: [],
        });
      }

      // Check if password is different and update if needed
      const passwordMatches = await this.securityService.compare(
        dto.password,
        existing.password,
      );
      if (!passwordMatches) {
        console.log(
          `[DEV] Updating password for resumable signup: ${existing.email}`,
        );
        const newHashedPassword = await this.securityService.hash(dto.password);
        await this.usersService.updatePassword(existing.id, newHashedPassword);
      }

      const otp = await this.otpService.createOtp(
        existing.id,
        existing.email,
        OtpPurpose.EMAIL_VERIFICATION,
      );

      console.log(`[DEV] Resumable signup OTP for ${existing.email}: ${otp}`);

      try {
        await this.mailService.sendOtpEmail(
          existing.email,
          otp,
          OtpPurpose.EMAIL_VERIFICATION,
        );
      } catch (mailErr) {
        console.error(
          '[MailService] Failed to send resumable signup OTP:',
          (mailErr as Error).message,
        );
      }

      return { email: existing.email, nextStep: 'VERIFY_EMAIL_OTP' };
    }

    const hashedPassword = await this.securityService.hash(dto.password);

    const user = await this.usersService.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      dateOfBirth: dto.dateOfBirth,
      gender: dto.gender as Gender,
      password: hashedPassword,
    });

    const otp = await this.otpService.createOtp(
      user.id,
      user.email,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    console.log(`[DEV] Email OTP for ${user.email}: ${otp}`);

    try {
      await this.mailService.sendOtpEmail(
        user.email,
        otp,
        OtpPurpose.EMAIL_VERIFICATION,
      );
    } catch (mailErr) {
      console.error(
        '[MailService] Failed to send email OTP:',
        (mailErr as Error).message,
      );
    }

    return { email: user.email, nextStep: 'VERIFY_EMAIL_OTP' };
  }

  async verifyEmail(
    dto: VerifyEmailOtpDto,
  ): Promise<{ nextStep: string; onboardingToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }

    await this.otpService.verifyOtp(
      user.id,
      OtpPurpose.EMAIL_VERIFICATION,
      dto.otp,
    );
    await this.usersService.markEmailVerified(user.id);

    const onboardingToken = await this.securityService.generateOnboardingToken({
      sub: user.id,
      email: user.email,
    });

    return { nextStep: 'CREATE_SECURITY_PIN', onboardingToken };
  }

  async createPin(
    userId: string,
    dto: CreatePinDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }

    if (dto.email && user.email !== dto.email) {
      throw new BadRequestException({
        success: false,
        message: 'Token does not match provided email',
        errors: [],
      });
    }

    if (user.status !== UserStatus.EMAIL_VERIFIED) {
      throw new BadRequestException({
        success: false,
        message: 'Email verification required before creating PIN',
        errors: [],
      });
    }

    const hashedPin = await this.securityService.hash(dto.pin);
    await this.usersService.setPin(user.id, hashedPin);

    return { message: 'Account setup completed.' };
  }

  async login(dto: LoginDto): Promise<{ nextStep: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
        errors: [],
      });
    }

    const isPasswordValid = await this.securityService.compare(
      dto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
        errors: [],
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        success: false,
        message: 'Account is not active. Complete the registration steps.',
        errors: [],
      });
    }

    if (!user.isVerified) {
      throw new UnauthorizedException({
        success: false,
        message: 'Account is not verified',
        errors: [],
      });
    }

    if (!user.isPinCreated) {
      throw new UnauthorizedException({
        success: false,
        message: 'Security PIN not created',
        errors: [],
      });
    }

    return { nextStep: 'VERIFY_PIN' };
  }

  async verifyPinAndIssueTokens(
    dto: VerifyPinDto,
    deviceInfo: IDeviceInfo,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid credentials',
        errors: [],
      });
    }

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.pinLockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException({
        success: false,
        message: `PIN is locked. Try again in ${minutesLeft} minute(s).`,
        errors: [],
      });
    }

    if (!user.pin) {
      throw new BadRequestException({
        success: false,
        message: 'PIN not set',
        errors: [],
      });
    }

    const isPinValid = await this.securityService.compare(dto.pin, user.pin);
    if (!isPinValid) {
      const attempts = await this.usersService.incrementWrongPinAttempts(
        user.id,
      );
      if (attempts >= PIN_LOCK_ATTEMPTS) {
        throw new UnauthorizedException({
          success: false,
          message:
            'Too many wrong PIN attempts. Account locked for 30 minutes.',
          errors: [],
        });
      }
      throw new UnauthorizedException({
        success: false,
        message: `Invalid PIN. ${PIN_LOCK_ATTEMPTS - attempts} attempt(s) remaining.`,
        errors: [],
      });
    }

    await this.usersService.resetPinAttempts(user.id);

    const session = await this.userSessionService.createSession({
      userId: user.id,
      hashedRefreshToken: 'pending',
      deviceInfo,
      loginMethod: 'email_pin',
    });

    const accessToken = await this.securityService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    const refreshToken = await this.securityService.generateRefreshToken({
      sub: user.id,
      sessionId: session.id,
    });

    const hashedRefreshToken = await this.securityService.hash(refreshToken);
    await this.userSessionService.updateSessionToken(
      session.id,
      hashedRefreshToken,
    );

    return { accessToken, refreshToken };
  }

  async refreshToken(
    cookieToken: string,
  ): Promise<{ accessToken: string; newRefreshToken: string }> {
    let payload: Awaited<ReturnType<SecurityService['verifyRefreshToken']>>;
    try {
      payload = await this.securityService.verifyRefreshToken(cookieToken);
    } catch {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid refresh token',
        errors: [],
      });
    }

    if (!payload.sessionId) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid session',
        errors: [],
      });
    }

    const session = await this.userSessionService.findActiveSessionById(
      payload.sessionId,
    );
    if (!session) {
      throw new UnauthorizedException({
        success: false,
        message: 'Session not found or expired',
        errors: [],
      });
    }

    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException({
        success: false,
        message: 'Session has expired',
        errors: [],
      });
    }

    const isTokenValid = await this.securityService.compare(
      cookieToken,
      session.refreshToken,
    );
    if (!isTokenValid) {
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid refresh token',
        errors: [],
      });
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }

    const newAccessToken = await this.securityService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    const newRefreshToken = await this.securityService.generateRefreshToken({
      sub: user.id,
      sessionId: session.id,
    });

    const hashedNewRefreshToken =
      await this.securityService.hash(newRefreshToken);
    await this.userSessionService.updateSessionToken(
      session.id,
      hashedNewRefreshToken,
    );

    return { accessToken: newAccessToken, newRefreshToken };
  }

  async logout(sessionId: string): Promise<void> {
    await this.userSessionService.revokeSession(sessionId);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.userSessionService.revokeAllSessionsByUserId(userId);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return;
    }

    const otp = await this.otpService.createOtp(
      user.id,
      user.email,
      OtpPurpose.PASSWORD_RESET,
    );

    console.log(`[DEV] Password Reset OTP for ${user.email}: ${otp}`);

    try {
      await this.mailService.sendOtpEmail(
        user.email,
        otp,
        OtpPurpose.PASSWORD_RESET,
      );
    } catch (mailErr) {
      console.error(
        '[MailService] Failed to send password reset OTP:',
        (mailErr as Error).message,
      );
    }
  }

  async verifyPasswordOtp(
    dto: VerifyPasswordOtpDto,
  ): Promise<{ verified: boolean; onboardingToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }

    await this.otpService.verifyOtp(
      user.id,
      OtpPurpose.PASSWORD_RESET,
      dto.otp,
    );

    const onboardingToken = await this.securityService.generateOnboardingToken({
      sub: user.id,
      email: user.email,
    });

    return { verified: true, onboardingToken };
  }

  async resetPassword(userId: string, dto: ResetPasswordDto): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }

    if (dto.email && user.email !== dto.email) {
      throw new BadRequestException({
        success: false,
        message: 'Token does not match provided email',
        errors: [],
      });
    }

    const hashedPassword = await this.securityService.hash(dto.newPassword);
    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.userSessionService.revokeAllSessionsByUserId(user.id);
  }

  async forgotPin(dto: ForgotPinDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return;
    }

    const otp = await this.otpService.createOtp(
      user.id,
      user.email,
      OtpPurpose.PIN_RESET,
    );

    console.log(`[DEV] PIN Reset OTP for ${user.email}: ${otp}`);

    try {
      await this.mailService.sendOtpEmail(
        user.email,
        otp,
        OtpPurpose.PIN_RESET,
      );
    } catch (mailErr) {
      console.error(
        '[MailService] Failed to send PIN reset OTP:',
        (mailErr as Error).message,
      );
    }
  }

  async verifyPinOtp(
    dto: VerifyPinOtpDto,
  ): Promise<{ verified: boolean; onboardingToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }

    await this.otpService.verifyOtp(user.id, OtpPurpose.PIN_RESET, dto.otp);

    const onboardingToken = await this.securityService.generateOnboardingToken({
      sub: user.id,
      email: user.email,
    });

    return { verified: true, onboardingToken };
  }

  async resetPin(userId: string, dto: ResetPinDto): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }

    if (dto.email && user.email !== dto.email) {
      throw new BadRequestException({
        success: false,
        message: 'Token does not match provided email',
        errors: [],
      });
    }

    const hashedPin = await this.securityService.hash(dto.newPin);
    await this.usersService.updatePin(user.id, hashedPin);
  }

  async resendEmailOtp(dto: ResendEmailOtpDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        errors: [],
      });
    }

    const otp = await this.otpService.resendOtp(
      user.id,
      user.email,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    console.log(`[DEV] Resend Email OTP for ${user.email}: ${otp}`);

    try {
      await this.mailService.sendOtpEmail(
        user.email,
        otp,
        OtpPurpose.EMAIL_VERIFICATION,
      );
    } catch (mailErr) {
      console.error(
        '[MailService] Failed to resend email OTP:',
        (mailErr as Error).message,
      );
    }
  }
}
