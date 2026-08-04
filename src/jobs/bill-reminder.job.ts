import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BillReminderJob {
  private readonly logger = new Logger(BillReminderJob.name);

  execute() {
    this.logger.log('Executing Bill Reminder job...');
  }
}
