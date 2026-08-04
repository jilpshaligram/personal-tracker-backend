import { Controller } from '@nestjs/common';
import { SavingTransactionService } from '../services/saving-transaction.service';

@Controller('saving-transactions')
export class SavingTransactionController {
  constructor(
    private readonly savingTransactionService: SavingTransactionService,
  ) {}
}
