import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SavingGoalJob {
  private readonly logger = new Logger(SavingGoalJob.name);

  async execute() {
    this.logger.log('Executing Saving Goal job...');
  }
}
