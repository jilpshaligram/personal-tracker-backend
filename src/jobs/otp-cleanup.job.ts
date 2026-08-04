import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OtpCleanupJob {
  private readonly logger = new Logger(OtpCleanupJob.name);

  async execute() {
    this.logger.log('Executing OTP cleanup job...');
  }
}
