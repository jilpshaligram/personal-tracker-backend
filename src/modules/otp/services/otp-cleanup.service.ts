import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Otp } from '../schemas/otp.schema';

@Injectable()
export class OtpCleanupService {
  private readonly logger = new Logger(OtpCleanupService.name);

  constructor(@InjectModel(Otp) private readonly otpModel: typeof Otp) {}

  /**
   * Runs every 10 minutes.
   * Hard-deletes all OTP rows where expiresAt < NOW().
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async deleteExpiredOtps(): Promise<void> {
    const deleted = await this.otpModel.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });

    if (deleted > 0) {
      this.logger.log(`Cleaned up ${deleted} expired OTP record(s).`);
    }
  }
}
