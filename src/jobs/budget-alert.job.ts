import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BudgetAlertJob {
  private readonly logger = new Logger(BudgetAlertJob.name);

  async execute() {
    this.logger.log('Executing Budget Alert job...');
  }
}
