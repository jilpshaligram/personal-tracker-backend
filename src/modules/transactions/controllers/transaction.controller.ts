import { Controller } from '@nestjs/common';
import { TransactionService } from '../services/transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}
}
