import moment from 'moment';
import { BudgetPeriod } from '../../modules/budgets/enums/budget-period.enum';

export function calculateBudgetPeriodDates(period: BudgetPeriod): {
  startDate: string;
  endDate: string;
} {
  const now = moment();
  let start: moment.Moment;
  let end: moment.Moment;

  switch (period) {
    case BudgetPeriod.DAILY:
      start = now.clone().startOf('day');
      end = now.clone().endOf('day');
      break;
    case BudgetPeriod.WEEKLY:
      start = now.clone().startOf('isoWeek');
      end = now.clone().endOf('isoWeek');
      break;
    case BudgetPeriod.MONTHLY:
      start = now.clone().startOf('month');
      end = now.clone().endOf('month');
      break;
    case BudgetPeriod.YEARLY:
      start = now.clone().startOf('year');
      end = now.clone().endOf('year');
      break;
    default:
      throw new Error(`Unsupported budget period: ${String(period)}`);
  }

  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD'),
  };
}
