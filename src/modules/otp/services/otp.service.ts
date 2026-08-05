import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Otp } from '../schemas/otp.schema';
import { OtpPurpose } from '../enums/otp-purpose.enum';
import { SecurityService } from '../../../infrastructure/security/security.service';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const MAX_RESEND = 3;
const RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(Otp) private readonly otpModel: typeof Otp,
    private readonly securityService: SecurityService,
  ) {}

  async createOtp(
    userId: string,
    email: string,
    purpose: OtpPurpose,
  ): Promise<string> {
    await this.otpModel.update(
      { isVerified: true, verifiedAt: new Date() },
      { where: { userId, purpose, isVerified: false } },
    );

    const code = this.securityService.generateOtpCode();
    const hashedOtp = await this.securityService.hash(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    console.log(`\n==================================================`);
    console.log(
      `🔑 [OTP CREATED] Purpose: ${purpose} | Target: ${email} | OTP CODE: ${code}`,
    );
    console.log(`==================================================\n`);

    await this.otpModel.create({
      userId,
      email,
      otp: hashedOtp,
      purpose,
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      expiresAt,
      isVerified: false,
      resendCount: 0,
      lastSentAt: new Date(),
    });

    return code;
  }

  async verifyOtp(
    userId: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<Otp> {
    const otpRecord = await this.otpModel.findOne({
      where: {
        userId,
        purpose,
        isVerified: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRecord) {
      throw new BadRequestException({
        success: false,
        message: 'OTP not found or has expired',
        errors: [],
      });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new BadRequestException({
        success: false,
        message: 'Maximum OTP attempts exceeded. Please request a new OTP.',
        errors: [],
      });
    }

    const isMatch = await this.securityService.compare(code, otpRecord.otp);

    if (!isMatch) {
      await otpRecord.increment('attempts');
      const remaining = otpRecord.maxAttempts - (otpRecord.attempts + 1);
      throw new BadRequestException({
        success: false,
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
        errors: [],
      });
    }

    await otpRecord.update({ isVerified: true, verifiedAt: new Date() });
    return otpRecord;
  }

  async resendOtp(
    userId: string,
    email: string,
    purpose: OtpPurpose,
  ): Promise<string> {
    const lastOtp = await this.otpModel.findOne({
      where: { userId, purpose, isVerified: false },
      order: [['createdAt', 'DESC']],
    });

    if (lastOtp) {
      if (lastOtp.resendCount >= MAX_RESEND) {
        throw new BadRequestException({
          success: false,
          message: 'Maximum OTP resend limit reached. Please contact support.',
          errors: [],
        });
      }

      if (lastOtp.lastSentAt) {
        const secondsSinceLast =
          (Date.now() - lastOtp.lastSentAt.getTime()) / 1000;
        if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
          const waitSeconds = Math.ceil(
            RESEND_COOLDOWN_SECONDS - secondsSinceLast,
          );
          throw new HttpException(
            {
              success: false,
              message: `Please wait ${waitSeconds} second(s) before resending OTP.`,
              errors: [],
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      const code = this.securityService.generateOtpCode();
      const hashedOtp = await this.securityService.hash(code);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      console.log(`\n==================================================`);
      console.log(
        `🔑 [OTP RESENT] Purpose: ${purpose} | Target: ${email} | OTP CODE: ${code}`,
      );
      console.log(`==================================================\n`);

      await lastOtp.update({
        otp: hashedOtp,
        attempts: 0,
        expiresAt,
        resendCount: lastOtp.resendCount + 1,
        lastSentAt: new Date(),
      });

      return code;
    }

    return this.createOtp(userId, email, purpose);
  }

  async findLatestActiveOtpByEmail(
    email: string,
    purpose: OtpPurpose,
  ): Promise<Otp | null> {
    return this.otpModel.findOne({
      where: {
        email,
        purpose,
        isVerified: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });
  }
}
