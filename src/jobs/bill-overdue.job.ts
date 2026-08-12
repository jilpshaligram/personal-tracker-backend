import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Bill } from '../modules/bills/schemas/bill.schema';
import { BillStatus } from '../modules/bills/enums/bill-status.enum';
import { Op } from 'sequelize';

@Injectable()
export class BillOverdueJob {
  private readonly logger = new Logger(BillOverdueJob.name);

  constructor(
    @InjectModel(Bill)
    private readonly billModel: typeof Bill,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async execute() {
    this.logger.log('Executing Bill Overdue job...');

    try {
      const today = new Date().toISOString().split('T')[0];

      const [affectedRows] = await this.billModel.update(
        { status: BillStatus.OVERDUE },
        {
          where: {
            status: BillStatus.PENDING,
            dueDate: { [Op.lt]: today },
            deletedAt: null,
          },
        },
      );

      this.logger.log(
        `Bill Overdue job completed - ${affectedRows} bills marked as overdue`,
      );
    } catch (error) {
      this.logger.error('Bill Overdue job failed', error);
    }
  }
}
